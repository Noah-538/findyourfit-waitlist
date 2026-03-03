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

    // Check if already subscribed (helps debugging and allows dev re-sends)
    const { data: existing, error: existingErr } = await supabaseServer
      .from("waitlist")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 400 });
    }

    const alreadySubscribed = !!existing;

    // In production we keep the strict behavior.
    // In development, we allow re-sending the confirmation email even if the user is already subscribed.
    if (alreadySubscribed && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Email already subscribed" }, { status: 409 });
    }

    // Only insert if this email doesn't exist yet
    let insertError: any = null;
    if (!alreadySubscribed) {
      const { error } = await supabaseServer.from("waitlist").insert([{ email }]);
      insertError = error;
    }

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Send email, but don't fail the subscription if email sending fails
    let emailSent = false;
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY fehlt in .env.local");

      const resend = new Resend(apiKey);
      const logoUrl = process.env.EMAIL_LOGO_URL || "http://localhost:3000/logo.jpg";

      const htmlTemplate = `
      <!doctype html>
      <html lang="de">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="dark" />
          <meta name="supported-color-schemes" content="dark" />
          <style>
            @media (max-width: 620px) {
              .container { padding: 18px !important; }
              .card { border-radius: 16px !important; }
              .h1 { font-size: 22px !important; }
              .p { font-size: 14px !important; }
              .btn { display: block !important; width: 100% !important; text-align: center !important; }
              .spacer { height: 14px !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background:#0b0b0b;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;">

          <!-- Preheader (hidden preview text) -->
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
            Du bist auf der FindYourFit Waitlist – Early Access & Updates folgen bald.
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0b0b0b;">
            <tr>
              <td align="center" style="padding:28px 12px;">

                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
                  <tr>
                    <td class="container" style="padding:24px;">

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                        class="card"
                        style="background:#111111;border-radius:20px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.06);">
                        <tr>
                          <td style="padding:26px 24px 10px 24px;">

                            <!-- Logo -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="left" style="padding:0;">
                                  <img src="${logoUrl}" width="84" height="84" alt="FindYourFit" style="display:block;border:0;outline:none;text-decoration:none;border-radius:16px;background:#0b0b0b;" />
                                </td>
                              </tr>
                            </table>

                            <div style="height:14px" class="spacer"></div>

                            <!-- Badge -->
                            <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(177,18,38,0.14);border:1px solid rgba(177,18,38,0.45);color:#ffffff;font-size:12px;letter-spacing:0.2px;">
                              Early Access Waitlist Member
                            </div>

                            <h1 class="h1" style="margin:16px 0 0 0;font-size:24px;line-height:1.25;color:#ffffff;">
                              Willkommen bei FindYourFit.
                            </h1>

                            <p class="p" style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.86);">
                              Du bist jetzt offiziell auf unserer Waitlist – und damit unter den Ersten, die Zugang bekommen.
                            </p>

                            <p class="p" style="margin:12px 0 0 0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.74);">
                              Wir bauen ein datenbasiertes Vergleichsportal für Mode, damit du schneller findest, was wirklich zu dir passt:
                              <span style="color:#ffffff;">weniger Scrollen</span>,
                              <span style="color:#ffffff;">mehr Klarheit</span>,
                              <span style="color:#ffffff;">bessere Entscheidungen</span>.
                            </p>

                            <!-- Email box -->
                            <div style="margin:18px 0 0 0;padding:14px 14px;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
                              <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-bottom:6px;">Registrierte E-Mail</div>
                              <div style="font-size:14px;color:#ffffff;font-weight:600;word-break:break-word;">${email}</div>
                            </div>

                            <!-- What happens next -->
                            <div style="margin:18px 0 0 0;padding:14px 14px;border-radius:14px;background:rgba(177,18,38,0.08);border:1px solid rgba(177,18,38,0.22);">
                              <div style="font-size:13px;color:#ffffff;font-weight:700;margin-bottom:8px;">Was passiert als Nächstes?</div>
                              <div style="font-size:13px;line-height:1.65;color:rgba(255,255,255,0.78);">
                                • Early-Access Einladung (priorisiert)
                                <br/>• Updates zu neuen Features & Brands
                                <br/>• Optional: kurze Umfrage, damit wir FYF auf dich zuschneiden können
                              </div>
                            </div>

                            <!-- CTA -->
                            <div style="height:18px" class="spacer"></div>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td align="left">
                                  <a class="btn" href="https://fyndyourfit.com"
                                    style="display:inline-block;background:#B11226;color:#ffffff;
                                    padding:14px 18px;border-radius:14px;text-decoration:none;font-weight:700;
                                    font-size:14px;letter-spacing:0.2px;">
                                    FindYourFit ansehen
                                  </a>
                                </td>
                              </tr>
                            </table>

                            <p class="p" style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.60);">
                              Tipp: Antworte einfach auf diese Mail und sag uns, welche Brands du am liebsten trägst –
                              das hilft uns extrem beim Feinschliff.
                            </p>

                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="padding:14px 24px 22px 24px;border-top:1px solid rgba(255,255,255,0.06);">
                            <div style="font-size:12px;line-height:1.55;color:rgba(255,255,255,0.55);">
                              Falls du dich nicht angemeldet hast, kannst du diese Mail ignorieren.
                              <br/>
                              <span style="color:rgba(255,255,255,0.42);">© ${new Date().getFullYear()} FindYourFit</span>
                            </div>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

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

    return NextResponse.json({ success: true, emailSent, alreadySubscribed }, { status: 200 });
  } catch (e) {
    console.error("SUBSCRIBE ERROR:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}