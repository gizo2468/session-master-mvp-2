import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// No CORS headers needed - this is an internal cron-scheduled function
// that doesn't receive browser requests

const SUPABASE_URL = 'https://wfmvvpbpuqbzidptxbqx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (_req) => {
  try {
    console.log('[session-reminders] Starting scheduled reminder check...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    
    // Track created notifications
    const results = {
      hand_review_reminder: 0,
      live_session_still_active: 0,
      multi_day_tournament_reminder: 0,
    };

    // =========================================
    // 1. HAND REVIEW REMINDER (for coaches)
    // =========================================
    console.log('[session-reminders] Checking for hands awaiting review...');
    
    // Find hands >24h old in shared sessions without feedback
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingHands, error: handsError } = await supabase
      .from('session_hands_new')
      .select(`
        id,
        session_id,
        user_id,
        created_at
      `)
      .lt('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });
    
    if (handsError) {
      console.error('[session-reminders] Error fetching hands:', handsError);
    } else if (pendingHands && pendingHands.length > 0) {
      // Get shared sessions to find which coaches have access
      const sessionIds = [...new Set(pendingHands.map(h => h.session_id))];
      
      const { data: sharedSessions } = await supabase
        .from('shared_sessions')
        .select('session_id, coach_id, player_id')
        .in('session_id', sessionIds);
      
      if (sharedSessions && sharedSessions.length > 0) {
        // Get existing feedback to exclude hands that already have feedback
        const handIds = pendingHands.map(h => h.id);
        const { data: existingFeedback } = await supabase
          .from('hand_feedback')
          .select('hand_id, coach_id')
          .in('hand_id', handIds);
        
        const feedbackSet = new Set(
          (existingFeedback || []).map(f => `${f.hand_id}-${f.coach_id}`)
        );
        
        // Group pending hands by coach
        const coachPendingHands: Record<string, { hands: typeof pendingHands, oldestSessionId: string }> = {};
        
        for (const hand of pendingHands) {
          const sharedForSession = sharedSessions.filter(ss => ss.session_id === hand.session_id);
          
          for (const shared of sharedForSession) {
            // Skip if coach already gave feedback on this hand
            if (feedbackSet.has(`${hand.id}-${shared.coach_id}`)) continue;
            
            if (!coachPendingHands[shared.coach_id]) {
              coachPendingHands[shared.coach_id] = { hands: [], oldestSessionId: hand.session_id };
            }
            coachPendingHands[shared.coach_id].hands.push(hand);
          }
        }
        
        // Check for recent reminders and send grouped notifications
        for (const [coachId, data] of Object.entries(coachPendingHands)) {
          if (data.hands.length === 0) continue;
          
          // Check if we already sent a reminder in last 24h
          const { data: recentReminder } = await supabase
            .from('notifications')
            .select('id')
            .eq('recipient_user_id', coachId)
            .eq('type', 'hand_review_reminder')
            .gte('created_at', twentyFourHoursAgo)
            .limit(1);
          
          if (recentReminder && recentReminder.length > 0) {
            console.log(`[session-reminders] Skipping hand_review_reminder for coach ${coachId} - recent reminder exists`);
            continue;
          }
          
          // Get player username for the oldest hand
          const oldestHand = data.hands[0];
          const { data: playerProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', oldestHand.user_id)
            .single();
          
          const playerName = playerProfile?.username || 'A player';
          const handCount = data.hands.length;
          
          const { error: insertError } = await supabase
            .from('notifications')
            .insert({
              recipient_user_id: coachId,
              sender_user_id: oldestHand.user_id,
              type: 'hand_review_reminder',
              title: `${handCount} hand${handCount > 1 ? 's' : ''} waiting for review`,
              body: `${playerName} has hands waiting for your feedback`,
              session_id: data.oldestSessionId,
              hand_id: oldestHand.id,
            });
          
          if (!insertError) {
            results.hand_review_reminder++;
            console.log(`[session-reminders] Created hand_review_reminder for coach ${coachId}`);
          } else {
            console.error(`[session-reminders] Error creating hand_review_reminder:`, insertError);
          }
        }
      }
    }

    // =========================================
    // 2. LIVE SESSION STILL ACTIVE (12h + 24h)
    // =========================================
    console.log('[session-reminders] Checking for long-running live sessions...');
    
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    
    // Find active sessions older than 12 hours
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, user_id, start_time, format, is_multi_day')
      .eq('is_active', true)
      .eq('status', 'active')
      .lt('start_time', twelveHoursAgo);
    
    if (sessionsError) {
      console.error('[session-reminders] Error fetching active sessions:', sessionsError);
    } else if (activeSessions && activeSessions.length > 0) {
      for (const session of activeSessions) {
        const sessionStart = new Date(session.start_time);
        const hoursActive = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
        
        // Determine reminder type: 12h or 24h
        let reminderBody: string;
        let checkWindowStart: string;
        
        if (hoursActive >= 24) {
          reminderBody = 'Your session has been active for over 24 hours. Remember to end it when done!';
          // For 24h reminder, check if we sent one in the last 12h (after the 12h mark)
          checkWindowStart = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
        } else {
          reminderBody = 'Your session has been active for over 12 hours. Is it still running?';
          // For 12h reminder, check if we ever sent one for this session
          checkWindowStart = session.start_time;
        }
        
        // Check for recent reminder for session owner
        const { data: recentOwnerReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('recipient_user_id', session.user_id)
          .eq('session_id', session.id)
          .eq('type', 'live_session_still_active')
          .gte('created_at', checkWindowStart)
          .limit(1);
        
        if (!recentOwnerReminder || recentOwnerReminder.length === 0) {
          // Send to session owner
          const { error: ownerError } = await supabase
            .from('notifications')
            .insert({
              recipient_user_id: session.user_id,
              type: 'live_session_still_active',
              title: 'Session still active',
              body: reminderBody,
              session_id: session.id,
            });
          
          if (!ownerError) {
            results.live_session_still_active++;
            console.log(`[session-reminders] Created live_session_still_active for owner ${session.user_id}`);
          }
        }
        
        // Get connected coaches via shared_sessions
        const { data: sharedWithCoaches } = await supabase
          .from('shared_sessions')
          .select('coach_id')
          .eq('session_id', session.id);
        
        if (sharedWithCoaches && sharedWithCoaches.length > 0) {
          for (const shared of sharedWithCoaches) {
            // Check for recent reminder for this coach
            const { data: recentCoachReminder } = await supabase
              .from('notifications')
              .select('id')
              .eq('recipient_user_id', shared.coach_id)
              .eq('session_id', session.id)
              .eq('type', 'live_session_still_active')
              .gte('created_at', checkWindowStart)
              .limit(1);
            
            if (!recentCoachReminder || recentCoachReminder.length === 0) {
              // Get player username
              const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', session.user_id)
                .single();
              
              const playerName = ownerProfile?.username || 'A player';
              
              const { error: coachError } = await supabase
                .from('notifications')
                .insert({
                  recipient_user_id: shared.coach_id,
                  sender_user_id: session.user_id,
                  type: 'live_session_still_active',
                  title: `${playerName}'s session still active`,
                  body: hoursActive >= 24 
                    ? `Session has been running for over 24 hours`
                    : `Session has been running for over 12 hours`,
                  session_id: session.id,
                });
              
              if (!coachError) {
                results.live_session_still_active++;
                console.log(`[session-reminders] Created live_session_still_active for coach ${shared.coach_id}`);
              }
            }
          }
        }
      }
    }

    // =========================================
    // 3. MULTI-DAY TOURNAMENT REMINDER
    // =========================================
    console.log('[session-reminders] Checking for multi-day tournaments...');
    
    // Find multi-day tournament sessions that are still active
    const { data: multiDayTournaments, error: mttError } = await supabase
      .from('sessions')
      .select('id, user_id, start_time, format')
      .eq('is_active', true)
      .eq('status', 'active')
      .eq('is_multi_day', true)
      .lt('start_time', twentyFourHoursAgo);
    
    if (mttError) {
      console.error('[session-reminders] Error fetching multi-day tournaments:', mttError);
    } else if (multiDayTournaments && multiDayTournaments.length > 0) {
      for (const tournament of multiDayTournaments) {
        // Check if reminder sent in last 24h for session owner
        const { data: recentOwnerReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('recipient_user_id', tournament.user_id)
          .eq('session_id', tournament.id)
          .eq('type', 'multi_day_tournament_reminder')
          .gte('created_at', twentyFourHoursAgo)
          .limit(1);
        
        if (!recentOwnerReminder || recentOwnerReminder.length === 0) {
          // Send to session owner
          const { error: ownerError } = await supabase
            .from('notifications')
            .insert({
              recipient_user_id: tournament.user_id,
              type: 'multi_day_tournament_reminder',
              title: 'Multi-day tournament reminder',
              body: 'Your tournament is still active. Ready to continue or end it?',
              session_id: tournament.id,
            });
          
          if (!ownerError) {
            results.multi_day_tournament_reminder++;
            console.log(`[session-reminders] Created multi_day_tournament_reminder for owner ${tournament.user_id}`);
          }
        }
        
        // Get connected coaches via shared_sessions
        const { data: sharedWithCoaches } = await supabase
          .from('shared_sessions')
          .select('coach_id')
          .eq('session_id', tournament.id);
        
        if (sharedWithCoaches && sharedWithCoaches.length > 0) {
          for (const shared of sharedWithCoaches) {
            // Check for recent reminder for this coach
            const { data: recentCoachReminder } = await supabase
              .from('notifications')
              .select('id')
              .eq('recipient_user_id', shared.coach_id)
              .eq('session_id', tournament.id)
              .eq('type', 'multi_day_tournament_reminder')
              .gte('created_at', twentyFourHoursAgo)
              .limit(1);
            
            if (!recentCoachReminder || recentCoachReminder.length === 0) {
              // Get player username
              const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', tournament.user_id)
                .single();
              
              const playerName = ownerProfile?.username || 'A player';
              
              const { error: coachError } = await supabase
                .from('notifications')
                .insert({
                  recipient_user_id: shared.coach_id,
                  sender_user_id: tournament.user_id,
                  type: 'multi_day_tournament_reminder',
                  title: `${playerName}'s tournament continues`,
                  body: 'Multi-day tournament is still in progress',
                  session_id: tournament.id,
                });
              
              if (!coachError) {
                results.multi_day_tournament_reminder++;
                console.log(`[session-reminders] Created multi_day_tournament_reminder for coach ${shared.coach_id}`);
              }
            }
          }
        }
      }
    }

    console.log('[session-reminders] Completed. Results:', results);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Session reminders processed',
        results 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('[session-reminders] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
