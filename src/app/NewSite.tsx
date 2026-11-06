"use client";

// העיצוב החדש של האתר, לגולשים. מצב העריכה של ערן נשאר בדיוק כמו שהיה (page.tsx).
// כל התוכן מגיע מאותם נתונים: ההמלצות, הסרטונים והעריכות.
import { useEffect, useRef, useState } from "react";
import type { Testimonial, AudioEdit, EventVideo } from "@/lib/supabase";
import "./new-site.css";

type Form = { coupleName: string; phone: string; date: string; venue: string };
type Props = {
  testimonials: Testimonial[];
  videos: EventVideo[];
  edits: AudioEdit[];
  formData: Form;
  setFormData: (f: Form) => void;
  formSent: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onFooterClick: () => void;
};

const BASE = "/eran-weddings";
const EMOJI = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;
const clean = (t?: string | null) => (t || "").replace(EMOJI, "").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
const objPos = (n: string) => (n.includes("נדב") ? "50% 85%" : n.includes("נועה") ? "50% 15%" : "50% 40%");
const DOW = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// משפטים קצרים מהזוגות לרצועה שעוברת מתחת למסך הכניסה
const TICK: [string, string][] = [
  ["פסטיבל מטורף", "עדי & אליה"], ["הרחבה הייתה היסטרית", "יותם & הגר"], ["ערב מהסרטים", "עודד & גאיה"],
  ["פירקת לנו את הרחבה", "נדב & נטע"], ["הדי-ג׳יי הכי טוב שהם שמעו", "אמה & יהודה"], ["אין עליך בעולם הזה", "אלינור & רובין"],
  ["בחיים לא הייתי בחתונה כל כך שמחה", "מאיה & יונתן"], ["לא יכלו לעזוב את הרחבה", "אריאל & שרית"],
];

const NAV = [["couples", "זוגות"], ["moments", "רגעים"], ["edits", "עריכות"], ["about", "על ערן"], ["talk", "בואו נדבר"]];

