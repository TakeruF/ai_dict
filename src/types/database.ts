export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  is_active: boolean;
  provider: string;
  created_at: string;
  updated_at: string;
}
