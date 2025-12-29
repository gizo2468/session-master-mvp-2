import { supabase } from '@/integrations/supabase/client';

// In-memory storage for token received before auth
let pendingToken: { token: string; platform: string } | null = null;
let isListenerSetup = false;

/**
 * Save push token to database when user is authenticated
 */
async function savePushToken(token: string, platform: string): Promise<boolean> {
  try {
    // Check if we have an authenticated session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('[PUSH TOKEN] No authenticated session, storing token for later');
      pendingToken = { token, platform };
      setupAuthListener();
      return false;
    }

    const userId = session.user.id;
    console.log('[PUSH TOKEN] Saving token for user:', userId);

    // Upsert to prevent duplicates (unique constraint on user_id, push_token)
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          platform,
          push_token: token,
        },
        {
          onConflict: 'user_id,push_token',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error('[PUSH TOKEN] Error saving token:', error);
      return false;
    }

    console.log('[PUSH TOKEN] Token saved successfully');
    pendingToken = null;
    return true;
  } catch (err) {
    console.error('[PUSH TOKEN] Unexpected error:', err);
    return false;
  }
}

/**
 * Set up auth state listener to save pending token when user signs in
 */
function setupAuthListener() {
  if (isListenerSetup) return;
  isListenerSetup = true;

  console.log('[PUSH TOKEN] Setting up auth listener for pending token');

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user && pendingToken) {
      console.log('[PUSH TOKEN] User signed in, saving pending token');
      savePushToken(pendingToken.token, pendingToken.platform);
    }
  });
}

/**
 * Public function to register a push token
 * Called from main.tsx when iOS token is received
 */
export async function registerPushToken(token: string, platform: string = 'ios'): Promise<void> {
  console.log('[PUSH TOKEN] Registering token, platform:', platform);
  await savePushToken(token, platform);
}

/**
 * Remove push token when user logs out (optional cleanup)
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('push_token', token);
    
    if (error) {
      console.error('[PUSH TOKEN] Error removing token:', error);
    } else {
      console.log('[PUSH TOKEN] Token removed successfully');
    }
  } catch (err) {
    console.error('[PUSH TOKEN] Unexpected error removing token:', err);
  }
}
