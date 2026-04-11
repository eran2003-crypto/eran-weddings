import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { coupleName, phone, date, venue, isPending } = await request.json();

  const message = isPending
    ? `⏳ חוות דעת חדשה ממתינה לאישור!\n\n👫 ${coupleName}\n📅 ${date}\n📍 ${venue}\n\nהיכנס לאתר → 3 קליקים על הפוטר → אשר`
    : `🔔 ליד חדש מהאתר!\n\n👫 ${coupleName}\n📞 ${phone}\n📅 ${date}\n📍 ${venue}`;

  // WhatsApp notification
  await fetch(
    `https://7107.api.green-api.com/waInstance7107584030/sendMessage/23e5e41688b3438aa3d735a962b88d06efc82ec8773f426d85`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: "972544480145@c.us",
        message,
      }),
    }
  );

  // Email notification
  await fetch("https://formsubmit.co/ajax/eran2003@gmail.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _subject: "🔔 ליד חדש מהאתר!",
      "שם הזוג": coupleName,
      "טלפון": phone,
      "תאריך": date,
      "מקום": venue,
    }),
  });

  return NextResponse.json({ ok: true });
}
