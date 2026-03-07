"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Ambient glassy background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute -top-56 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--accent)]/12 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-56 h-[520px] w-[520px] rounded-full bg-white/6 blur-3xl animate-[spin_80s_linear_infinite]" />
        <div className="absolute -bottom-64 -right-64 h-[720px] w-[720px] rounded-full bg-white/5 blur-3xl animate-[spin_120s_linear_infinite]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="group flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="FindYourFit"
              width={40}
              height={40}
              style={{ borderRadius: 12, objectFit: "cover" }}
            />
            <span className="text-sm font-semibold tracking-tight text-[var(--accent)] transition-opacity group-hover:opacity-90">
              FindYourFit
            </span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-white/5 px-3 py-1 text-xs text-[var(--accent)] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-all hover:border-[var(--accent)]/45 hover:bg-[var(--accent)]/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            Early Access
          </span>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col justify-center py-14">
          <div
            className={[
              "max-w-3xl transition-all duration-700 ease-out",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            ].join(" ")}
          >
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-[color:rgba(245,241,232,0.72)] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-all hover:border-[var(--accent)]/25 hover:bg-white/7">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Launching soon — get the invite
            </p>

            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Find brands that actually
              <br />
              <span className="bg-[linear-gradient(90deg,rgba(245,241,232,0.8),rgba(245,241,232,0.5))] bg-clip-text text-transparent">
                fit your style
              </span>
              .
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:rgba(245,241,232,0.62)] sm:text-lg">
              Curated fashion discovery across brands. Compare prices, save
              favorites, and build your personal style board.
            </p>

            {/* Waitlist glass card */}
            <div className="group mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/25 hover:bg-white/7">
              {!done ? (
                <form
                onSubmit={async (e) => {
                  e.preventDefault();
                
                  const res = await fetch("/api/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                
                  const data = await res.json().catch(() => ({}));
                
                  if (res.ok) {
                    window.location.href = "/thanks";
                    return;
                  }
                
                  if (res.status === 409) {
                    alert("Du bist schon auf der Waitlist 🙂");
                    return;
                  }
                
                  alert(data?.error ?? "Something went wrong.");
                }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <label className="sr-only" htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="you@email.com"
                    className="flex-1 rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[color:rgba(245,241,232,0.45)] outline-none transition-all duration-200 focus:border-[var(--accent)]/60 focus:ring-4 focus:ring-[var(--accent)]/15"
                  />

                  <button
                    type="submit"
                    className="relative overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--background)] shadow-[0_10px_30px_rgba(139,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(139,0,0,0.28)] active:translate-y-0 active:scale-[0.98]"
                  >
                    <span className="relative z-10">Join waitlist</span>

                    {/* shimmer */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-[spin_2.2s_linear_infinite]" />
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[color:rgba(245,241,232,0.9)] animate-[pop_420ms_ease-out]">
                  ✅ You’re in — we’ll email you your early access link.
                </div>
              )}

              <p className="mt-3 text-xs text-[color:rgba(245,241,232,0.45)]">
                No spam. One email for launch + early access link.
              </p>
            </div>

            {/* Features */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Brand Discovery", desc: "Find labels that match your vibe in seconds." },
                { title: "Price Comparison", desc: "See the best deal across multiple stores." },
                { title: "Favorites", desc: "Save looks and build your own style board." },
              ].map((f, i) => (
                <div
                  key={f.title}
                  className={[
                    "group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                    "transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/30 hover:bg-white/7",
                    "animate-[float_6s_ease-in-out_infinite]",
                  ].join(" ")}
                  style={{ animationDelay: `${i * 0.25}s` }}
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-[var(--accent)]/35 group-hover:bg-[var(--accent)]/10">
                    {i === 0 && (
                      /* Globe icon for Brand Discovery */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20" />
                        <path d="M12 2a15 15 0 0 1 0 20" />
                        <path d="M12 2a15 15 0 0 0 0 20" />
                      </svg>
                    )}

                    {i === 1 && (
                      /* Price comparison arrows */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h12" />
                        <path d="M12 4l4 3-4 3" />
                        <path d="M20 17H8" />
                        <path d="M12 14l-4 3 4 3" />
                      </svg>
                    )}

                    {i === 2 && (
                      /* Star icon for Favorites */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-sm font-medium">{f.title}</h3>
                  <p className="mt-2 text-sm text-[color:rgba(245,241,232,0.55)]">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-xs text-[color:rgba(245,241,232,0.4)]">
              We’re starting with curated brands + clean UI. Early access spots are limited.
            </p>
          </div>
        </section>

        <footer className="pb-4 text-xs text-[color:rgba(245,241,232,0.4)]">
          © {year} FindYourFit. All rights reserved.
        </footer>
      </div>

      {/* Local keyframes for micro interactions */}
      <style jsx global>{`
        @keyframes pop {
          0% { opacity: 0; transform: scale(0.98) translateY(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </main>
  );
}