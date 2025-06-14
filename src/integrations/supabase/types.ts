export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      coach_student_connections: {
        Row: {
          approved: boolean
          coach_id: string
          created_at: string
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          coach_id: string
          created_at?: string
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          coach_id?: string
          created_at?: string
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_student_connections_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_student_connections_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_to_hand_reviews: {
        Row: {
          coach_id: string
          created_at: string | null
          hand_id: string
          id: string
          message: string
          session_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          hand_id: string
          id?: string
          message: string
          session_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          hand_id?: string
          id?: string
          message?: string
          session_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_to_table_reviews: {
        Row: {
          coach_id: string
          created_at: string | null
          id: string
          message: string
          session_id: string
          student_id: string
          table_id: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          id?: string
          message: string
          session_id: string
          student_id: string
          table_id: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          id?: string
          message?: string
          session_id?: string
          student_id?: string
          table_id?: string
          updated_at?: string | null
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
      player_to_coach_reviews: {
        Row: {
          coach_id: string
          created_at: string
          hand_id: string | null
          id: string
          message: string
          player_id: string
          read: boolean
          review_type: string
          session_id: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          hand_id?: string | null
          id?: string
          message: string
          player_id: string
          read?: boolean
          review_type: string
          session_id?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          hand_id?: string | null
          id?: string
          message?: string
          player_id?: string
          read?: boolean
          review_type?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_to_coach_feedback_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_to_coach_feedback_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_to_coach_reviews_hand_id_fkey"
            columns: ["hand_id"]
            isOneToOne: false
            referencedRelation: "session_hands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          coach_tier: string | null
          connection_code: string | null
          created_at: string
          deletion_requested: boolean | null
          email: string | null
          full_name: string
          has_accepted_terms: boolean | null
          has_completed_tutorial: boolean | null
          has_seen_tutorial: boolean | null
          id: string
          is_active: boolean | null
          language: string
          last_login_at: string | null
          notification_preferences: Json
          online_nickname: string | null
          profile_picture: string | null
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          coach_tier?: string | null
          connection_code?: string | null
          created_at?: string
          deletion_requested?: boolean | null
          email?: string | null
          full_name: string
          has_accepted_terms?: boolean | null
          has_completed_tutorial?: boolean | null
          has_seen_tutorial?: boolean | null
          id: string
          is_active?: boolean | null
          language?: string
          last_login_at?: string | null
          notification_preferences?: Json
          online_nickname?: string | null
          profile_picture?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          coach_tier?: string | null
          connection_code?: string | null
          created_at?: string
          deletion_requested?: boolean | null
          email?: string | null
          full_name?: string
          has_accepted_terms?: boolean | null
          has_completed_tutorial?: boolean | null
          has_seen_tutorial?: boolean | null
          id?: string
          is_active?: boolean | null
          language?: string
          last_login_at?: string | null
          notification_preferences?: Json
          online_nickname?: string | null
          profile_picture?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_hand_associations: {
        Row: {
          created_at: string
          hand_id: string
          id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          hand_id: string
          id?: string
          review_id: string
        }
        Update: {
          created_at?: string
          hand_id?: string
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_hand_associations_hand_id_fkey"
            columns: ["hand_id"]
            isOneToOne: false
            referencedRelation: "session_hands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_hand_associations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "session_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      session_comments: {
        Row: {
          coach_id: string
          comment: string
          created_at: string
          hand_number: number | null
          id: string
          is_read: boolean | null
          review_category: string | null
          review_type: string | null
          session_id: string
          star_rating: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          comment: string
          created_at?: string
          hand_number?: number | null
          id?: string
          is_read?: boolean | null
          review_category?: string | null
          review_type?: string | null
          session_id: string
          star_rating?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          comment?: string
          created_at?: string
          hand_number?: number | null
          id?: string
          is_read?: boolean | null
          review_category?: string | null
          review_type?: string | null
          session_id?: string
          star_rating?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_comments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          current_stack: number | null
          end_time: string | null
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
          starting_stack: number | null
          table_name: string | null
          table_notes: string | null
          table_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bounty_amount?: number | null
          buy_in?: number | null
          cashout?: number | null
          created_at?: string | null
          current_stack?: number | null
          end_time?: string | null
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
          starting_stack?: number | null
          table_name?: string | null
          table_notes?: string | null
          table_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          bounty_amount?: number | null
          buy_in?: number | null
          cashout?: number | null
          created_at?: string | null
          current_stack?: number | null
          end_time?: string | null
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
          starting_stack?: number | null
          table_name?: string | null
          table_notes?: string | null
          table_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          big_blind: number | null
          buy_in: number | null
          cash_out: number | null
          created_at: string
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
          starting_bb?: number | null
          status?: string | null
          table_name?: string | null
          tables_played?: number | null
          tournament_types?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      tutorial_steps: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          image_path: string | null
          step_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          image_path?: string | null
          step_order: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          image_path?: string | null
          step_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      end_session: {
        Args: {
          p_session_id: string
          p_cash_out: number
          p_notes?: string
          p_roi?: number
          p_itm_ratio_numerator?: number
          p_itm_ratio_denominator?: number
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
      is_coach_for_student: {
        Args: { coach_user_id: string; student_user_id: string }
        Returns: boolean
      }
      start_session: {
        Args: {
          p_game_type: string
          p_format: string
          p_location: string
          p_physical_location?: string
          p_table_name?: string
          p_buy_in?: number
          p_small_blind?: number
          p_big_blind?: number
          p_is_online?: boolean
          p_starting_bb?: number
          p_tournament_types?: string[]
          p_is_multi_day?: boolean
        }
        Returns: string
      }
      update_terms_acceptance: {
        Args: { user_id: string; accepted: boolean }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
