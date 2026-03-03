export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { Resend } from "resend";

// --- Simple in-memory rate limiting (good for MVP/dev; for production use Redis/Upstash) ---
type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __fyfRateLimit: Map<string, Bucket> | undefined;
}

const RATE_LIMIT = {
  // per IP
  ip: { windowMs: 60_000, max: 10 },
  // per email
  email: { windowMs: 10 * 60_000, max: 3 },
};

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("true-client-ip") ||
    "unknown"
  );
}

function checkRateLimit(key: string, windowMs: number, max: number) {
  const store = (globalThis.__fyfRateLimit ||= new Map<string, Bucket>());
  const now = Date.now();

  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true as const, remaining: max - 1, resetAt };
  }

  if (b.count >= max) {
    return { allowed: false as const, remaining: 0, resetAt: b.resetAt };
  }

  b.count += 1;
  store.set(key, b);
  return { allowed: true as const, remaining: max - b.count, resetAt: b.resetAt };
}

export async function POST(req: Request) {
  try {
    // Rate limit early (before any DB/email work)
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`ip:${ip}`, RATE_LIMIT.ip.windowMs, RATE_LIMIT.ip.max);
    if (!ipLimit.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil((ipLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    // Parse JSON safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawEmail = body?.email;

    // Honeypot: client should send `website` as an empty hidden field.
    // (Use ONE dedicated field so you don't accidentally block legitimate payload fields like `name`.)
    const honeypot = body?.website;
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      // Pretend success to not signal bots; do not write to DB or send email
      return NextResponse.json({ success: true, emailSent: false }, { status: 200 });
    }

    if (typeof rawEmail !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

    const emailLimit = checkRateLimit(
      `email:${email}`,
      RATE_LIMIT.email.windowMs,
      RATE_LIMIT.email.max
    );
    if (!emailLimit.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil((emailLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    // Basic email sanity check (not perfect, but prevents obvious junk)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("waitlist").insert([{ email }]);

    if (error) {
      // Unique violation (Postgres)
      if ((error as any).code === "23505") {
        return NextResponse.json(
          { error: "Email already subscribed" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Send email, but don't fail the subscription if email sending fails
    let emailSent = false;
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY fehlt in .env.local");

      const resend = new Resend(apiKey);

      const htmlTemplate = `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;background:#0b0b0b;color:#F5F1E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;">
          <div style="max-width:560px;margin:40px auto;background:#111111;border-radius:16px;padding:24px;">
            
            <div style="font-weight:700;font-size:16px;">fyndyourfit</div>

            <h1 style="margin-top:20px;font-size:22px;">
              Willkommen – du bist drin ✅
            </h1>

            <p style="opacity:0.85;font-size:14px;">
              Wir haben deine E-Mail erfolgreich zur Waitlist hinzugefügt.
              Sobald Early Access startet, bekommst du als Erste:r Bescheid.
            </p>

            <div style="margin:20px 0;padding:12px;background:rgba(245,241,232,0.05);border-radius:12px;font-size:13px;">
              <strong>E-Mail:</strong> ${email}
            </div>

            <a href="https://fyndyourfit.com"
              style="display:inline-block;background:#B11226;color:#F5F1E8;
              padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:600;">
              Mehr erfahren
            </a>

            <p style="margin-top:20px;font-size:12px;opacity:0.6;">
              Falls du dich nicht angemeldet hast, ignoriere diese Mail einfach.
            </p>

          </div>
        </body> 
      </html>
      `;

      await resend.emails.send({
        from: "Fyndyourfit <noreply@fyndyourfit.com>",
        to: email,
        subject: "Du bist auf der Waitlist ✅",
        html: htmlTemplate,
      });

      emailSent = true;
    } catch (mailErr) {
      console.error("RESEND ERROR:", mailErr);
    }

    return NextResponse.json({ success: true, emailSent }, { status: 200 });
  } catch (e) {
    console.error("SUBSCRIBE ERROR:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}