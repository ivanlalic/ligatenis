export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          season_year: number
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          season_year: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          season_year?: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          initial_category_id: string
          current_category_id: string
          status: 'active' | 'inactive'
          phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deactivated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          initial_category_id: string
          current_category_id: string
          status?: 'active' | 'inactive'
          phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deactivated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          initial_category_id?: string
          current_category_id?: string
          status?: 'active' | 'inactive'
          phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deactivated_at?: string | null
        }
      }
      rounds: {
        Row: {
          id: string
          category_id: string
          round_number: number
          period_start: string
          period_end: string
          status: 'pending' | 'active' | 'completed' | 'expired'
          closed_by_admin_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          round_number: number
          period_start: string
          period_end: string
          status?: 'pending' | 'active' | 'completed' | 'expired'
          closed_by_admin_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          round_number?: number
          period_start?: string
          period_end?: string
          status?: 'pending' | 'active' | 'completed' | 'expired'
          closed_by_admin_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          round_id: string
          category_id: string
          player1_id: string
          player2_id: string
          winner_id: string | null
          is_walkover: boolean
          walkover_reason: string | null
          is_bye: boolean
          is_not_reported: boolean
          set1_player1_games: number | null
          set1_player2_games: number | null
          set2_player1_games: number | null
          set2_player2_games: number | null
          set3_player1_games: number | null
          set3_player2_games: number | null
          result_loaded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          round_id: string
          category_id: string
          player1_id: string
          player2_id: string
          winner_id?: string | null
          is_walkover?: boolean
          walkover_reason?: string | null
          is_bye?: boolean
          is_not_reported?: boolean
          set1_player1_games?: number | null
          set1_player2_games?: number | null
          set2_player1_games?: number | null
          set2_player2_games?: number | null
          set3_player1_games?: number | null
          set3_player2_games?: number | null
          result_loaded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          category_id?: string
          player1_id?: string
          player2_id?: string
          winner_id?: string | null
          is_walkover?: boolean
          walkover_reason?: string | null
          is_bye?: boolean
          is_not_reported?: boolean
          set1_player1_games?: number | null
          set1_player2_games?: number | null
          set2_player1_games?: number | null
          set2_player2_games?: number | null
          set3_player1_games?: number | null
          set3_player2_games?: number | null
          result_loaded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      standings: {
        Row: {
          id: string
          category_id: string
          player_id: string
          matches_played: number
          matches_won: number
          matches_lost: number
          matches_won_by_wo: number
          matches_lost_by_wo: number
          points: number
          sets_won: number
          sets_lost: number
          games_won: number
          games_lost: number
          position: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          player_id: string
          matches_played?: number
          matches_won?: number
          matches_lost?: number
          matches_won_by_wo?: number
          matches_lost_by_wo?: number
          points?: number
          sets_won?: number
          sets_lost?: number
          games_won?: number
          games_lost?: number
          position?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          player_id?: string
          matches_played?: number
          matches_won?: number
          matches_lost?: number
          matches_won_by_wo?: number
          matches_lost_by_wo?: number
          points?: number
          sets_won?: number
          sets_lost?: number
          games_won?: number
          games_lost?: number
          position?: number | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
