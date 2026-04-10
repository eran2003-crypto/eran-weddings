-- Testimonials table
CREATE TABLE testimonials (
  id SERIAL PRIMARY KEY,
  couple_name TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  video_url TEXT,
  best_thing TEXT DEFAULT '',
  recommendation TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio edits table
CREATE TABLE audio_edits (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  audio_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event videos table
CREATE TABLE event_videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  video_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  couple_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wedding_date TEXT NOT NULL,
  venue TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable public read access for testimonials, edits, videos
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read testimonials, edits, videos
CREATE POLICY "Public read testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public read audio_edits" ON audio_edits FOR SELECT USING (true);
CREATE POLICY "Public read event_videos" ON event_videos FOR SELECT USING (true);

-- Everyone can insert (for submission form and contact form)
CREATE POLICY "Public insert testimonials" ON testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert contact" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Everyone can update testimonials (for admin editing via anon key)
CREATE POLICY "Public update testimonials" ON testimonials FOR UPDATE USING (true);
CREATE POLICY "Public update audio_edits" ON audio_edits FOR UPDATE USING (true);
CREATE POLICY "Public update event_videos" ON event_videos FOR UPDATE USING (true);

-- Everyone can insert edits and videos (admin)
CREATE POLICY "Public insert audio_edits" ON audio_edits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert event_videos" ON event_videos FOR INSERT WITH CHECK (true);

-- Everyone can delete (admin)
CREATE POLICY "Public delete testimonials" ON testimonials FOR DELETE USING (true);
CREATE POLICY "Public delete audio_edits" ON audio_edits FOR DELETE USING (true);
CREATE POLICY "Public delete event_videos" ON event_videos FOR DELETE USING (true);

-- Insert sample data
INSERT INTO testimonials (couple_name, date, venue, best_thing, recommendation) VALUES
  ('נועה & דניאל', '15.03.2026', 'האחוזה, כפר שמריהו', 'האנרגיה שערן הביא לרחבה — כולם רקדו עד הסוף', 'פשוט תסמכו עליו. הוא יודע בדיוק מה לשים ומתי.'),
  ('שירה & אור', '28.02.2026', 'גן אירועים, הרצליה', 'השילוב בין שירים ישנים לחדשים', 'ערן הפך את החתונה שלנו למסיבה שאנשים עדיין מדברים עליה.'),
  ('מיכל & יונתן', '10.01.2026', 'התחנה, תל אביב', 'העריכות המטורפות שהוא הכין מראש בשבילנו', 'ישבנו איתו לפני החתונה ושיתפנו מה אנחנו אוהבים. הוא לקח את זה למקום שלא דמיינו.');

INSERT INTO audio_edits (title) VALUES
  ('צביקה פיק × Pop Smoke'),
  ('שנות ה-80 × טראפ'),
  ('ים תיכוני × האוס');

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Allow public access to uploads bucket
CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Public insert uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
