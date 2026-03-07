

export default function ImpressumPage() {
  const year = new Date().getFullYear();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Ambient background (same style as homepage) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute -top-56 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--accent)]/12 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-56 h-[520px] w-[520px] rounded-full bg-white/6 blur-3xl animate-[spin_80s_linear_infinite]" />
        <div className="absolute -bottom-64 -right-64 h-[720px] w-[720px] rounded-full bg-white/5 blur-3xl animate-[spin_120s_linear_infinite]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <a href="/" className="group flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="FyndYourFit"
              width={40}
              height={40}
              style={{ borderRadius: 12, objectFit: "cover" }}
            />
            <span className="text-sm font-semibold tracking-tight text-[var(--accent)] transition-opacity group-hover:opacity-90">
              FyndYourFit
            </span>
          </a>

          <a
            href="/"
            className="inline-flex items-center rounded-full border border-[var(--accent)]/25 bg-white/5 px-3 py-1 text-xs text-[var(--accent)] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-all hover:border-[var(--accent)]/45 hover:bg-[var(--accent)]/10"
          >
            Back to home
          </a>
        </header>

        {/* Content */}
        <section className="flex flex-1 flex-col justify-center py-14">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-[color:rgba(245,241,232,0.72)] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              Legal
            </p>

            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Impressum
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:rgba(245,241,232,0.62)] sm:text-lg">
              Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
            </p>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
              <div className="space-y-6 text-sm leading-relaxed text-[color:rgba(245,241,232,0.78)] sm:text-base">

                <div>
                  <p className="font-medium text-[var(--foreground)]">fyndyourfit</p>
                  <p>Ein Angebot der Frey, Schulze & Schäfers GbR</p>
                </div>

                <div>
                  <p className="font-medium text-[var(--foreground)]">Anschrift</p>
                  <p>Untere Heerbergstraße 27</p>
                  <p>97078 Würzburg</p>
                  <p>Deutschland</p>
                </div>

                <div>
                  <p className="font-medium text-[var(--foreground)]">Gesellschafter</p>
                  <p>Noah Schulze</p>
                  <p>Ian Frey</p>
                  <p>Enno Schäfers</p>
                </div>

                <div>
                  <p className="font-medium text-[var(--foreground)]">Kontakt</p>
                  <p>E-Mail: info@fyndyourfit.com</p>
                  <p>Telefon: +49 160 9037 6756</p>
                </div>

                <div>
                  <p className="font-medium text-[var(--foreground)]">Verbraucherstreitbeilegung / Universalschlichtungsstelle</p>
                  <p>
                    Wir sind nicht verpflichtet und nicht bereit, an
                    Streitbeilegungsverfahren vor einer
                    Verbraucherschlichtungsstelle teilzunehmen.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-[var(--foreground)]">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</p>
                  <p>Ian Frey</p>
                  <p>Untere Heerbergstraße 27</p>
                  <p>97078 Würzburg</p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-4 text-xs text-[color:rgba(245,241,232,0.4)]">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {year} FyndYourFit. All rights reserved.</span>
            <a href="/impressum" className="text-[var(--accent)] hover:opacity-80">
              Impressum
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}