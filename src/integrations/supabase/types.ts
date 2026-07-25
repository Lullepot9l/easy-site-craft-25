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
      achievements: {
        Row: {
          code: string
          coin_reward: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          rarity: string
          secret: boolean
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          rarity?: string
          secret?: boolean
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          rarity?: string
          secret?: boolean
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      battle_pass_seasons: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string
          id: string
          name: string
          starts_at: string
          theme: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          name: string
          starts_at?: string
          theme?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          name?: string
          starts_at?: string
          theme?: string | null
        }
        Relationships: []
      }
      battle_pass_tiers: {
        Row: {
          id: string
          premium: boolean
          reward_icon: string | null
          reward_name: string
          reward_type: string
          reward_value: number
          season_id: string
          tier: number
          xp_required: number
        }
        Insert: {
          id?: string
          premium?: boolean
          reward_icon?: string | null
          reward_name: string
          reward_type?: string
          reward_value?: number
          season_id: string
          tier: number
          xp_required: number
        }
        Update: {
          id?: string
          premium?: boolean
          reward_icon?: string | null
          reward_name?: string
          reward_type?: string
          reward_value?: number
          season_id?: string
          tier?: number
          xp_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_tiers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_backgrounds: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          mode: string
          name: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          name?: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          name?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          created_at: string
          description: string | null
          emblem: string | null
          id: string
          leader_id: string
          name: string
          tag: string
          total_xp: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          emblem?: string | null
          id?: string
          leader_id: string
          name: string
          tag: string
          total_xp?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          emblem?: string | null
          id?: string
          leader_id?: string
          name?: string
          tag?: string
          total_xp?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_missions: {
        Row: {
          active: boolean
          category: string
          coin_reward: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          category?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          target?: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          category?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          target?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          channel: string
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          channel?: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          channel?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      discord_command_logs: {
        Row: {
          channel_id: string | null
          command_name: string
          created_at: string
          error: string | null
          guild_id: string | null
          id: string
          latency_ms: number | null
          owner_id: string
          success: boolean
          user_id: string | null
          username: string | null
        }
        Insert: {
          channel_id?: string | null
          command_name: string
          created_at?: string
          error?: string | null
          guild_id?: string | null
          id?: string
          latency_ms?: number | null
          owner_id: string
          success?: boolean
          user_id?: string | null
          username?: string | null
        }
        Update: {
          channel_id?: string | null
          command_name?: string
          created_at?: string
          error?: string | null
          guild_id?: string | null
          id?: string
          latency_ms?: number | null
          owner_id?: string
          success?: boolean
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      discord_commands: {
        Row: {
          ai_prompt: string | null
          aliases: string[]
          allowed_channels: string[]
          allowed_roles: string[]
          allowed_users: string[]
          category: string
          cooldown_seconds: number
          created_at: string
          denied_channels: string[]
          denied_roles: string[]
          description: string
          discord_command_id: string | null
          enabled: boolean
          ephemeral: boolean
          favorite: boolean
          guild_id: string | null
          id: string
          last_used_at: string | null
          name: string
          options: Json
          owner_id: string
          permissions: string[]
          response_content: string
          response_embed: Json | null
          response_type: string
          scope: string
          subcommands: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          ai_prompt?: string | null
          aliases?: string[]
          allowed_channels?: string[]
          allowed_roles?: string[]
          allowed_users?: string[]
          category?: string
          cooldown_seconds?: number
          created_at?: string
          denied_channels?: string[]
          denied_roles?: string[]
          description?: string
          discord_command_id?: string | null
          enabled?: boolean
          ephemeral?: boolean
          favorite?: boolean
          guild_id?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          options?: Json
          owner_id: string
          permissions?: string[]
          response_content?: string
          response_embed?: Json | null
          response_type?: string
          scope?: string
          subcommands?: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          ai_prompt?: string | null
          aliases?: string[]
          allowed_channels?: string[]
          allowed_roles?: string[]
          allowed_users?: string[]
          category?: string
          cooldown_seconds?: number
          created_at?: string
          denied_channels?: string[]
          denied_roles?: string[]
          description?: string
          discord_command_id?: string | null
          enabled?: boolean
          ephemeral?: boolean
          favorite?: boolean
          guild_id?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          options?: Json
          owner_id?: string
          permissions?: string[]
          response_content?: string
          response_embed?: Json | null
          response_type?: string
          scope?: string
          subcommands?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_favorite: boolean
          prompt: string
          style: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_favorite?: boolean
          prompt: string
          style?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_favorite?: boolean
          prompt?: string
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      luris_settings: {
        Row: {
          id: number
          personality: string
          system_prompt: string
          updated_at: string
          voice_enabled: boolean
        }
        Insert: {
          id?: number
          personality?: string
          system_prompt?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Update: {
          id?: number
          personality?: string
          system_prompt?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          approved: boolean
          category: string
          content: string | null
          created_at: string
          description: string | null
          downloads: number
          id: string
          image_url: string | null
          is_featured: boolean
          item_type: string
          price_coins: number
          seller_id: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          approved?: boolean
          category: string
          content?: string | null
          created_at?: string
          description?: string | null
          downloads?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          item_type?: string
          price_coins?: number
          seller_id?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          approved?: boolean
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          downloads?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          item_type?: string
          price_coins?: number
          seller_id?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_chat_themes: {
        Row: {
          accent_color: string | null
          bg_color: string | null
          bg_image_url: string | null
          bubble_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          bg_color?: string | null
          bg_image_url?: string | null
          bubble_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          bg_color?: string | null
          bg_image_url?: string | null
          bubble_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_discord_config: {
        Row: {
          activity_text: string | null
          activity_type: string | null
          ai_persona: string | null
          auto_respond: boolean | null
          bot_description: string | null
          bot_name: string | null
          bot_status: string | null
          bot_tags: string[] | null
          bot_token: string | null
          client_id: string | null
          created_at: string
          default_channel_id: string | null
          guild_id: string | null
          id: string
          interactions_endpoint: string | null
          owner_id: string
          public_key: string | null
          saved_channels: Json | null
          saved_commands: Json | null
          saved_guilds: Json | null
          updated_at: string
        }
        Insert: {
          activity_text?: string | null
          activity_type?: string | null
          ai_persona?: string | null
          auto_respond?: boolean | null
          bot_description?: string | null
          bot_name?: string | null
          bot_status?: string | null
          bot_tags?: string[] | null
          bot_token?: string | null
          client_id?: string | null
          created_at?: string
          default_channel_id?: string | null
          guild_id?: string | null
          id?: string
          interactions_endpoint?: string | null
          owner_id: string
          public_key?: string | null
          saved_channels?: Json | null
          saved_commands?: Json | null
          saved_guilds?: Json | null
          updated_at?: string
        }
        Update: {
          activity_text?: string | null
          activity_type?: string | null
          ai_persona?: string | null
          auto_respond?: boolean | null
          bot_description?: string | null
          bot_name?: string | null
          bot_status?: string | null
          bot_tags?: string[] | null
          bot_token?: string | null
          client_id?: string | null
          created_at?: string
          default_channel_id?: string | null
          guild_id?: string | null
          id?: string
          interactions_endpoint?: string | null
          owner_id?: string
          public_key?: string | null
          saved_channels?: Json | null
          saved_commands?: Json | null
          saved_guilds?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: string | null
          activity_status: string
          avatar_url: string | null
          bio: string | null
          codename: string | null
          coins: number
          created_at: string
          current_game: string
          discord_username: string | null
          display_name: string | null
          equipped_effect: string | null
          favorite_games: string[]
          id: string
          is_verified: boolean
          level: number
          mutual_servers: string[]
          name_color: string
          name_font: string
          profile_theme: string
          updated_at: string
          username: string | null
          whatsapp_number: string | null
          xp: number
        }
        Insert: {
          account_id?: string | null
          activity_status?: string
          avatar_url?: string | null
          bio?: string | null
          codename?: string | null
          coins?: number
          created_at?: string
          current_game?: string
          discord_username?: string | null
          display_name?: string | null
          equipped_effect?: string | null
          favorite_games?: string[]
          id: string
          is_verified?: boolean
          level?: number
          mutual_servers?: string[]
          name_color?: string
          name_font?: string
          profile_theme?: string
          updated_at?: string
          username?: string | null
          whatsapp_number?: string | null
          xp?: number
        }
        Update: {
          account_id?: string | null
          activity_status?: string
          avatar_url?: string | null
          bio?: string | null
          codename?: string | null
          coins?: number
          created_at?: string
          current_game?: string
          discord_username?: string | null
          display_name?: string | null
          equipped_effect?: string | null
          favorite_games?: string[]
          id?: string
          is_verified?: boolean
          level?: number
          mutual_servers?: string[]
          name_color?: string
          name_font?: string
          profile_theme?: string
          updated_at?: string
          username?: string | null
          whatsapp_number?: string | null
          xp?: number
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number
          user_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          owner_only: boolean
          preview_color: string | null
          price_coins: number
          rarity: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_only?: boolean
          preview_color?: string | null
          price_coins?: number
          rarity?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_only?: boolean
          preview_color?: string | null
          price_coins?: number
          rarity?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_battle_pass: {
        Row: {
          claimed_tiers: number[]
          id: string
          premium: boolean
          season_id: string
          user_id: string
          xp: number
        }
        Insert: {
          claimed_tiers?: number[]
          id?: string
          premium?: boolean
          season_id: string
          user_id: string
          xp?: number
        }
        Update: {
          claimed_tiers?: number[]
          id?: string
          premium?: boolean
          season_id?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_battle_pass_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memory: {
        Row: {
          created_at: string
          id: string
          memory_key: string
          memory_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_key: string
          memory_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_key?: string
          memory_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mission_progress: {
        Row: {
          claimed: boolean
          completed: boolean
          created_at: string
          date: string
          id: string
          mission_id: string
          progress: number
          user_id: string
        }
        Insert: {
          claimed?: boolean
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          mission_id: string
          progress?: number
          user_id: string
        }
        Update: {
          claimed?: boolean
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          mission_id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          active_theme: string | null
          companion_mood: string | null
          companion_name: string | null
          galaxy_bg: boolean
          hud_mode: string | null
          neon_reactive: boolean
          updated_at: string
          user_id: string
          voice_enabled: boolean
        }
        Insert: {
          active_theme?: string | null
          companion_mood?: string | null
          companion_name?: string | null
          galaxy_bg?: boolean
          hud_mode?: string | null
          neon_reactive?: boolean
          updated_at?: string
          user_id: string
          voice_enabled?: boolean
        }
        Update: {
          active_theme?: string | null
          companion_mood?: string | null
          companion_name?: string | null
          galaxy_bg?: boolean
          hud_mode?: string | null
          neon_reactive?: boolean
          updated_at?: string
          user_id?: string
          voice_enabled?: boolean
        }
        Relationships: []
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
      user_themes: {
        Row: {
          acquired_at: string
          active: boolean
          id: string
          theme_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          active?: boolean
          id?: string
          theme_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          active?: boolean
          id?: string
          theme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_allowlist: {
        Row: {
          created_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      websites: {
        Row: {
          created_at: string
          css: string
          description: string | null
          html: string
          id: string
          js: string
          owner_id: string
          published: boolean
          slug: string
          template: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          created_at?: string
          css?: string
          description?: string | null
          html?: string
          id?: string
          js?: string
          owner_id: string
          published?: boolean
          slug: string
          template?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          created_at?: string
          css?: string
          description?: string | null
          html?: string
          id?: string
          js?: string
          owner_id?: string
          published?: boolean
          slug?: string
          template?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gen_account_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "premium" | "admin" | "owner"
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
      app_role: ["user", "premium", "admin", "owner"],
    },
  },
} as const
