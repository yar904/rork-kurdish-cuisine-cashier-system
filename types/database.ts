export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: {
          id: string;
          name: string;
          name_kurdish: string;
          name_arabic: string;
          category: string;
          price: number;
          description: string;
          description_kurdish: string;
          description_arabic: string;
          image: string | null;
          available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_kurdish: string;
          name_arabic: string;
          category: string;
          price: number;
          description: string;
          description_kurdish: string;
          description_arabic: string;
          image?: string | null;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_kurdish?: string;
          name_arabic?: string;
          category?: string;
          price?: number;
          description?: string;
          description_kurdish?: string;
          description_arabic?: string;
          image?: string | null;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tables: {
        Row: {
          number: number;
          status: string;
          capacity: number;
          current_order_id: string | null;
          reserved_for: string | null;
          last_cleaned: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          number: number;
          status?: string;
          capacity: number;
          current_order_id?: string | null;
          reserved_for?: string | null;
          last_cleaned?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          number?: number;
          status?: string;
          capacity?: number;
          current_order_id?: string | null;
          reserved_for?: string | null;
          last_cleaned?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          table_number: number;
          status: string;
          waiter_name: string | null;
          total: number;
          split_info: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_number: number;
          status?: string;
          waiter_name?: string | null;
          total: number;
          split_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_number?: number;
          status?: string;
          waiter_name?: string | null;
          total?: number;
          split_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          quantity?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      staff_activity: {
        Row: {
          id: string;
          staff_name: string;
          action: string;
          details: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          staff_name: string;
          action: string;
          details?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          staff_name?: string;
          action?: string;
          details?: string | null;
          timestamp?: string;
        };
      };
      table_service_requests: {
        Row: {
          id: string;
          table_number: number;
          request_type: string;
          status: string;
          message: string | null;
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          table_number: number;
          request_type: string;
          status?: string;
          message?: string | null;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          table_number?: number;
          request_type?: string;
          status?: string;
          message?: string | null;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
      };
      customer_order_history: {
        Row: {
          id: string;
          table_number: number;
          order_id: string;
          order_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_number: number;
          order_id: string;
          order_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          table_number?: number;
          order_id?: string;
          order_data?: Json;
          created_at?: string;
        };
      };
      menu_item_ratings: {
        Row: {
          id: string;
          menu_item_id: string;
          table_number: number;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          table_number: number;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          table_number?: number;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
