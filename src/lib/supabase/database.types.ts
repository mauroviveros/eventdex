export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          diff: Json | null;
          entity_id: string | null;
          entity_type: string;
          id: number;
          organization_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          organization_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          organization_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      event_registrations: {
        Row: {
          blocked_at: string | null;
          created_at: string;
          event_id: string;
          id: string;
          organization_id: string;
          updated_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_at?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          organization_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          blocked_at?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          organization_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "event_phases";
            referencedColumns: ["event_id", "organization_id"];
          },
          {
            foreignKeyName: "event_registrations_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_schedules: {
        Row: {
          created_at: string;
          ends_at: string;
          event_id: string;
          id: string;
          label: string | null;
          organization_id: string;
          starts_at: string;
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          ends_at: string;
          event_id: string;
          id?: string;
          label?: string | null;
          organization_id: string;
          starts_at: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          event_id?: string;
          id?: string;
          label?: string | null;
          organization_id?: string;
          starts_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_schedules_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "event_phases";
            referencedColumns: ["event_id", "organization_id"];
          },
          {
            foreignKeyName: "event_schedules_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "event_schedules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      event_spots: {
        Row: {
          booth: string | null;
          code: string;
          created_at: string;
          description_override: string | null;
          event_id: string;
          id: string;
          is_active: boolean;
          name_override: string | null;
          organization_id: string;
          points: number;
          snapshot: Json | null;
          sort_order: number;
          spot_id: string;
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          booth?: string | null;
          code: string;
          created_at?: string;
          description_override?: string | null;
          event_id: string;
          id?: string;
          is_active?: boolean;
          name_override?: string | null;
          organization_id: string;
          points?: number;
          snapshot?: Json | null;
          sort_order?: number;
          spot_id: string;
          updated_at?: string | null;
        };
        Update: {
          booth?: string | null;
          code?: string;
          created_at?: string;
          description_override?: string | null;
          event_id?: string;
          id?: string;
          is_active?: boolean;
          name_override?: string | null;
          organization_id?: string;
          points?: number;
          snapshot?: Json | null;
          sort_order?: number;
          spot_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_spots_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "event_phases";
            referencedColumns: ["event_id", "organization_id"];
          },
          {
            foreignKeyName: "event_spots_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "event_spots_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_spots_spot_id_organization_id_fkey";
            columns: ["spot_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      events: {
        Row: {
          cover_path: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          edition_label: string | null;
          id: string;
          organization_id: string;
          published_at: string | null;
          settings: NonNullable<Json>;
          slug: string;
          status: Database["public"]["Enums"]["event_status"];
          summary: string | null;
          timezone: string;
          title: string;
          updated_at: string | null;
          venue_id: string | null;
          visibility: Database["public"]["Enums"]["event_visibility"];
        };
        ComputedFields: never;
        Insert: {
          cover_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          edition_label?: string | null;
          id?: string;
          organization_id: string;
          published_at?: string | null;
          settings?: NonNullable<Json>;
          slug: string;
          status?: Database["public"]["Enums"]["event_status"];
          summary?: string | null;
          timezone?: string;
          title: string;
          updated_at?: string | null;
          venue_id?: string | null;
          visibility?: Database["public"]["Enums"]["event_visibility"];
        };
        Update: {
          cover_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          edition_label?: string | null;
          id?: string;
          organization_id?: string;
          published_at?: string | null;
          settings?: NonNullable<Json>;
          slug?: string;
          status?: Database["public"]["Enums"]["event_status"];
          summary?: string | null;
          timezone?: string;
          title?: string;
          updated_at?: string | null;
          venue_id?: string | null;
          visibility?: Database["public"]["Enums"]["event_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_venue_id_organization_id_fkey";
            columns: ["venue_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount_cents: number;
          concept: string;
          created_at: string;
          currency: Database["public"]["Enums"]["invoice_currency"];
          id: string;
          issued_on: string;
          organization_id: string;
          paid_at: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          concept: string;
          created_at?: string;
          currency: Database["public"]["Enums"]["invoice_currency"];
          id?: string;
          issued_on?: string;
          organization_id: string;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
        };
        Update: {
          amount_cents?: number;
          concept?: string;
          created_at?: string;
          currency?: Database["public"]["Enums"]["invoice_currency"];
          id?: string;
          issued_on?: string;
          organization_id?: string;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
        };
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_domains: {
        Row: {
          created_at: string;
          hostname: string;
          id: string;
          is_primary: boolean;
          organization_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          hostname: string;
          id?: string;
          is_primary?: boolean;
          organization_id: string;
        };
        Update: {
          created_at?: string;
          hostname?: string;
          id?: string;
          is_primary?: boolean;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          updated_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          brand_color: string | null;
          created_at: string;
          default_timezone: string;
          deleted_at: string | null;
          id: string;
          logo_path: string | null;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["organization_status"];
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          brand_color?: string | null;
          created_at?: string;
          default_timezone?: string;
          deleted_at?: string | null;
          id?: string;
          logo_path?: string | null;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["organization_status"];
          updated_at?: string | null;
        };
        Update: {
          brand_color?: string | null;
          created_at?: string;
          default_timezone?: string;
          deleted_at?: string | null;
          id?: string;
          logo_path?: string | null;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["organization_status"];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          created_at: string;
          granted_by: string | null;
          notes: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_admins_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string;
          full_name: string;
          id: string;
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email: string;
          full_name?: string;
          id: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      raffle_draws: {
        Row: {
          draw_number: number;
          drawn_at: string;
          drawn_by: string | null;
          eligible_count: number;
          id: string;
          organization_id: string;
          raffle_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
          winner_name: string;
          winner_user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          draw_number: number;
          drawn_at?: string;
          drawn_by?: string | null;
          eligible_count: number;
          id?: string;
          organization_id: string;
          raffle_id: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          winner_name: string;
          winner_user_id?: string | null;
        };
        Update: {
          draw_number?: number;
          drawn_at?: string;
          drawn_by?: string | null;
          eligible_count?: number;
          id?: string;
          organization_id?: string;
          raffle_id?: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          winner_name?: string;
          winner_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "raffle_draws_drawn_by_fkey";
            columns: ["drawn_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raffle_draws_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raffle_draws_raffle_id_organization_id_fkey";
            columns: ["raffle_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "raffles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "raffle_draws_voided_by_fkey";
            columns: ["voided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raffle_draws_winner_user_id_fkey";
            columns: ["winner_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      raffles: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          min_claims: number;
          organization_id: string;
          title: string;
          updated_at: string | null;
          winners_published_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          min_claims?: number;
          organization_id: string;
          title: string;
          updated_at?: string | null;
          winners_published_at?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          min_claims?: number;
          organization_id?: string;
          title?: string;
          updated_at?: string | null;
          winners_published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "raffles_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "event_phases";
            referencedColumns: ["event_id", "organization_id"];
          },
          {
            foreignKeyName: "raffles_event_id_organization_id_fkey";
            columns: ["event_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "raffles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      spot_claims: {
        Row: {
          claimed_at: string;
          event_id: string;
          event_spot_id: string;
          id: string;
          organization_id: string;
          registration_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          claimed_at?: string;
          event_id: string;
          event_spot_id: string;
          id?: string;
          organization_id: string;
          registration_id: string;
          user_id: string;
        };
        Update: {
          claimed_at?: string;
          event_id?: string;
          event_spot_id?: string;
          id?: string;
          organization_id?: string;
          registration_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spot_claims_event_spot_id_event_id_fkey";
            columns: ["event_spot_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "event_spots";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "spot_claims_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spot_claims_registration_id_event_id_user_id_fkey";
            columns: ["registration_id", "event_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "event_registrations";
            referencedColumns: ["id", "event_id", "user_id"];
          },
        ];
      };
      spots: {
        Row: {
          archived_at: string | null;
          created_at: string;
          description: string | null;
          id: string;
          logo_path: string | null;
          name: string;
          organization_id: string;
          type: Database["public"]["Enums"]["spot_type"];
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_path?: string | null;
          name: string;
          organization_id: string;
          type?: Database["public"]["Enums"]["spot_type"];
          updated_at?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_path?: string | null;
          name?: string;
          organization_id?: string;
          type?: Database["public"]["Enums"]["spot_type"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "spots_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          address_line: string | null;
          city: string | null;
          country: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          postal_code: string | null;
          state: string | null;
          timezone: string;
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          address_line?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          postal_code?: string | null;
          state?: string | null;
          timezone?: string;
          updated_at?: string | null;
        };
        Update: {
          address_line?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          postal_code?: string | null;
          state?: string | null;
          timezone?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "venues_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      event_phases: {
        Row: {
          ends_at: string | null;
          event_id: string;
          organization_id: string;
          phase: Database["public"]["Enums"]["event_phase"] | null;
          starts_at: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_invitation: { Args: { p_invitation_id: string }; Returns: string };
      accept_my_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      active_event: {
        Args: { p_organization_id: string };
        Returns: {
          cover_path: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          edition_label: string | null;
          id: string;
          organization_id: string;
          published_at: string | null;
          settings: NonNullable<Json>;
          slug: string;
          status: Database["public"]["Enums"]["event_status"];
          summary: string | null;
          timezone: string;
          title: string;
          updated_at: string | null;
          venue_id: string | null;
          visibility: Database["public"]["Enums"]["event_visibility"];
        }[];
        SetofOptions: {
          from: "*";
          to: "events";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      assign_domain: {
        Args: {
          p_hostname: string;
          p_make_primary?: boolean;
          p_organization_id: string;
          p_transfer_from?: string;
        };
        Returns: {
          next_primary: string;
          owner_id: string;
          owner_name: string;
        }[];
      };
      claim_spot: {
        Args: { p_event_spot_id: string };
        Returns: {
          claimed_at: string;
          ends_at: string;
          outcome: Database["public"]["Enums"]["claim_outcome"];
          starts_at: string;
        }[];
      };
      create_organization: {
        Args: {
          p_hostname: string;
          p_name: string;
          p_owner_email: string;
          p_slug: string;
        };
        Returns: string;
      };
      draw_raffle: {
        Args: { p_raffle_id: string };
        Returns: {
          draw_number: number;
          drawn_at: string;
          drawn_by: string | null;
          eligible_count: number;
          id: string;
          organization_id: string;
          raffle_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
          winner_name: string;
          winner_user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "raffle_draws";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      invite_member: {
        Args: {
          p_email: string;
          p_organization_id: string;
          p_role: Database["public"]["Enums"]["organization_role"];
        };
        Returns: string;
      };
      log_support_access: {
        Args: { p_organization_id: string };
        Returns: undefined;
      };
      publish_event: { Args: { p_event_id: string }; Returns: undefined };
      publish_raffle_winners: {
        Args: { p_raffle_id: string };
        Returns: undefined;
      };
      raffle_eligible: {
        Args: { p_raffle_id: string };
        Returns: {
          claims: number;
          user_id: string;
        }[];
      };
      resolve_active_event: {
        Args: { p_organization_id: string };
        Returns: string;
      };
      resolve_organization: {
        Args: { p_host: string };
        Returns: {
          brand_color: string;
          default_timezone: string;
          id: string;
          logo_path: string;
          name: string;
          slug: string;
        }[];
      };
      set_organization_status: {
        Args: {
          p_organization_id: string;
          p_status: Database["public"]["Enums"]["organization_status"];
        };
        Returns: undefined;
      };
      set_primary_domain: { Args: { p_domain_id: string }; Returns: undefined };
      void_raffle_draw: {
        Args: { p_draw_id: string; p_reason: string };
        Returns: {
          draw_number: number;
          drawn_at: string;
          drawn_by: string | null;
          eligible_count: number;
          id: string;
          organization_id: string;
          raffle_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
          winner_name: string;
          winner_user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "raffle_draws";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      claim_outcome: "new" | "repeat" | "inactive" | "out_of_phase" | "blocked";
      event_phase: "upcoming" | "live" | "finished";
      event_status: "draft" | "published" | "archived" | "cancelled";
      event_visibility: "public" | "unlisted";
      invoice_currency: "ARS" | "USD";
      invoice_status: "pending" | "paid" | "void";
      organization_role: "owner" | "staff";
      organization_status: "active" | "suspended";
      spot_type: "stand" | "attraction" | "sponsor" | "activity";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      claim_outcome: ["new", "repeat", "inactive", "out_of_phase", "blocked"],
      event_phase: ["upcoming", "live", "finished"],
      event_status: ["draft", "published", "archived", "cancelled"],
      event_visibility: ["public", "unlisted"],
      invoice_currency: ["ARS", "USD"],
      invoice_status: ["pending", "paid", "void"],
      organization_role: ["owner", "staff"],
      organization_status: ["active", "suspended"],
      spot_type: ["stand", "attraction", "sponsor", "activity"],
    },
  },
} as const;
