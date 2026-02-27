export default function ThanksPage() {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center">
              <span className="text-[var(--accent)] text-lg">✓</span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              You’re on the waitlist
            </h1>
          </div>
  
          <p className="mt-3 text-sm leading-relaxed text-[color:rgba(245,241,232,0.7)]">
            Thanks for signing up. We’ll email you when early access is ready.
          </p>
  
          <div className="mt-6 flex gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-white/10 transition"
            >
              Back to home
            </a>
  
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 transition"
            >
              Follow updates
            </a>
          </div>
        </div>
      </main>
    );
  }