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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_directory: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          claimed: boolean | null
          country_code: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry_id: string | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          slug: string
          source: string | null
          source_url: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          claimed?: boolean | null
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry_id?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          slug: string
          source?: string | null
          source_url?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          claimed?: boolean | null
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry_id?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          slug?: string
          source?: string | null
          source_url?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      business_gallery: {
        Row: {
          business_id: string
          created_at: string
          id: string
          image_url: string
          order_index: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_socials: {
        Row: {
          business_id: string
          created_at: string
          id: string
          platform: string
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          platform: string
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_socials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          banner_url: string | null
          certifications: Json
          country_code: string | null
          created_at: string
          description: string | null
          email: string | null
          followers_count: number
          icon_tier: Database["public"]["Enums"]["icon_tier"]
          id: string
          industry_id: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          premium_until: string | null
          province: string | null
          shares_count: number
          short_intro: string | null
          slug: string
          status: Database["public"]["Enums"]["business_status"]
          updated_at: string
          views_count: number
          website: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          certifications?: Json
          country_code?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          followers_count?: number
          icon_tier?: Database["public"]["Enums"]["icon_tier"]
          id?: string
          industry_id?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          premium_until?: string | null
          province?: string | null
          shares_count?: number
          short_intro?: string | null
          slug: string
          status?: Database["public"]["Enums"]["business_status"]
          updated_at?: string
          views_count?: number
          website?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          certifications?: Json
          country_code?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          followers_count?: number
          icon_tier?: Database["public"]["Enums"]["icon_tier"]
          id?: string
          industry_id?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          premium_until?: string | null
          province?: string | null
          shares_count?: number
          short_intro?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["business_status"]
          updated_at?: string
          views_count?: number
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "businesses_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_messages: {
        Row: {
          body: string | null
          created_at: string
          from_business_id: string
          id: string
          read_at: string | null
          subject: string | null
          to_business_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          from_business_id: string
          id?: string
          read_at?: string | null
          subject?: string | null
          to_business_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          from_business_id?: string
          id?: string
          read_at?: string | null
          subject?: string | null
          to_business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_messages_from_business_id_fkey"
            columns: ["from_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_messages_to_business_id_fkey"
            columns: ["to_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          flag: string | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          flag?: string | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          flag?: string | null
          name?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          business_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      message_quotas: {
        Row: {
          bonus_credits: number
          business_id: string
          created_at: string
          id: string
          period_year: number
          updated_at: string
          used_count: number
        }
        Insert: {
          bonus_credits?: number
          business_id: string
          created_at?: string
          id?: string
          period_year: number
          updated_at?: string
          used_count?: number
        }
        Update: {
          bonus_credits?: number
          business_id?: string
          created_at?: string
          id?: string
          period_year?: number
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_quotas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_log: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string
          currency: string
          id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id: string | null
          status: string
          type: Database["public"]["Enums"]["payment_type"]
          user_id: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          status?: string
          type: Database["public"]["Enums"]["payment_type"]
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          status?: string
          type?: Database["public"]["Enums"]["payment_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_contacts: {
        Row: {
          business_id: string
          business_name: string
          business_slug: string | null
          country_name: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          note: string | null
          phone: string | null
          province: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          business_id: string
          business_name: string
          business_slug?: string | null
          country_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          note?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          business_id?: string
          business_name?: string
          business_slug?: string | null
          country_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          note?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          business_id: string | null
          created_at: string
          current_period_end: string | null
          id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_business_shares: { Args: { _id: string }; Returns: undefined }
      increment_business_views: { Args: { _id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      send_card_visit: {
        Args: {
          _body: string
          _from_business: string
          _subject: string
          _to_business: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      business_status: "draft" | "public"
      icon_tier: "standard" | "premium"
      payment_provider: "stripe" | "paypal"
      payment_type: "membership" | "extra_quota" | "icon_premium"
      subscription_status: "active" | "canceled" | "past_due" | "incomplete"
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
    Enums: {
      app_role: ["admin", "user"],
      business_status: ["draft", "public"],
      icon_tier: ["standard", "premium"],
      payment_provider: ["stripe", "paypal"],
      payment_type: ["membership", "extra_quota", "icon_premium"],
      subscription_status: ["active", "canceled", "past_due", "incomplete"],
    },
  },
} as const
