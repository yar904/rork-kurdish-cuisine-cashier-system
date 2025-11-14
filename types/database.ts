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
          cost: number;
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
          cost?: number;
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
          cost?: number;
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
      service_requests: {
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
      employees: {
        Row: {
          id: string;
          name: string;
          role: string;
          phone: string | null;
          email: string | null;
          hourly_rate: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          phone?: string | null;
          email?: string | null;
          hourly_rate: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          phone?: string | null;
          email?: string | null;
          hourly_rate?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          employee_id: string;
          start_time: string;
          end_time: string;
          shift_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          start_time: string;
          end_time: string;
          shift_date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          start_time?: string;
          end_time?: string;
          shift_date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      clock_records: {
        Row: {
          id: string;
          employee_id: string;
          clock_in: string;
          clock_out: string | null;
          break_minutes: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          clock_in: string;
          clock_out?: string | null;
          break_minutes?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          clock_in?: string;
          clock_out?: string | null;
          break_minutes?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: string;
          current_stock: number;
          minimum_stock: number;
          cost_per_unit: number;
          supplier_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          unit: string;
          current_stock: number;
          minimum_stock: number;
          cost_per_unit: number;
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          unit?: string;
          current_stock?: number;
          minimum_stock?: number;
          cost_per_unit?: number;
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          inventory_item_id: string;
          movement_type: string;
          quantity: number;
          reference_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          movement_type: string;
          quantity: number;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          movement_type?: string;
          quantity?: number;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      menu_item_ingredients: {
        Row: {
          id: string;
          menu_item_id: string;
          inventory_item_id: string;
          quantity_needed: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          inventory_item_id: string;
          quantity_needed: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          inventory_item_id?: string;
          quantity_needed?: number;
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
