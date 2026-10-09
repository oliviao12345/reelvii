export function Rows({ n = 3, dark = false }: { n?: number; dark?: boolean }) {
  const pal = [["#e9defe", "#cdb8ff"], ["#ffe3f1", "#f9b4d6"], ["#dfe9ff", "#b3c8ff"], ["#e4f7ec", "#a9e2c0"]];
  return (
    <div className="space-y-1.5">
      {pal.slice(0, n).map(([a, b], i) => (
        <div key={i} className="rounded-lg p-1.5" style={{ background: dark ? "rgba(255,255,255,0.12)" : a }}>
          <div className="h-8 rounded-md" style={{ background: dark ? "rgba(255,255,255,0.18)" : b }} />
          <div className="mt-1 h-1 w-2/3 rounded-full bg-ink/25" />
        </div>
      ))}
    </div>
  );
}

export function Chip({ children, n }: { children: React.ReactNode; n?: string }) {
  return (
    <span className="rounded-full bg-ink px-2 py-0.5 text-[7px] font-bold text-white">
      {n && <span className="text-violet-hot">{n} · </span>}
      {children}
    </span>
  );
}

/** A tiny rendition of the editor preview for a template. */
export function TemplateScreen({ kind }: { kind: "Finds List" | "Walkthrough" | "Showcase" }) {
  if (kind === "Finds List")
    return (
      <div className="flex h-full flex-col bg-lilac p-2 pt-4">
        <p className="display text-[13px] font-extrabold leading-none text-ink">5 websites to know</p>
        <div className="mt-1.5"><Chip n="01">Notion templates</Chip></div>
        <div className="mt-2 flex-1 overflow-hidden"><Rows n={3} /></div>
        <div className="mt-1 flex justify-between text-[6px] font-semibold text-ink/60"><span>Trim</span><span className="text-violet">Layout</span><span>Voice</span></div>
      </div>
    );
  if (kind === "Walkthrough")
    return (
      <div className="relative flex h-full flex-col bg-lilac-soft p-2 pt-4">
        <Chip n="STEP 2">Add a database</Chip>
        <div className="relative mt-2 flex-1 overflow-hidden">
          <Rows n={3} />
          <div className="absolute inset-x-0 top-9 h-12 rounded-lg border-2 border-violet shadow-[0_0_0_999px_rgba(20,16,31,0.35)]" />
          <span className="absolute right-0 top-[88px] rounded-md bg-violet px-1.5 py-0.5 text-[6px] font-bold text-white">Tap here</span>
        </div>
      </div>
    );
  return (
    <div className="flex h-full flex-col items-center justify-between bg-gradient-to-b from-[#3b2a70] to-ink p-3 pt-5">
      <div className="w-full flex-1 overflow-hidden rounded-xl border-2 border-white/80 bg-paper p-1.5"><Rows n={3} /></div>
      <p className="display mt-2 text-[11px] font-extrabold text-white">reelvii<span className="text-violet-hot">.</span></p>
      <p className="text-[6px] text-white/60">Made with Reelvii</p>
    </div>
  );
}

export function LayoutScreen({ kind }: { kind: 0 | 1 | 2 }) {
  if (kind === 2)
    return (
      <div className="flex h-full flex-col">
        <div className="grid flex-1 place-items-center bg-gradient-to-br from-violet-hot to-violet text-[8px] font-bold text-white">🎥 You</div>
        <div className="h-0.5 bg-white" />
        <div className="flex-1 overflow-hidden bg-lilac p-1.5"><Rows n={2} /></div>
      </div>
    );
  return (
    <div className="relative h-full bg-lilac p-1.5 pt-3">
      <Rows n={3} />
      {kind === 1 && (
        <div className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-violet text-[7px] font-bold text-white">You</div>
      )}
    </div>
  );
}
