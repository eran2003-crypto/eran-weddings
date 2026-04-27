"use client";

import { useState } from "react";
import { supabase, uploadFile } from "@/lib/supabase";

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    couple_name: "",
    date: "",
    venue: "",
    best_thing: "",
    recommendation: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, "couples");
      }

      await supabase.from("testimonials").insert({
        couple_name: formData.couple_name,
        date: formData.date,
        venue: formData.venue,
        best_thing: formData.best_thing,
        recommendation: formData.recommendation,
        image_url: imageUrl,
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("משהו השתבש, נסו שוב");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">🎉</p>
          <h1 className="text-3xl font-bold tracking-tight mb-4">תודה רבה!</h1>
          <p className="text-neutral-500 text-lg leading-relaxed">
            ההמלצה שלכם נשמרה ותופיע בדף בקרוב.
            <br />
            מזל טוב שוב! 💍
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header with background */}
      <section className="relative text-center pt-24 pb-16 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10">
          <h1
            className="font-bold tracking-tighter text-white"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
          >
            ERAN YOSEF
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-px w-8 bg-white/50" />
            <p className="font-semibold tracking-[0.3em] uppercase text-sm text-white/80">
              WEDDING CLUB
            </p>
            <div className="h-px w-8 bg-white/50" />
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-neutral-500 text-sm leading-[1.8]">
            כיף שבחרתם בי לקחת חלק בערב שלכם!
            <br />
            שתפו רגע אחד שאהבתם — זה אומר לי המון.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1 tracking-wide uppercase">
              תמונה מהאירוע
            </label>
            <p className="text-xs text-neutral-400 mb-2">אפשר איתי, אפשר בלעדיי, משהו יפה</p>
            <div
              className="w-full aspect-[4/3] border-2 border-dashed border-neutral-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-neutral-400 transition-colors overflow-hidden relative"
              onClick={() => document.getElementById("imageInput")?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-neutral-400">
                  <svg
                    className="w-10 h-10 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-sm">לחצו להעלאת תמונה</p>
                </div>
              )}
            </div>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
              שם הזוג
            </label>
            <input
              type="text"
              required
              value={formData.couple_name}
              onChange={(e) =>
                setFormData({ ...formData, couple_name: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
              placeholder="נועה & דניאל"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
                תאריך
              </label>
              <input
                type="text"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="15.03.2026"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
                מקום
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="שם האולם"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
              הדבר שהכי אהבתם אצל ערן 🎵
            </label>
            <textarea
              required
              value={formData.best_thing}
              onChange={(e) =>
                setFormData({ ...formData, best_thing: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors resize-none"
              rows={3}
              placeholder="הרחבה לא התרוקנה לשנייה..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
              ההמלצה שלכם על ערן :)
            </label>
            <textarea
              required
              value={formData.recommendation}
              onChange={(e) =>
                setFormData({ ...formData, recommendation: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors resize-none"
              rows={3}
              placeholder="אם אתם מחפשים DJ שבאמת..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors duration-300 tracking-wide uppercase mt-4 disabled:opacity-50"
          >
            {loading ? "שולח..." : "שליחה"}
          </button>
        </form>
      </section>

      <footer className="py-8 text-center">
        <p className="text-xs text-neutral-200 tracking-widest">
          ERAN YOSEF © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
