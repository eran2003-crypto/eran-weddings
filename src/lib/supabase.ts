import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Testimonial {
  id: number;
  couple_name: string;
  date: string;
  venue: string;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  best_thing: string;
  recommendation: string;
  created_at: string;
}

export interface AudioEdit {
  id: number;
  title: string;
  audio_url: string;
  created_at: string;
}

export interface EventVideo {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
}

// Upload file to Supabase Storage
export async function uploadFile(file: File, folder: string): Promise<string | null> {
  const fileName = `${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("uploads")
    .upload(fileName, file);

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
  return data.publicUrl;
}
