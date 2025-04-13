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
      eras: {
        Row: {
          created_at: string | null
          description: string | null
          end_year: number
          id: string
          name: string
          start_year: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_year: number
          id?: string
          name: string
          start_year: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_year?: number
          id?: string
          name?: string
          start_year?: number
        }
        Relationships: []
      }
      religion_beliefs: {
        Row: {
          belief: string
          created_at: string | null
          id: string
          religion_id: string
        }
        Insert: {
          belief: string
          created_at?: string | null
          id?: string
          religion_id: string
        }
        Update: {
          belief?: string
          created_at?: string | null
          id?: string
          religion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "religion_beliefs_religion_id_fkey"
            columns: ["religion_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["id"]
          }
        ]
      }
      religion_branches: {
        Row: {
          branch_name: string
          created_at: string | null
          id: string
          religion_id: string
        }
        Insert: {
          branch_name: string
          created_at?: string | null
          id?: string
          religion_id: string
        }
        Update: {
          branch_name?: string
          created_at?: string | null
          id?: string
          religion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "religion_branches_religion_id_fkey"
            columns: ["religion_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["id"]
          }
        ]
      }
      religion_figures: {
        Row: {
          created_at: string | null
          figure_name: string
          id: string
          religion_id: string
        }
        Insert: {
          created_at?: string | null
          figure_name: string
          id?: string
          religion_id: string
        }
        Update: {
          created_at?: string | null
          figure_name?: string
          id?: string
          religion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "religion_figures_religion_id_fkey"
            columns: ["religion_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["id"]
          }
        ]
      }
      religion_practices: {
        Row: {
          created_at: string | null
          id: string
          practice: string
          religion_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          practice: string
          religion_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          practice?: string
          religion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "religion_practices_religion_id_fkey"
            columns: ["religion_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["id"]
          }
        ]
      }
      religion_relationships: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          parent_id: string
          relationship_type: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          parent_id: string
          relationship_type?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "religion_relationships_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "religion_relationships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["id"]
          }
        ]
      }
      religion_texts: {
        Row: {
          created_at: string | null
          id: string
          religion_id: string
          text_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          religion_id: string
          text_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          religion_id?: string
          text_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "religion_texts_religion_id_fkey"
            columns: ["religion_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["id"]
          }
        ]
      }
      religions: {
        Row: {
          approx_followers: number | null
          continent: string | null
          created_at: string | null
          description: string | null
          end_year: number | null
          era_id: string | null
          founder_name: string | null
          founding_year: number
          id: string
          image_url: string | null
          name: string
          origin_country: string | null
          slug: string
          status: string | null
          summary: string | null
        }
        Insert: {
          approx_followers?: number | null
          continent?: string | null
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          era_id?: string | null
          founder_name?: string | null
          founding_year: number
          id?: string
          image_url?: string | null
          name: string
          origin_country?: string | null
          slug: string
          status?: string | null
          summary?: string | null
        }
        Update: {
          approx_followers?: number | null
          continent?: string | null
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          era_id?: string | null
          founder_name?: string | null
          founding_year?: number
          id?: string
          image_url?: string | null
          name?: string
          origin_country?: string | null
          slug?: string
          status?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "religions_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "eras"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_religions: {
        Args: {
          search_term: string
        }
        Returns: {
          approx_followers: number | null
          continent: string | null
          created_at: string | null
          description: string | null
          end_year: number | null
          era_id: string | null
          founder_name: string | null
          founding_year: number
          id: string
          image_url: string | null
          name: string
          origin_country: string | null
          slug: string
          status: string | null
          summary: string | null
        }[]
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