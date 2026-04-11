"use client";

import { useState, useEffect, useRef } from "react";
import {
  supabase,
  uploadFile,
  type Testimonial,
  type AudioEdit,
  type EventVideo,
} from "@/lib/supabase";

export default function Home() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [edits, setEdits] = useState<AudioEdit[]>([]);
  const [videos, setVideos] = useState<EventVideo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set());
  const videoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Auto-play videos when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = Number(entry.target.getAttribute("data-video-id"));
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setPlayingVideos((prev) => new Set([...prev, id]));
          } else {
            setPlayingVideos((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [videos]);
  const [loading, setLoading] = useState(true);
  const adminClickCount = useRef(0);
  const adminClickTimer = useRef<NodeJS.Timeout | null>(null);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [tRes, eRes, vRes] = await Promise.all([
      supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
      supabase.from("audio_edits").select("*").order("created_at", { ascending: true }),
      supabase.from("event_videos").select("*").order("created_at", { ascending: true }),
    ]);
    if (tRes.data) {
      const filtered = tRes.data.filter(t => t.couple_name && t.couple_name.trim() !== '');
      // Pin specific couples to top 8, demote others
      const pinned = ['עדי & אליה'];
      const demoted = ['ירין & ליאור'];
      const sorted = [...filtered].sort((a, b) => {
        const pinnedA = pinned.some(p => a.couple_name?.includes(p)) ? 100 : 0;
        const pinnedB = pinned.some(p => b.couple_name?.includes(p)) ? 100 : 0;
        const demotedA = demoted.some(d => a.couple_name?.includes(d)) ? -100 : 0;
        const demotedB = demoted.some(d => b.couple_name?.includes(d)) ? -100 : 0;
        const score = (t: typeof a) => {
          let s = 0;
          if (t.image_url) s += 4;
          if (t.audio_url) s += 3;
          if (t.best_thing && t.best_thing.trim()) s += 2;
          if (t.recommendation && t.recommendation.trim()) s += 1;
          return s;
        };
        return (score(b) + pinnedB + demotedB) - (score(a) + pinnedA + demotedA);
      });
      setTestimonials(sorted);
    }
    if (eRes.data) setEdits(eRes.data);
    if (vRes.data) setVideos(vRes.data);
    setLoading(false);
  }

  // Admin toggle — triple click on footer
  const handleFooterClick = () => {
    adminClickCount.current += 1;
    if (adminClickTimer.current) clearTimeout(adminClickTimer.current);
    adminClickTimer.current = setTimeout(() => {
      adminClickCount.current = 0;
    }, 500);
    if (adminClickCount.current >= 3) {
      setIsAdmin(!isAdmin);
      adminClickCount.current = 0;
    }
  };

  // Contact form
  const [formData, setFormData] = useState({
    coupleName: "",
    phone: "",
    date: "",
    venue: "",
  });
  const [formSent, setFormSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("contact_submissions").insert({
      couple_name: formData.coupleName,
      phone: formData.phone,
      wedding_date: formData.date,
      venue: formData.venue,
    });
    setFormSent(true);
  };

  // Admin: Testimonials
  const addTestimonial = async () => {
    const { data } = await supabase
      .from("testimonials")
      .insert({ couple_name: "זוג חדש", date: "", venue: "" })
      .select()
      .single();
    if (data) setTestimonials([data, ...testimonials]);
  };

  const updateTestimonial = async (id: number, field: string, value: string) => {
    setTestimonials(
      testimonials.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    await supabase.from("testimonials").update({ [field]: value }).eq("id", id);
  };

  const deleteTestimonial = async (id: number) => {
    setTestimonials(testimonials.filter((t) => t.id !== id));
    await supabase.from("testimonials").delete().eq("id", id);
  };

  const uploadTestimonialImage = async (id: number, file: File) => {
    const url = await uploadFile(file, "couples");
    if (url) {
      updateTestimonial(id, "image_url", url);
    }
  };

  const uploadTestimonialAudio = async (id: number, file: File) => {
    const url = await uploadFile(file, "audio-testimonials");
    if (url) {
      updateTestimonial(id, "audio_url", url);
    }
  };

  // Admin: Edits
  const addEdit = async () => {
    const { data } = await supabase
      .from("audio_edits")
      .insert({ title: "עריכה חדשה" })
      .select()
      .single();
    if (data) setEdits([...edits, data]);
  };

  const updateEdit = async (id: number, field: string, value: string) => {
    setEdits(edits.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    await supabase.from("audio_edits").update({ [field]: value }).eq("id", id);
  };

  const deleteEdit = async (id: number) => {
    setEdits(edits.filter((e) => e.id !== id));
    await supabase.from("audio_edits").delete().eq("id", id);
  };

  const uploadEditAudio = async (id: number, file: File) => {
    const url = await uploadFile(file, "audio");
    if (url) {
      updateEdit(id, "audio_url", url);
    }
  };

  // Admin: Videos
  const addVideo = async () => {
    const { data } = await supabase
      .from("event_videos")
      .insert({ title: "סרטון חדש" })
      .select()
      .single();
    if (data) setVideos([...videos, data]);
  };

  const updateVideo = async (id: number, field: string, value: string) => {
    setVideos(videos.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
    await supabase.from("event_videos").update({ [field]: value }).eq("id", id);
  };

  const deleteVideo = async (id: number) => {
    setVideos(videos.filter((v) => v.id !== id));
    await supabase.from("event_videos").delete().eq("id", id);
  };

  // Copy submission link
  const copySubmitLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/submit`);
    alert("הלינק הועתק! שלח אותו לזוג");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">טוען...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-black overflow-x-hidden">
      {/* Admin Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 bg-black text-white z-50 py-3 px-4 flex items-center justify-between text-sm">
          <span>🔧 מצב עריכה</span>
          <div className="flex gap-3">
            <button
              onClick={copySubmitLink}
              className="bg-white text-black px-3 py-1 rounded-full text-xs font-medium"
            >
              📋 העתק לינק לזוגות
            </button>
            <button
              onClick={() => setIsAdmin(false)}
              className="bg-neutral-800 px-3 py-1 rounded-full text-xs"
            >
              ✕ סגור
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section
        className={`flex flex-col items-center justify-center min-h-[100vh] px-6 pb-16 relative ${isAdmin ? "pt-28" : "pt-20"}`}
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="animate-fade-in-up text-center relative z-10">
          <h1
            className="font-bold tracking-tighter leading-none text-white"
            style={{ fontSize: "clamp(3.5rem, 12vw, 10rem)" }}
          >
            ERAN YOSEF
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-white/60" />
            <p
              className="font-semibold tracking-[0.3em] uppercase text-white/80"
              style={{ fontSize: "clamp(1rem, 3vw, 1.8rem)" }}
            >
              WEDDING CLUB
            </p>
            <div className="h-px w-12 bg-white/60" />
          </div>
        </div>

        <div className="animate-fade-in-up animate-delay-200 mt-20 absolute bottom-10 z-10">
          <a
            href="#couples"
            className="block animate-bounce text-white/50 hover:text-white transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Couples / Testimonials */}
      <section id="couples" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2
            className="font-bold tracking-tighter"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            TASTE OF THE POWER COUPLES
          </h2>
          <div className="h-px w-16 bg-black mx-auto mt-4" />
        </div>

        {isAdmin && (
          <div className="mb-8 flex justify-center gap-3">
            <button
              onClick={addTestimonial}
              className="px-6 py-3 bg-black text-white text-sm rounded-full hover:bg-neutral-800 transition-colors"
            >
              + הוסף זוג חדש
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {(showAllTestimonials ? testimonials : testimonials.slice(0, 8)).map((t) => (
            <div
              key={t.id}
              className="group border border-neutral-200/60 rounded-xl sm:rounded-2xl overflow-hidden hover:border-neutral-300 transition-all duration-500 hover:shadow-lg bg-white"
            >
              {/* Image */}
              <div className="w-full aspect-[4/3] sm:aspect-[16/9] bg-neutral-50 flex items-center justify-center overflow-hidden relative">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.couple_name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${t.couple_name.includes('נדב') ? 'object-bottom' : t.couple_name.includes('נועה') ? 'object-top' : 'object-center'}`}
                  />
                ) : (
                  <div className="text-center text-neutral-300">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {isAdmin && (
                      <label className="text-xs cursor-pointer hover:text-black transition-colors">
                        📷 העלה תמונה
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadTestimonialImage(t.id, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}
                {isAdmin && t.image_url && (
                  <label className="absolute bottom-2 right-2 bg-white text-black text-xs px-2 py-1 rounded-full shadow cursor-pointer">
                    📷 החלף
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadTestimonialImage(t.id, file);
                      }}
                    />
                  </label>
                )}
                {isAdmin && (
                  <button
                    onClick={() => deleteTestimonial(t.id)}
                    className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow"
                  >
                    ✕ מחק
                  </button>
                )}
              </div>

              <div className="p-5">
                {isAdmin ? (
                  <div className="space-y-2">
                    <input
                      className="w-full text-lg font-semibold border-b border-neutral-200 pb-1 focus:outline-none focus:border-black"
                      value={t.couple_name}
                      onChange={(e) =>
                        updateTestimonial(t.id, "couple_name", e.target.value)
                      }
                      placeholder="שם הזוג"
                    />
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-xs text-neutral-400 border-b border-neutral-100 pb-1 focus:outline-none"
                        value={t.date}
                        onChange={(e) =>
                          updateTestimonial(t.id, "date", e.target.value)
                        }
                        placeholder="תאריך"
                      />
                      <input
                        className="flex-1 text-xs text-neutral-400 border-b border-neutral-100 pb-1 focus:outline-none"
                        value={t.venue}
                        onChange={(e) =>
                          updateTestimonial(t.id, "venue", e.target.value)
                        }
                        placeholder="מקום"
                      />
                    </div>
                    <textarea
                      className="w-full text-sm border-b border-neutral-100 pb-1 focus:outline-none resize-none"
                      value={t.best_thing}
                      onChange={(e) =>
                        updateTestimonial(t.id, "best_thing", e.target.value)
                      }
                      placeholder="הדבר שהכי אהבו"
                      rows={2}
                    />
                    <textarea
                      className="w-full text-sm border-b border-neutral-100 pb-1 focus:outline-none resize-none"
                      value={t.recommendation}
                      onChange={(e) =>
                        updateTestimonial(t.id, "recommendation", e.target.value)
                      }
                      placeholder="המלצה"
                      rows={2}
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">{t.couple_name}</h3>
                    <div className="flex gap-2 mt-1 text-xs text-neutral-400">
                      <span>{t.date}</span>
                      {t.venue && (
                        <>
                          <span>·</span>
                          <span>{t.venue}</span>
                        </>
                      )}
                    </div>
                    {t.best_thing && (
                      <p className="text-sm text-neutral-600 mt-4 leading-relaxed">
                        {t.best_thing}
                      </p>
                    )}
                    {t.recommendation && (
                      <p className="text-sm text-neutral-500 mt-3 italic leading-relaxed">
                        &ldquo;{t.recommendation}&rdquo;
                      </p>
                    )}
                    {t.audio_url && (
                      <div className="mt-4 pt-3 border-t border-neutral-100">
                        <p className="text-xs text-neutral-400 mb-2">🎙️ הקלטה קולית</p>
                        <audio controls className="w-full h-8">
                          <source src={t.audio_url} />
                        </audio>
                      </div>
                    )}
                  </>
                )}
                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <label className="text-xs bg-neutral-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-neutral-200 transition-colors">
                      🎙️ העלה הקלטה
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadTestimonialAudio(t.id, file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {testimonials.length > 8 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAllTestimonials(!showAllTestimonials)}
              className="px-8 py-3 border border-black text-black text-sm tracking-widest rounded-full hover:bg-black hover:text-white transition-all duration-300"
            >
              {showAllTestimonials ? "הסתר זוגות" : "הראה עוד זוגות"}
            </button>
          </div>
        )}
      </section>

      {/* Event Videos */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2
            className="font-bold tracking-tighter"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            MOMENTS
          </h2>
          <div className="h-px w-16 bg-black mx-auto mt-4" />
        </div>

        {isAdmin && (
          <div className="mb-8 text-center">
            <button
              onClick={addVideo}
              className="px-6 py-3 bg-black text-white text-sm rounded-full hover:bg-neutral-800 transition-colors"
            >
              + הוסף סרטון
            </button>
          </div>
        )}

        {/* Expanded video overlay */}
        {expandedVideo !== null && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedVideo(null)}
          >
            <div className="relative w-full max-w-md" style={{ height: "80vh" }} onClick={(e) => e.stopPropagation()}>
              {(() => {
                const v = videos.find(v => v.id === expandedVideo);
                if (!v) return null;
                const isYT = v.video_url.includes("youtube") || v.video_url.includes("youtu.be");
                const isIG = v.video_url.includes("instagram.com");
                const src = isYT
                  ? v.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").replace("/shorts/", "/embed/") + (v.video_url.includes("?") ? "&autoplay=1" : "?autoplay=1")
                  : isIG ? v.video_url.split("?")[0] + "embed/" : v.video_url;
                return <iframe src={src} className="w-full h-full rounded-2xl" allowFullScreen allow="autoplay" />;
              })()}
            </div>
            <button
              onClick={() => setExpandedVideo(null)}
              className="absolute top-6 left-6 text-white text-3xl font-light"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-md sm:max-w-none mx-auto">
          {videos.map((v) => (
            <div
              key={v.id}
              data-video-id={v.id}
              ref={(el) => { if (el) videoRefs.current.set(v.id, el); }}
              className="border border-neutral-100 rounded-2xl overflow-hidden hover:border-neutral-300 transition-all duration-500"
            >
              {isAdmin ? (
                <div className="p-5 space-y-2">
                  <input
                    className="w-full font-medium border-b border-neutral-200 pb-1 focus:outline-none"
                    value={v.title}
                    onChange={(e) =>
                      updateVideo(v.id, "title", e.target.value)
                    }
                    placeholder="שם הסרטון"
                  />
                  <input
                    className="w-full text-sm border-b border-neutral-100 pb-1 focus:outline-none"
                    value={v.video_url}
                    onChange={(e) =>
                      updateVideo(v.id, "video_url", e.target.value)
                    }
                    placeholder="לינק לסרטון (YouTube / Instagram)"
                  />
                  <button
                    onClick={() => deleteVideo(v.id)}
                    className="text-xs text-red-500"
                  >
                    מחק
                  </button>
                </div>
              ) : v.video_url ? (
                <div className="relative overflow-hidden rounded-2xl" style={{ paddingBottom: "150%" }}>
                  {(v.video_url.includes("youtube") || v.video_url.includes("youtu.be")) ? (
                    playingVideos.has(v.id) ? (
                      <iframe
                        src={v.video_url
                          .replace("watch?v=", "embed/")
                          .replace("youtu.be/", "youtube.com/embed/")
                          .replace("/shorts/", "/embed/") + "?autoplay=1&mute=1&loop=1&playsinline=1"}
                        className="absolute top-0 left-0 w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <img
                          src={`https://img.youtube.com/vi/${v.video_url.match(/(?:embed\/|v=|youtu\.be\/|shorts\/)([^?&]+)/)?.[1]}/0.jpg`}
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                          alt=""
                        />
                        <div className="relative z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 border-l-[6px] border-l-white border-y-[4px] border-y-transparent" />
                        </div>
                      </div>
                    )
                  ) : v.video_url.includes("instagram.com") ? (
                    <a
                      href={v.video_url.split("?")[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"
                    >
                      <svg className="w-12 h-12 text-white mb-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                      <p className="text-white/80 text-xs mt-3 tracking-wide">צפה באינסטגרם</p>
                    </a>
                  ) : v.video_url.includes("drive.google.com") ? (
                    <iframe
                      src={v.video_url.replace("/view", "/preview")}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="autoplay"
                      allowFullScreen
                    />
                  ) : (
                    <a
                      href={v.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full flex items-center justify-center bg-neutral-50 text-sm text-neutral-400 hover:text-black transition-colors"
                    >
                      ▶ {v.title}
                    </a>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-neutral-50 flex items-center justify-center">
                  <div className="text-neutral-300 text-center">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* Audio Edits */}
      <section className="px-6 py-20">
        <div className="text-center mb-16">
          <h2
            className="font-bold tracking-tighter"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            MY EDITS
          </h2>
          <p className="text-neutral-400 text-sm mt-5 italic max-w-md mx-auto">
            &ldquo;היינו בכמה חתונות שלך ואשכרה כל ערב נשמע שונה ומתאים לקהל..&rdquo;
          </p>
          <p className="text-neutral-400 text-base mt-5 tracking-wide font-light" style={{ fontStyle: 'italic' }}>
            לא כל חתונה חייבת להישמע אותו דבר ;)
          </p>
          <p className="text-neutral-500 text-sm mt-4 max-w-lg mx-auto leading-relaxed">
            קחו טעימה קטנה מדברים מגניבים שאפשר לעשות.
            <br />
            כמובן שהכל מותאם לטעם שלכם ולקהל הספציפי באירוע.
          </p>
          <div className="h-px w-16 bg-black mx-auto mt-4" />
        </div>

        {isAdmin && (
          <div className="mb-8 text-center">
            <button
              onClick={addEdit}
              className="px-6 py-3 bg-black text-white text-sm rounded-full hover:bg-neutral-800 transition-colors"
            >
              + הוסף עריכה
            </button>
          </div>
        )}

        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
          {edits.map((edit, i) => {
            const accents = [
              "border-l-red-500",
              "border-l-orange-500",
              "border-l-amber-500",
              "border-l-rose-500",
              "border-l-pink-500",
              "border-l-red-400",
            ];
            const accent = accents[i % accents.length];
            return (
            <div
              key={edit.id}
              className={`rounded-2xl border border-neutral-200/60 border-l-4 ${accent} hover:shadow-md transition-all duration-300 bg-white overflow-hidden`}
            >
              {isAdmin ? (
                <div className="p-5 space-y-2">
                  <input
                    className="w-full text-sm font-medium border-b border-neutral-200 pb-1 focus:outline-none"
                    value={edit.title}
                    onChange={(e) =>
                      updateEdit(edit.id, "title", e.target.value)
                    }
                    placeholder="שם העריכה"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 text-xs border-b border-neutral-100 pb-1 focus:outline-none"
                      value={edit.audio_url || ""}
                      onChange={(e) =>
                        updateEdit(edit.id, "audio_url", e.target.value)
                      }
                      placeholder="לינק לקובץ שמע (URL) או העלה קובץ →"
                    />
                    <label className="text-xs bg-neutral-100 px-3 py-1 rounded-full cursor-pointer hover:bg-neutral-200 transition-colors">
                      📁 העלה
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadEditAudio(edit.id, file);
                        }}
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => deleteEdit(edit.id)}
                    className="text-xs text-red-500"
                  >
                    מחק
                  </button>
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-3">
                  <p className="text-base font-bold tracking-tight leading-snug text-black" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}>{edit.title}</p>
                  {edit.audio_url ? (
                    <audio controls className="w-full h-9" style={{ filter: 'contrast(0.8)' }}>
                      <source src={edit.audio_url} type="audio/mpeg" />
                    </audio>
                  ) : (
                    <span className="text-xs text-neutral-300 tracking-wide">
                      COMING SOON
                    </span>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      </section>

      {/* About */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/about-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h2
              className="font-bold tracking-tighter text-white"
              style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
            >
              ABOUT
            </h2>
            <div className="h-px w-16 bg-white/50 mx-auto mt-4" />
          </div>
          <div className="text-center space-y-8 text-neutral-300">
            <p className="text-base md:text-lg leading-[2] font-light max-w-3xl mx-auto">
              ערן יוסף מנגן מגיל 12.
            </p>
            <p className="text-base md:text-lg leading-[2] font-light max-w-3xl mx-auto">
              מאז הוא עלה על במות בכל הארץ ומחוצה לה — רזידנט בשלוותה, אומן 17,
              פורום פנגויה, הופעה בפסטיבל Sziget בבודפשט, נגינה בניו יורק, מופע
              בלייב פארק לצד נועה קירל ועדן בן זקן, וממש עכשיו חזר מטור בתאילנד וברזיל.
            </p>
            <div className="h-px w-10 bg-white/30 mx-auto" />
            <p className="text-base md:text-lg leading-[2] font-light max-w-3xl mx-auto">
              המאשאפים שלו פוצצו את טיקטוק — עשרות מיליוני צפיות.
              {" "}<span className="font-semibold text-white">&ldquo;ברולטה&rdquo;</span> זכה בשיר השנה.
              {" "}<span className="font-semibold text-white">&ldquo;ואן גוך&rdquo;</span> הגיע למיליוני צפיות עוד לפני שיצא רשמית.
            </p>
            <div className="h-px w-10 bg-white/30 mx-auto" />
            <p className="text-base md:text-lg leading-[2] font-light max-w-3xl mx-auto">
              <span className="font-semibold text-white">הקטע שלו?</span> ליצור את המוזיקה והשילובים מאפס — כל שילוב,
              כל מעבר, כל ערב נבנה מחדש לפי מה שקורה על הרחבה.
            </p>
            <div className="h-px w-10 bg-white/30 mx-auto" />
            <p className="text-base md:text-lg leading-[2] font-light max-w-3xl mx-auto">
              ומעבר לכל זה — <span className="font-semibold text-white">לערן באמת אכפת.</span> כבר בפגישה מרגישים את זה.
              הוא זוכר כל זוג לפי התאריך (תנסו אותו על אמת), ושם את החוויה של הקהל לפני הכל.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/contact-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-white/85" />

        <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2
            className="font-bold tracking-tighter"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}
          >
            LET&apos;S TALK
          </h2>
          <p className="text-neutral-400 text-sm mt-3 tracking-wide">
            הפרטים שלכם :)
          </p>
          <div className="h-px w-16 bg-black mx-auto mt-4" />
        </div>

        {formSent ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-xl font-semibold">נשלח!</p>
            <p className="text-sm text-neutral-400 mt-2">
              ערב של החיים בדרך
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
                שם הזוג
              </label>
              <input
                type="text"
                required
                value={formData.coupleName}
                onChange={(e) =>
                  setFormData({ ...formData, coupleName: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="נועה & דניאל"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
                טלפון
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="050-0000000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
                תאריך החתונה
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide uppercase">
                איפה מתחתנים?
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="שם המקום"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors duration-300 tracking-wide uppercase mt-4"
            >
              שליחה
            </button>
          </form>
        )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 text-center cursor-default select-none"
        onClick={handleFooterClick}
      >
        <p className="text-xs text-neutral-200 tracking-widest">
          ERAN YOSEF © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
