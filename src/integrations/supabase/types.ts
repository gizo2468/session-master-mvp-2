export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      coach_student_connections: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      donation_logs: {
        Row: {
          clicked_at: string
          id: string
          ip_address: string | null
          note: string | null
          platform: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          note?: string | null
          platform: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          note?: string | null
          platform?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hand_feedback: {
        Row: {
          coach_id: string
          created_at: string
          feedback_content: string
          hand_id: string
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          feedback_content: string
          hand_id: string
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          feedback_content?: string
          hand_id?: string
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_goals: {
        Row: {
          coach_id: string
          color: string | null
          created_at: string
          details: string | null
          due_date: string | null
          id: string
          image_url: string | null
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          color?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          color?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          coach_tier: string | null
          coaching_focus: string[] | null
          connection_code: string | null
          created_at: string
          default_currency: string | null
          deletion_requested: boolean | null
          experience: string | null
          has_accepted_terms: boolean | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          language: string
          last_login_at: string | null
          notification_preferences: Json
          online_nickname: string | null
          role: string
          students_coached_count: number
          updated_at: string
          username: string | null
        }
        Insert: {
          bio?: string | null
          coach_tier?: string | null
          coaching_focus?: string[] | null
          connection_code?: string | null
          created_at?: string
          default_currency?: string | null
          deletion_requested?: boolean | null
          experience?: string | null
          has_accepted_terms?: boolean | null
          id: string
          is_active?: boolean | null
          is_premium?: boolean | null
          language?: string
          last_login_at?: string | null
          notification_preferences?: Json
          online_nickname?: string | null
          role?: string
          students_coached_count?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          bio?: string | null
          coach_tier?: string | null
          coaching_focus?: string[] | null
          connection_code?: string | null
          created_at?: string
          default_currency?: string | null
          deletion_requested?: boolean | null
          experience?: string | null
          has_accepted_terms?: boolean | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          language?: string
          last_login_at?: string | null
          notification_preferences?: Json
          online_nickname?: string | null
          role?: string
          students_coached_count?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_hands: {
        Row: {
          amount_invested: number | null
          amount_won: number | null
          created_at: string | null
          currency_type: string | null
          flop_action: string | null
          flop_cards: string | null
          hand_image: string | null
          hand_notes: string | null
          hand_number: number | null
          hole_cards: string | null
          id: string
          position: string | null
          pot_size: number | null
          preflop_action: string | null
          river_action: string | null
          river_card: string | null
          session_id: string
          showdown_result: string | null
          table_id: string | null
          turn_action: string | null
          turn_card: string | null
          updated_at: string | null
        }
        Insert: {
          amount_invested?: number | null
          amount_won?: number | null
          created_at?: string | null
          currency_type?: string | null
          flop_action?: string | null
          flop_cards?: string | null
          hand_image?: string | null
          hand_notes?: string | null
          hand_number?: number | null
          hole_cards?: string | null
          id?: string
          position?: string | null
          pot_size?: number | null
          preflop_action?: string | null
          river_action?: string | null
          river_card?: string | null
          session_id: string
          showdown_result?: string | null
          table_id?: string | null
          turn_action?: string | null
          turn_card?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_invested?: number | null
          amount_won?: number | null
          created_at?: string | null
          currency_type?: string | null
          flop_action?: string | null
          flop_cards?: string | null
          hand_image?: string | null
          hand_notes?: string | null
          hand_number?: number | null
          hole_cards?: string | null
          id?: string
          position?: string | null
          pot_size?: number | null
          preflop_action?: string | null
          river_action?: string | null
          river_card?: string | null
          session_id?: string
          showdown_result?: string | null
          table_id?: string | null
          turn_action?: string | null
          turn_card?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      session_hands_new: {
        Row: {
          amount_invested: number | null
          amount_won: number | null
          created_at: string | null
          currency_type: string | null
          flop_action: string | null
          flop_cards: string | null
          hand_image: string | null
          hand_notes: string | null
          hand_number: number | null
          hole_cards: string | null
          id: string
          position: string | null
          pot_size: number | null
          preflop_action: string | null
          river_action: string | null
          river_card: string | null
          session_id: string
          showdown_result: string | null
          table_id: string | null
          turn_action: string | null
          turn_card: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_invested?: number | null
          amount_won?: number | null
          created_at?: string | null
          currency_type?: string | null
          flop_action?: string | null
          flop_cards?: string | null
          hand_image?: string | null
          hand_notes?: string | null
          hand_number?: number | null
          hole_cards?: string | null
          id?: string
          position?: string | null
          pot_size?: number | null
          preflop_action?: string | null
          river_action?: string | null
          river_card?: string | null
          session_id: string
          showdown_result?: string | null
          table_id?: string | null
          turn_action?: string | null
          turn_card?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          amount_invested?: number | null
          amount_won?: number | null
          created_at?: string | null
          currency_type?: string | null
          flop_action?: string | null
          flop_cards?: string | null
          hand_image?: string | null
          hand_notes?: string | null
          hand_number?: number | null
          hole_cards?: string | null
          id?: string
          position?: string | null
          pot_size?: number | null
          preflop_action?: string | null
          river_action?: string | null
          river_card?: string | null
          session_id?: string
          showdown_result?: string | null
          table_id?: string | null
          turn_action?: string | null
          turn_card?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_session_hands_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_session_hands_table_id"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "session_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_hands_new_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_hands_new_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "session_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      session_live_state: {
        Row: {
          session_id: string
          state: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          session_id: string
          state?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          session_id?: string
          state?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_live_state_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_results: {
        Row: {
          big_blinds_won: number | null
          created_at: string | null
          final_position: number | null
          hands_played: number | null
          hours_played: number | null
          id: string
          net_profit: number | null
          players_eliminated: number | null
          roi_percentage: number | null
          session_id: string
          total_bounties_earned: number | null
          total_buy_in: number | null
          total_cashout: number | null
          total_rebuy_amount: number | null
          total_rebuys: number | null
          tournament_entries: number | null
          updated_at: string | null
        }
        Insert: {
          big_blinds_won?: number | null
          created_at?: string | null
          final_position?: number | null
          hands_played?: number | null
          hours_played?: number | null
          id?: string
          net_profit?: number | null
          players_eliminated?: number | null
          roi_percentage?: number | null
          session_id: string
          total_bounties_earned?: number | null
          total_buy_in?: number | null
          total_cashout?: number | null
          total_rebuy_amount?: number | null
          total_rebuys?: number | null
          tournament_entries?: number | null
          updated_at?: string | null
        }
        Update: {
          big_blinds_won?: number | null
          created_at?: string | null
          final_position?: number | null
          hands_played?: number | null
          hours_played?: number | null
          id?: string
          net_profit?: number | null
          players_eliminated?: number | null
          roi_percentage?: number | null
          session_id?: string
          total_bounties_earned?: number | null
          total_buy_in?: number | null
          total_cashout?: number | null
          total_rebuy_amount?: number | null
          total_rebuys?: number | null
          tournament_entries?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      session_tables: {
        Row: {
          bounty_amount: number | null
          buy_in: number | null
          cashout: number | null
          created_at: string | null
          currency: string | null
          current_stack: number | null
          end_time: string | null
          end_time_utc: number | null
          final_position: number | null
          game_format: string | null
          id: string
          is_active: boolean | null
          players_eliminated: number | null
          rebuy_amount: number | null
          rebuys: number | null
          session_id: string
          stakes: string | null
          start_time: string | null
          start_time_utc: number | null
          starting_stack: number | null
          table_name: string | null
          table_notes: string | null
          table_type: string | null
          tournament_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bounty_amount?: number | null
          buy_in?: number | null
          cashout?: number | null
          created_at?: string | null
          currency?: string | null
          current_stack?: number | null
          end_time?: string | null
          end_time_utc?: number | null
          final_position?: number | null
          game_format?: string | null
          id?: string
          is_active?: boolean | null
          players_eliminated?: number | null
          rebuy_amount?: number | null
          rebuys?: number | null
          session_id: string
          stakes?: string | null
          start_time?: string | null
          start_time_utc?: number | null
          starting_stack?: number | null
          table_name?: string | null
          table_notes?: string | null
          table_type?: string | null
          tournament_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          bounty_amount?: number | null
          buy_in?: number | null
          cashout?: number | null
          created_at?: string | null
          currency?: string | null
          current_stack?: number | null
          end_time?: string | null
          end_time_utc?: number | null
          final_position?: number | null
          game_format?: string | null
          id?: string
          is_active?: boolean | null
          players_eliminated?: number | null
          rebuy_amount?: number | null
          rebuys?: number | null
          session_id?: string
          stakes?: string | null
          start_time?: string | null
          start_time_utc?: number | null
          starting_stack?: number | null
          table_name?: string | null
          table_notes?: string | null
          table_type?: string | null
          tournament_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_tables_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          big_blind: number | null
          buy_in: number | null
          cash_out: number | null
          created_at: string
          currency: string | null
          current_status: string | null
          email: string | null
          end_time: string | null
          format: string
          game_type: string
          id: string
          initial_buy_in: number | null
          is_active: boolean | null
          is_multi_day: boolean | null
          is_online: boolean | null
          itm_ratio_denominator: number | null
          itm_ratio_numerator: number | null
          location: string | null
          notes: string | null
          physical_location: string | null
          rebuy_amount: number | null
          rebuys: number | null
          roi: number | null
          session_duration: number | null
          small_blind: number | null
          start_time: string
          start_time_utc: number | null
          starting_bb: number | null
          status: string | null
          table_name: string | null
          tables_played: number | null
          tournament_types: string[] | null
          user_id: string
        }
        Insert: {
          big_blind?: number | null
          buy_in?: number | null
          cash_out?: number | null
          created_at?: string
          currency?: string | null
          current_status?: string | null
          email?: string | null
          end_time?: string | null
          format?: string
          game_type?: string
          id?: string
          initial_buy_in?: number | null
          is_active?: boolean | null
          is_multi_day?: boolean | null
          is_online?: boolean | null
          itm_ratio_denominator?: number | null
          itm_ratio_numerator?: number | null
          location?: string | null
          notes?: string | null
          physical_location?: string | null
          rebuy_amount?: number | null
          rebuys?: number | null
          roi?: number | null
          session_duration?: number | null
          small_blind?: number | null
          start_time: string
          start_time_utc?: number | null
          starting_bb?: number | null
          status?: string | null
          table_name?: string | null
          tables_played?: number | null
          tournament_types?: string[] | null
          user_id?: string
        }
        Update: {
          big_blind?: number | null
          buy_in?: number | null
          cash_out?: number | null
          created_at?: string
          currency?: string | null
          current_status?: string | null
          email?: string | null
          end_time?: string | null
          format?: string
          game_type?: string
          id?: string
          initial_buy_in?: number | null
          is_active?: boolean | null
          is_multi_day?: boolean | null
          is_online?: boolean | null
          itm_ratio_denominator?: number | null
          itm_ratio_numerator?: number | null
          location?: string | null
          notes?: string | null
          physical_location?: string | null
          rebuy_amount?: number | null
          rebuys?: number | null
          roi?: number | null
          session_duration?: number | null
          small_blind?: number | null
          start_time?: string
          start_time_utc?: number | null
          starting_bb?: number | null
          status?: string | null
          table_name?: string | null
          tables_played?: number | null
          tournament_types?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      shared_sessions: {
        Row: {
          coach_id: string
          created_at: string | null
          id: string
          player_id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          id?: string
          player_id: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          id?: string
          player_id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_bb_stack_updates: {
        Row: {
          bb: number | null
          big_blind: number | null
          created_at: string
          id: string
          level: number | null
          session_id: string
          small_blind: number | null
          stack: number | null
          table_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bb?: number | null
          big_blind?: number | null
          created_at?: string
          id?: string
          level?: number | null
          session_id: string
          small_blind?: number | null
          stack?: number | null
          table_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bb?: number | null
          big_blind?: number | null
          created_at?: string
          id?: string
          level?: number | null
          session_id?: string
          small_blind?: number | null
          stack?: number | null
          table_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_table_id"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "session_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_state: {
        Row: {
          created_at: string
          id: string
          screen_name: string
          session_id: string | null
          state_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          screen_name: string
          session_id?: string | null
          state_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          screen_name?: string
          session_id?: string | null
          state_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          paypal_order_id: string | null
          paypal_payment_id: string | null
          plan_type: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          plan_type: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_private_data: {
        Row: {
          address: Json | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          profile_picture: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          profile_picture?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          profile_picture?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_private_data_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          plan_type: string
          start_date: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          plan_type: string
          start_date: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          plan_type?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_available: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      connection_exists: {
        Args: { p_coach_id: string; p_student_id: string }
        Returns: boolean
      }
      end_session: {
        Args: {
          p_cash_out: number
          p_itm_ratio_denominator?: number
          p_itm_ratio_numerator?: number
          p_notes?: string
          p_roi?: number
          p_session_id: string
          p_tables_played?: number
        }
        Returns: boolean
      }
      generate_connection_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_safe_profile_data: {
        Args: { profile_user_id: string }
        Returns: {
          bio: string
          coach_tier: string
          coaching_focus: string[]
          experience: string
          id: string
          is_active: boolean
          online_nickname: string
          role: string
          students_coached_count: number
          username: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_session_statistics: {
        Args:
          | {
              p_currency?: string
              p_end_date?: string
              p_start_date?: string
              p_timeframe?: string
              p_user_id: string
            }
          | {
              p_end_date?: string
              p_start_date?: string
              p_timeframe?: string
              p_user_id: string
            }
        Returns: {
          average_bb100: number
          average_duration: number
          average_net_result: number
          final_tables: number
          first_place_finish: number
          hands_count: number
          net_hourly_rate: number
          net_result: number
          number_of_sessions: number
          profit_loss_ratio: number
          scope: string
          total_buy_ins: number
          total_duration: number
          total_payouts: number
          total_tables: number
          win_ratio: number
        }[]
      }
      is_coach_for_student: {
        Args: { coach_user_id: string; student_user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      search_coach_by_username: {
        Args: { p_username: string }
        Returns: {
          id: string
          role: string
          username: string
        }[]
      }
      search_student_by_username: {
        Args: { p_username: string }
        Returns: {
          id: string
          role: string
          username: string
        }[]
      }
      start_session: {
        Args: {
          p_big_blind?: number
          p_buy_in?: number
          p_format: string
          p_game_type: string
          p_is_multi_day?: boolean
          p_is_online?: boolean
          p_location: string
          p_physical_location?: string
          p_small_blind?: number
          p_starting_bb?: number
          p_table_name?: string
          p_tournament_types?: string[]
        }
        Returns: string
      }
      update_terms_acceptance: {
        Args: { accepted: boolean; user_id: string }
        Returns: boolean
      }
      update_user_premium_status: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