export default function NewSite({ testimonials, videos, edits, formData, setFormData, formSent, onSubmit, onFooterClick }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const [navOn, setNavOn] = useState<string | null>(null);

  // מסך הכניסה נאסף לכרטיס בגלילה, והכמוסה בתפריט עוקבת אחרי האזור שעל המסך
  useEffect(() => {
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.6)));
      frame.current?.style.setProperty("--p", p.toFixed(3));
      let cur: string | null = null;
      for (const [id] of NAV) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < innerHeight * 0.45) cur = id; }
      setNavOn(cur);
    };
    addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); onScroll();
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
  }, []);
  useEffect(() => {
    const a = nav.current?.querySelector<HTMLAnchorElement>(`a[href="#${navOn}"]`);
    if (!pill.current) return;
    pill.current.style.width = a ? `${a.offsetWidth}px` : "0px";
    if (a) pill.current.style.left = `${a.offsetLeft}px`;
  }, [navOn]);

  // כניסה עדינה של אזורים שמתחת למסך
  useEffect(() => {
    document.documentElement.classList.add("ey-js");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("wait"); io.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll(".ey .rv").forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("wait"); io.observe(el); } });
    return () => io.disconnect();
  }, []);

  // ---------- נגן אחד לכל השמע בדף ----------
  const audio = useRef<HTMLAudioElement | null>(null);
  const [np, setNp] = useState<{ key: string; title: string; sub: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const a = new Audio(); audio.current = a;
    a.onplay = () => setPaused(false); a.onpause = () => setPaused(true);
    a.onended = () => { setNp(null); setProg(0); };
    a.ontimeupdate = () => setProg(a.duration ? a.currentTime / a.duration : 0);
    return () => { a.pause(); };
  }, []);
  const play = (key: string, src: string, title: string, sub: string) => {
    const a = audio.current; if (!a) return;
    if (np?.key === key) { if (a.paused) a.play().catch(() => {}); else a.pause(); return; }
    a.src = src; a.play().catch(() => {}); setProg(0); setNp({ key, title, sub });
  };
  const stop = () => { audio.current?.pause(); setNp(null); setProg(0); };

  // ---------- זוגות ----------
  const [onlyVoice, setOnlyVoice] = useState(false);
  const list = onlyVoice ? testimonials.filter((t) => t.audio_url) : testimonials;
  const [at, setAt] = useState(0);
  const [reading, setReading] = useState<Testimonial | null>(null);
  useEffect(() => { setAt(0); }, [onlyVoice]);
  const go = (d: number) => setAt((x) => (x + d + list.length) % list.length);
  const sx = useRef<number | null>(null);

  // ---------- סרטונים ----------
  const [shown, setShown] = useState(8);
  const [viewing, setViewing] = useState<number | null>(null);
  const moRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target.querySelector("video") as HTMLVideoElement | null; if (!v) return;
      if (e.isIntersecting) { if (!v.src) v.src = v.dataset.lazy || ""; v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.4, rootMargin: "200px 0px" });
    moRef.current?.querySelectorAll(".mo").forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, [shown, videos.length]);
  useEffect(() => {
    if (viewing === null) return;
    stop();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setViewing(null); if (e.key === "ArrowLeft") setViewing((i) => (i! + 1) % videos.length); if (e.key === "ArrowRight") setViewing((i) => (i! - 1 + videos.length) % videos.length); };
    addEventListener("keydown", key); return () => removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing, videos.length]);

  // ---------- עריכות: אורך כל קטע ----------
  const [lens, setLens] = useState<Record<number, string>>({});
  useEffect(() => {
    edits.forEach((e) => { if (!e.audio_url) return; const a = new Audio(); a.preload = "metadata"; a.src = e.audio_url; a.onloadedmetadata = () => { const s = Math.round(a.duration); setLens((m) => ({ ...m, [e.id]: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` })); }; });
  }, [edits]);

  const dateNote = formData.date ? `יום ${DOW[new Date(formData.date + "T12:00").getDay()]}, ${formData.date.split("-").reverse().join(".")}. ערן יבדוק שהתאריך פנוי ויחזור אליכם.` : "";
  const tick = TICK.map(([t, w], i) => <span className="tk-item" key={i}>״{t}״<small>{w}</small></span>);

  return (
    <main className="ey">
      {/* מסך כניסה */}
      <header className="hero" id="top">
        <div className="frame" ref={frame}><img src={`${BASE}/hero-bg.jpg`} alt="ערן יוסף על הדק מול רחבה מלאה" /></div>
        <div className="hero-in">
          <h1><span>ERAN</span><span>YOSEF</span></h1>
          <div className="club"><i />WEDDING CLUB<i /></div>
          <a className="hero-cta" href="#couples">מה הזוגות אומרים</a>
        </div>
        <a className="down" href="#couples" aria-label="לגלול למטה" />
      </header>

      <section className="ticker" aria-label="מה הזוגות אמרו"><div className="tk-track">{tick}{tick}</div></section>

      <nav className={`nav ${navOn ? "" : "light"}`} ref={nav} aria-label="ניווט באתר">
        <span className="pill" ref={pill} />
        {NAV.map(([id, t]) => <a key={id} href={`#${id}`} className={navOn === id ? "on" : ""}>{t}</a>)}
      </nav>

      {/* זוגות */}
      <section className="band wrap" id="couples">
        <div className="inner">
          <div className="head rv"><h2>TASTE OF THE POWER COUPLES</h2><div className="rule" /><p>מה הזוגות כתבו אחרי החתונה. מעבירים קלף עם החיצים, בלחיצה או בהחלקה.</p></div>
          <div className="chips">
            <button className={`chip ${onlyVoice ? "" : "on"}`} onClick={() => setOnlyVoice(false)}>כל הזוגות</button>
            <button className={`chip ${onlyVoice ? "on" : ""}`} onClick={() => setOnlyVoice(true)}>רק הקלטות קוליות</button>
          </div>
          <div className="deck-zone"
            onTouchStart={(e) => { sx.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => { if (sx.current == null) return; const dx = e.changedTouches[0].clientX - sx.current; if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1); sx.current = null; }}>
            {list.map((t, i) => {
              const k = i - at, best = clean(t.best_thing), rec = clean(t.recommendation);
              const q = (rec || best).replace(/^[“"״]+|[”"״]+$/g, "");
              return (
                <div key={t.id} className={`card ${t.image_url ? "has-img" : ""} ${k < 0 ? "gone" : ""}`} style={{ "--k": k } as React.CSSProperties} onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) go(1); }}>
                  {t.image_url && <img src={t.image_url} alt={t.couple_name} loading="lazy" style={{ objectPosition: objPos(t.couple_name) }} />}
                  {t.audio_url && <span className="vbadge">הקלטה קולית</span>}
                  <div className="txt">
                    {!t.image_url && <span className="mark">״</span>}
                    {q && <span className="q">{q}</span>}
                    <span className="nm">{t.couple_name}</span>
                    {(t.date || t.venue) && <span className="meta">{[t.date, t.venue].filter(Boolean).join(" · ")}</span>}
                    <span className="acts">
                      {t.audio_url && <button className={`voice ${np?.key === `t${t.id}` && !paused ? "on" : ""}`} onClick={() => play(`t${t.id}`, t.audio_url!, t.couple_name, "הקלטה קולית לערן")}><i />להקשיב</button>}
                      {(best || rec) && <button className="readall" onClick={() => setReading(t)}>לקרוא הכל</button>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="deck-ctl"><button onClick={() => go(1)} aria-label="הזוג הבא">→</button><button onClick={() => go(-1)} aria-label="הזוג הקודם">←</button></div>
        </div>
      </section>

      {/* רגעים */}
      <section className="band wrap" id="moments">
        <div className="inner">
          <div className="head rv"><h2>MOMENTS</h2><div className="rule" /><p>לוחצים על סרטון כדי לראות אותו גדול עם סאונד.</p></div>
          <div className="moments" ref={moRef}>
            {videos.slice(0, shown).map((v, i) => (
              <div className="mo" key={v.id} onClick={() => setViewing(i)}>
                <video data-lazy={`${v.video_url}#t=0.5`} muted loop playsInline preload="none" />
                <span className="snd">▶ צפייה</span>
              </div>
            ))}
          </div>
          {shown < videos.length && <div className="more-wrap"><button className="more" onClick={() => setShown((n) => n + 8)}>עוד רגעים</button></div>}
        </div>
      </section>

      {/* עריכות */}
      <section className="band wrap" id="edits">
        <div className="inner">
          <div className="head rv"><h2>MY EDITS</h2><div className="rule" /><p>לא כל חתונה חייבת להישמע אותו דבר. קחו טעימה קטנה מדברים מגניבים שאפשר לעשות, והכל מותאם לטעם שלכם ולקהל באירוע.</p></div>
          <p className="quote">״היינו בכמה חתונות שלך ואשכרה כל ערב נשמע שונה ומתאים לקהל..״</p>
          <div className="tracks">
            {edits.filter((e) => e.audio_url).map((e) => {
              const on = np?.key === `e${e.id}`;
              return (
                <div key={e.id} className={`tr ${on && !paused ? "playing" : ""}`} tabIndex={0} onClick={() => play(`e${e.id}`, e.audio_url, e.title, "עריכה של ערן יוסף")}>
                  <span className="btn" /><span className="t">{e.title}</span><span className="len">{lens[e.id] || ""}</span>
                  <span className="bar" style={{ width: on ? `${prog * 100}%` : 0 }} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* על ערן */}
      <section className="band wrap" id="about">
        <div className="inner about rv">
          <div className="pic"><img src={`${BASE}/about-bg.jpg`} alt="ערן מנגן בסט שקיעה" loading="lazy" /></div>
          <div className="copy">
            <h2 className="he">טיפה על ערן</h2>
            <p>ערן יוסף מנגן מגיל 12, ומאז עלה על אינספור במות בארץ ובעולם. הוא הופיע בפסטיבלים, ימי סטודנט, פאנג׳ויה והפקות גדולות, לצד מועדונים מובילים כמו שלוותה, אומן 17 ופורום. במקביל לקח את המוזיקה שלו גם לחו״ל, עם הופעות בפסטיבל Sziget בבודפשט, הופעות בניו יורק ומסע הופעות בתאילנד וברזיל. בין היתר הופיע בלייב פארק לצד נועה קירל ועדן בן זקן.</p>
            <p>גם כמפיק ויוצר ערן משאיר חותם, עם שירים שזכו למיליוני צפיות ברשת. <b>״ברולטה״</b> שזכה לשיר השנה, ו<b>״ואן גוך״</b> שהגיע למיליוני צפיות עוד לפני שיצא רשמית, הם רק חלק מהרפרטואר.</p>
            <p><b>הניסיון הזה מתורגם ישירות לרחבה של החתונה.</b> ערן לא עובד עם פלייליסט קבוע, אלא בונה את הערב מתוך הקשבה מדויקת לקהל, שליטה באנרגיה ויכולת להחזיק רחבה חיה לאורך זמן. התוצאה היא אירוע שמרגיש מדויק, זורם ומלא.</p>
          </div>
        </div>
      </section>

      {/* בואו נדבר */}
      <section className="band wrap" id="talk">
        <div className="inner">
          <div className="head rv"><h2>LET&apos;S TALK</h2><div className="rule" /><p>הפרטים שלכם :)</p></div>
          <div className="talk rv">
            {formSent ? (
              <div className="sent"><b>נשלח!</b><br />ערב של החיים בדרך</div>
            ) : (
              <form onSubmit={onSubmit}>
                <label htmlFor="f-name">שם הזוג<input id="f-name" required placeholder="נועה & דניאל" value={formData.coupleName} onChange={(e) => setFormData({ ...formData, coupleName: e.target.value })} /></label>
                <label htmlFor="f-phone">טלפון<input id="f-phone" type="tel" required placeholder="050-0000000" dir="ltr" style={{ textAlign: "right" }} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></label>
                <label htmlFor="f-date">תאריך החתונה<input id="f-date" type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></label>
                <p className="date-note">{dateNote}</p>
                <label htmlFor="f-venue">איפה מתחתנים?<input id="f-venue" required placeholder="שם המקום" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} /></label>
                <button type="submit">שליחה</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer onClick={onFooterClick}>ERAN YOSEF © {new Date().getFullYear()}</footer>

      {/* נגן צף */}
      {np && (
        <div className={`np ${paused ? "paused" : ""}`}>
          <button className="pp" aria-label="השהיה או המשך" onClick={() => { const a = audio.current!; if (a.paused) a.play().catch(() => {}); else a.pause(); }} />
          <div className="tt"><b>{np.title}</b><small>{np.sub}</small><div className="wave"><i /><i /><i /><i /><i /></div></div>
          <button className="x" aria-label="סגירה" onClick={stop}>✕</button>
          <span className="prog" style={{ width: `${prog * 100}%` }} />
        </div>
      )}

      {/* כל מה שהזוג כתב */}
      {reading && (
        <div className="sheet-bg" onClick={(e) => { if (e.target === e.currentTarget) setReading(null); }}>
          <div className="sheet" role="dialog" aria-label={reading.couple_name}>
            {reading.image_url && <img src={reading.image_url} alt="" style={{ objectPosition: objPos(reading.couple_name) }} />}
            <div className="sh-in">
              <button className="sh-x" aria-label="סגירה" onClick={() => setReading(null)}>✕</button>
              <b className="sh-n">{reading.couple_name}</b>
              {(reading.date || reading.venue) && <span className="sh-m">{[reading.date, reading.venue].filter(Boolean).join(" · ")}</span>}
              {clean(reading.best_thing) && clean(reading.recommendation) && <p className="lead">{clean(reading.best_thing)}</p>}
              {(clean(reading.recommendation) || clean(reading.best_thing)).split("\n").map((l, i) => <p key={i}>{l}</p>)}
              {reading.audio_url && <button className="voice dark" onClick={() => play(`t${reading.id}`, reading.audio_url!, reading.couple_name, "הקלטה קולית לערן")}><i />להקשיב להקלטה</button>}
            </div>
          </div>
        </div>
      )}

      {/* צפייה בסרטון */}
      {viewing !== null && videos[viewing] && (
        <div className="player" onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}
          onTouchStart={(e) => { sx.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (sx.current == null) return; const dx = e.changedTouches[0].clientX - sx.current; if (Math.abs(dx) > 50) setViewing((i) => (i! + (dx > 0 ? 1 : -1) + videos.length) % videos.length); sx.current = null; }}>
          <button className="cl" aria-label="סגירה" onClick={() => setViewing(null)}>✕</button>
          <button className="pn prev" aria-label="הקודם" onClick={() => setViewing((i) => (i! - 1 + videos.length) % videos.length)}>→</button>
          <video key={videos[viewing].video_url} src={videos[viewing].video_url} controls autoPlay playsInline onEnded={() => setViewing((i) => (i! + 1) % videos.length)} />
          <button className="pn next" aria-label="הבא" onClick={() => setViewing((i) => (i! + 1) % videos.length)}>←</button>
        </div>
      )}
    </main>
  );
}
