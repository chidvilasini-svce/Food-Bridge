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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          created_at: string
          donation_id: string
          id: string
          recipient_id: string
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          donation_id: string
          id?: string
          recipient_id: string
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          donation_id?: string
          id?: string
          recipient_id?: string
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          city: string
          claimed_at: string | null
          claimed_by: string | null
          collected_at: string | null
          created_at: string
          description: string | null
          donor_id: string
          food_type: Database["public"]["Enums"]["food_type"]
          id: string
          image_path: string | null
          pickup_address: string | null
          pickup_area: string
          pickup_deadline: string
          pickup_instructions: string | null
          prepared_at: string
          quantity: number
          servings: number
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          unit: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          city: string
          claimed_at?: string | null
          claimed_by?: string | null
          collected_at?: string | null
          created_at?: string
          description?: string | null
          donor_id: string
          food_type?: Database["public"]["Enums"]["food_type"]
          id?: string
          image_path?: string | null
          pickup_address?: string | null
          pickup_area: string
          pickup_deadline: string
          pickup_instructions?: string | null
          prepared_at: string
          quantity: number
          servings: number
          status?: Database["public"]["Enums"]["donation_status"]
          title: string
          unit?: string
          updated_at?: string
          weight_kg?: number
        }
        Update: {
          city?: string
          claimed_at?: string | null
          claimed_by?: string | null
          collected_at?: string | null
          created_at?: string
          description?: string | null
          donor_id?: string
          food_type?: Database["public"]["Enums"]["food_type"]
          id?: string
          image_path?: string | null
          pickup_address?: string | null
          pickup_area?: string
          pickup_deadline?: string
          pickup_instructions?: string | null
          prepared_at?: string
          quantity?: number
          servings?: number
          status?: Database["public"]["Enums"]["donation_status"]
          title?: string
          unit?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "donations_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          organization_name: string | null
          organization_type: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id: string
          organization_name?: string | null
          organization_type?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organization_name?: string | null
          organization_type?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      status_events: {
        Row: {
          actor_id: string | null
          created_at: string
          donation_id: string
          from_status: Database["public"]["Enums"]["donation_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["donation_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          donation_id: string
          from_status?: Database["public"]["Enums"]["donation_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["donation_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          donation_id?: string
          from_status?: Database["public"]["Enums"]["donation_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["donation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "status_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_events_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_donation: {
        Args: { p_donation_id: string; p_reason?: string }
        Returns: {
          city: string
          claimed_at: string | null
          claimed_by: string | null
          collected_at: string | null
          created_at: string
          description: string | null
          donor_id: string
          food_type: Database["public"]["Enums"]["food_type"]
          id: string
          image_path: string | null
          pickup_address: string | null
          pickup_area: string
          pickup_deadline: string
          pickup_instructions: string | null
          prepared_at: string
          quantity: number
          servings: number
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          unit: string
          updated_at: string
          weight_kg: number
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_donation: {
        Args: { p_donation_id: string }
        Returns: {
          city: string
          claimed_at: string | null
          claimed_by: string | null
          collected_at: string | null
          created_at: string
          description: string | null
          donor_id: string
          food_type: Database["public"]["Enums"]["food_type"]
          id: string
          image_path: string | null
          pickup_address: string | null
          pickup_area: string
          pickup_deadline: string
          pickup_instructions: string | null
          prepared_at: string
          quantity: number
          servings: number
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          unit: string
          updated_at: string
          weight_kg: number
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_pickup: {
        Args: { p_donation_id: string }
        Returns: {
          city: string
          claimed_at: string | null
          claimed_by: string | null
          collected_at: string | null
          created_at: string
          description: string | null
          donor_id: string
          food_type: Database["public"]["Enums"]["food_type"]
          id: string
          image_path: string | null
          pickup_address: string | null
          pickup_area: string
          pickup_deadline: string
          pickup_instructions: string | null
          prepared_at: string
          quantity: number
          servings: number
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          unit: string
          updated_at: string
          weight_kg: number
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_overdue_donations: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      impact_stats: { Args: never; Returns: Json }
      release_claim: {
        Args: { p_donation_id: string }
        Returns: {
          city: string
          claimed_at: string | null
          claimed_by: string | null
          collected_at: string | null
          created_at: string
          description: string | null
          donor_id: string
          food_type: Database["public"]["Enums"]["food_type"]
          id: string
          image_path: string | null
          pickup_address: string | null
          pickup_area: string
          pickup_deadline: string
          pickup_instructions: string | null
          prepared_at: string
          quantity: number
          servings: number
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          unit: string
          updated_at: string
          weight_kg: number
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "donor" | "recipient"
      claim_status: "active" | "collected" | "cancelled"
      donation_status:
        | "available"
        | "claimed"
        | "collected"
        | "cancelled"
        | "expired"
      food_type: "veg" | "non_veg" | "vegan" | "mixed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["donor", "recipient"],
      claim_status: ["active", "collected", "cancelled"],
      donation_status: [
        "available",
        "claimed",
        "collected",
        "cancelled",
        "expired",
      ],
      food_type: ["veg", "non_veg", "vegan", "mixed"],
    },
  },
} as const
