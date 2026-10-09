const templates = [
  {
    name: "Finds List",
    blurb: "Numbered sections, title card, subtle zooms and quick transitions.",
    tag: "Most popular",
    from: "#9b7bff",
    to: "#4a2fb0",
  },
  {
    name: "Walkthrough",
    blurb: "Step labels, focus rectangles and controlled pacing.",
    tag: "Tutorials",
    from: "#f4a6d7",
    to: "#7c5cdc",
  },
  {
    name: "Showcase",
    blurb: "Premium framing, branded backdrop and a clean end card.",
    tag: "Demos",
    from: "#c9b8f5",
    to: "#2f2350",
  },
];

const steps = [
  { n: "01", title: "Record", body: "Screen-record on your phone like you always do." },
  { n: "02", title: "Style", body: "Pick a template, layout and backdrop. Trim in a tap." },
  { n: "03", title: "Share", body: "Export a 9:16 MP4 ready for TikTok and Reels." },
];

const layouts = [
  { name: "Screen only", hint: "Your recording, framed beautifully." },
  { name: "Picture-in-picture", hint: "Your face in a bubble, anywhere you like." },
  { name: "Split screen", hint: "50/50 or 30/70 with a draggable divider." },
];

function Logo() {
  return (
    <span className="display text-2xl font-extrabold">
      reelvii<span className="text-violet-hot">.</span>
    </span>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto h-[600px] w-[290px] rounded-[44px] border-[10px] border-ink bg-ink shadow-[0_40px_120px_-20px_rgba(155,123,255,0.55)]">
      <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-paper">
        {/* fake screen recording */}
        <div className="screen-scroll absolute inset-x-0 top-0 space-y-3 p-4 pt-12">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            [
              ["#e9defe", "#cdb8ff"],
              ["#ffe3f1", "#f9b4d6"],
              ["#dfe9ff", "#b3c8ff"],
              ["#e4f7ec", "#a9e2c0"],
            ].map(([a, b], i) => (
              <div key={`${k}-${i}`} className="rounded-2xl p-3" style={{ background: a }}>
                <div className="h-24 rounded-xl" style={{ background: b }} />
                <div className="mt-2 h-2.5 w-2/3 rounded-full bg-ink/20" />
                <div className="mt-1.5 h-2 w-1/3 rounded-full bg-ink/10" />
              </div>
            )),
          )}
        </div>
        {/* caption label */}
        <div className="caption-pop absolute left-4 top-16 z-10 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
          <span className="text-violet-hot">01</span> · Notion templates
        </div>
        {/* PiP bubble */}
        <div className="absolute bottom-24 right-4 z-10 h-20 w-20 rounded-full border-4 border-white bg-gradient-to-br from-violet-hot to-violet shadow-lg" />
        {/* bottom tool rail */}
        <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-ink/95 p-3 text-white backdrop-blur">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="progress-bar h-full rounded-full bg-violet-hot" />
          </div>
          <div className="flex justify-between text-[10px] font-medium text-white/70">
            {["Trim", "Layout", "Voice", "Text", "Zoom"].map((t) => (
              <span key={t} className={t === "Layout" ? "text-violet-hot" : ""}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="hidden gap-8 text-sm text-white/70 md:flex">
          <a href="#templates" className="hover:text-white">Templates</a>
          <a href="#layouts" className="hover:text-white">Layouts</a>
          <a href="#how" className="hover:text-white">How it works</a>
        </nav>
        <a
          href="#cta"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lilac"
        >
          Start creating ↗
        </a>
      </header>

      {/* HERO */}
      <section className="glow grain relative">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-24 pt-10 md:grid-cols-[1.15fr_0.85fr] md:pt-16">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-lilac">
              <span className="rec-dot h-2 w-2 rounded-full bg-violet-hot" />
              Built for screen-led creators
            </p>
            <h1 className="display text-[clamp(3.2rem,9vw,7rem)] font-extrabold">
              Make your screen the{" "}
              <span className="text-violet-hot">main character.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/70">
              The content studio for everything happening on your screen. Turn a
              phone recording into a polished vertical video — no timeline
              degree required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                id="cta"
                href="#"
                className="rounded-full bg-violet px-6 py-3.5 font-semibold text-white shadow-[0_8px_30px_-6px_rgba(124,92,220,0.8)] transition hover:bg-violet-hot"
              >
                Start creating ↗
              </a>
              <a
                href="#templates"
                className="rounded-full border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                See templates
              </a>
            </div>
            <p className="mt-4 text-xs text-white/40">
              Works in iPhone Safari. No download needed.
            </p>
          </div>

          <div className="relative">
            <PhoneMock />
            <span
              className="float absolute -left-2 top-24 hidden rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-ink shadow-xl md:block"
              style={{ ["--r" as string]: "-6deg" }}
            >
              🎙 Voiceover synced
            </span>
            <span
              className="float absolute -right-2 bottom-40 hidden rounded-2xl bg-lilac px-3 py-2 text-xs font-semibold text-ink shadow-xl md:block"
              style={{ ["--r" as string]: "5deg", animationDelay: "1.5s" }}
            >
              ✨ Finds List
            </span>
          </div>
        </div>
      </section>

      {/* TEMPLATES */}
      <section id="templates" className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="display text-5xl font-extrabold md:text-6xl">
          Pick a look. <span className="text-lilac">Post today.</span>
        </h2>
        <p className="mt-4 max-w-xl text-white/60">
          Three polished templates to start. Every one is tuned for 9:16 and
          safe zones, so nothing gets hidden behind the TikTok UI.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {templates.map((t) => (
            <article
              key={t.name}
              className="group relative overflow-hidden rounded-3xl p-6 transition hover:-translate-y-1"
              style={{ background: `linear-gradient(160deg, ${t.from}, ${t.to})` }}
            >
              <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium">
                {t.tag}
              </span>
              <div className="mx-auto my-6 h-56 w-32 rounded-2xl border-4 border-ink bg-ink/80 p-2 shadow-2xl transition group-hover:rotate-2">
                <div className="h-full rounded-lg bg-white/90" />
              </div>
              <h3 className="display text-3xl font-bold">{t.name}</h3>
              <p className="mt-1 text-sm text-white/80">{t.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      {/* LAYOUTS */}
      <section id="layouts" className="bg-paper py-24 text-ink">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="display text-5xl font-extrabold md:text-6xl">
            One recording. <span className="text-violet">Three layouts.</span>
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {layouts.map((l, i) => (
              <div key={l.name} className="rounded-3xl bg-lilac-soft p-6">
                <div className="mx-auto h-48 w-28 overflow-hidden rounded-2xl border-4 border-ink bg-white">
                  {i === 0 && <div className="m-2 h-[calc(100%-1rem)] rounded-lg bg-lilac" />}
                  {i === 1 && (
                    <div className="relative h-full bg-lilac">
                      <div className="absolute bottom-2 right-2 h-9 w-9 rounded-full border-2 border-white bg-violet" />
                    </div>
                  )}
                  {i === 2 && (
                    <div className="flex h-full flex-col">
                      <div className="flex-1 bg-lilac" />
                      <div className="h-0.5 bg-white" />
                      <div className="flex-1 bg-violet" />
                    </div>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-bold">{l.name}</h3>
                <p className="text-sm text-ink/60">{l.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-white/10 bg-plum-2 p-7">
              <span className="font-mono text-sm text-violet-hot">{s.n}</span>
              <h3 className="display mt-3 text-4xl font-bold">{s.title}</h3>
              <p className="mt-2 text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="glow px-5 pb-24 pt-8 text-center">
        <h2 className="display mx-auto max-w-3xl text-5xl font-extrabold md:text-7xl">
          Your studio is already in your pocket.
        </h2>
        <a
          href="#"
          className="mt-8 inline-block rounded-full bg-white px-7 py-4 font-semibold text-ink transition hover:bg-lilac"
        >
          Start creating ↗
        </a>
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-5 py-8 text-xs text-white/40">
        <Logo />
        <span>© 2026 Reelvii</span>
      </footer>
    </main>
  );
}
