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
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute -top-56 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--accent)]/12 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-56 h-[520px] w-[520px] rounded-full bg-white/6 blur-3xl animate-[spin_80s_linear_infinite]" />
        <div className="absolute -bottom-64 -right-64 h-[720px] w-[720px] rounded-full bg-white/5 blur-3xl animate-[spin_120s_linear_infinite]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="group flex items-center gap-3">
            <img src="/logo.jpg" alt="FyndYourFit" width={40} height={40} style={{ borderRadius: 12, objectFit: "cover" }} />
            <span className="text-sm font-semibold tracking-tight text-[var(--accent)] transition-opacity group-hover:opacity-90">
              FyndYourFit
            </span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-white/5 px-3 py-1 text-xs text-[var(--accent)] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-all hover:border-[var(--accent)]/45 hover:bg-[var(--accent)]/10">
            Early Access
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-14">
          <div className={["max-w-3xl transition-all duration-700 ease-out", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}>

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

            <div className="group mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch("/api/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });

                  if (res.ok) {
                    window.location.href = "/thanks";
                  }
                }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="you@email.com"
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-[var(--foreground)]"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--background)]"
                >
                  Join waitlist
                </button>
              </form>
            </div>

          </div>
        </section>

        <footer className="pb-4 text-xs text-[color:rgba(245,241,232,0.4)]">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {year} FyndYourFit. All rights reserved.</span>
            <a href="/impressum" className="text-[var(--accent)] hover:opacity-80">Impressum</a>
          </div>
        </footer>
      </div>
    </main>
  );
}