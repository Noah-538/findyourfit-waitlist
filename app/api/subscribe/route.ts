import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY missing in env");
  }
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    // Parse JSON safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawEmail = body?.email;

    if (typeof rawEmail !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

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
      const resend = getResend();

      await resend.emails.send({
        from: "FindYourFit <noreply@fyndyourfit.com>",
        to: email,
        subject: "Willkommen bei FindYourFit 🚀",
        html: `<h1>Welcome to FindYourFit</h1><p>Danke für deine Anmeldung zur Waitlist.</p>`,
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