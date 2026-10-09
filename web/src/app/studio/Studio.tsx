"use client";

import Link from "next/link";
import { TemplateScreen } from "../TemplateScreens";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Layout = "screen" | "pip" | "split";
type Template = "finds" | "walkthrough" | "showcase";
type Label = { id: string; text: string; at: number };

const TEMPLATES: Record<Template, { name: string; bg: string; prefix: (n: number) => string; kind: "Finds List" | "Walkthrough" | "Showcase" }> = {
  finds: { name: "Finds List", bg: "linear-gradient(160deg,#9b7bff,#4a2fb0)", prefix: (n) => `${String(n).padStart(2, "0")} · `, kind: "Finds List" },
  walkthrough: { name: "Walkthrough", bg: "linear-gradient(160deg,#f4a6d7,#7c5cdc)", prefix: (n) => `STEP ${n} · `, kind: "Walkthrough" },
  showcase: { name: "Showcase", bg: "linear-gradient(160deg,#c9b8f5,#2f2350)", prefix: () => "", kind: "Showcase" },
};

const SAMPLE_URL = "/sample/screen-recording.mp4";
const SAMPLE_LABELS = ["Noted", "Fernwood", "Pennywise", "Brunchbook", "Loomly"];

const STORE = "reelvii.project.v1";
const LABEL_SECONDS = 3;

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export default function Studio() {
  const [template, setTemplate] = useState<Template>("finds");
  const [layout, setLayout] = useState<Layout>("pip");
  const [split, setSplit] = useState(50);
  const [screenUrl, setScreenUrl] = useState<string | null>(null);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [trim, setTrim] = useState<[number, number]>([0, 0]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [labels, setLabels] = useState<Label[]>([
    { id: "1", text: "Notion templates", at: 0 },
  ]);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [camTake, setCamTake] = useState(false); // cameraUrl is a recorded take (has audio)
  const [takeRec, setTakeRec] = useState(false);
  const takeRecorder = useRef<MediaRecorder | null>(null);

  const screenRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  // restore saved editing decisions (media itself is not persisted in this prototype)
  /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.template in TEMPLATES) setTemplate(p.template);
      if (["screen", "pip", "split"].includes(p.layout)) setLayout(p.layout);
      if (typeof p.split === "number") setSplit(p.split);
      if (Array.isArray(p.labels)) setLabels(p.labels);
    } catch {}
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // autosave (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORE, JSON.stringify({ template, layout, split, labels, trim }));
        setSaved(true);
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [template, layout, split, labels, trim]);

  useEffect(() => {
    const el = cameraRef.current;
    if (el) el.srcObject = camStream;
  }, [camStream, layout, cameraUrl]);

  useEffect(() => () => camStream?.getTracks().forEach((t) => t.stop()), [camStream]);

  const camBusy = useRef(false);
  const camOn = async () => {
    if (camBusy.current) return;
    camBusy.current = true;
    setCamError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("Camera API unavailable", "NotSupportedError");
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e) {
        // no mic (or mic denied) shouldn't stop the camera: retry video-only
        const name = (e as DOMException).name;
        if (name === "NotFoundError" || name === "NotAllowedError" || name === "OverconstrainedError") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setCamError("Camera on, but the microphone isn't available — takes will have no audio.");
        } else throw e;
      }
      setCamStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return stream;
      });
      if (layout === "screen") setLayout("pip");
    } catch (e) {
      const name = (e as DOMException).name;
      setCamError(
        name === "NotAllowedError"
          ? "Camera permission denied. Click the camera icon in the address bar, set Camera to Allow, then reload."
          : name === "NotFoundError"
            ? "No camera found on this device."
            : name === "NotReadableError"
              ? "Camera is in use by another app or tab. Close it and try again."
              : name === "NotSupportedError"
                ? "Camera needs a secure page: open this via http://localhost:3000 or HTTPS."
                : `Couldn't start the camera (${name}).`,
      );
    } finally {
      camBusy.current = false;
    }
  };
  // auto-enable camera + mic for PiP/Split unless the user switched it off
  const camUserOff = useRef(false);
  useEffect(() => {
    if (layout !== "screen" && !camStream && !cameraUrl && !camUserOff.current) void camOn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const camOff = () => {
    camStream?.getTracks().forEach((t) => t.stop());
    setCamStream(null);
  };

  const startTake = () => {
    if (!camStream) return;
    const chunks: Blob[] = [];
    const r = new MediaRecorder(camStream);
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = () => {
      setCameraUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(new Blob(chunks, { type: r.mimeType }));
      });
      setCamTake(true);
      camOff();
    };
    r.start();
    takeRecorder.current = r;
    setTakeRec(true);
    if (screenUrl) {
      seek(trim[0]);
      void screenRef.current?.play();
      setPlaying(true);
    }
  };
  const stopTake = () => {
    takeRecorder.current?.stop();
    setTakeRec(false);
    syncPlay(false);
    seek(trim[0]);
  };

  const pickFile = (set: (u: string | null) => void, prev: string | null) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (prev) URL.revokeObjectURL(prev);
    set(URL.createObjectURL(f));
  };

  const loadSample = () => {
    if (screenUrl) URL.revokeObjectURL(screenUrl);
    setScreenUrl(SAMPLE_URL);
    setLabels(SAMPLE_LABELS.map((text, i) => ({ id: `s${i}`, text, at: i * 3 })));
  };

  const onMeta = () => {
    const d = screenRef.current?.duration ?? 0;
    if (Number.isFinite(d)) {
      setDuration(d);
      setTrim([0, d]);
    }
  };

  const syncPlay = useCallback((go: boolean) => {
    const els = [screenRef.current, camStream ? null : cameraRef.current, voiceRef.current];
    els.forEach((el) => {
      if (!el) return;
      if (go) void el.play().catch(() => {});
      else el.pause();
    });
    setPlaying(go);
  }, [camStream]);

  const seek = (t: number) => {
    [screenRef.current, camStream ? null : cameraRef.current, voiceRef.current].forEach((el) => {
      if (el) el.currentTime = Math.min(t, el.duration || t);
    });
    setTime(t);
  };

  // enforce trim range during playback
  const onTime = () => {
    const v = screenRef.current;
    if (!v) return;
    setTime(v.currentTime);
    if (v.currentTime >= trim[1] - 0.05) {
      syncPlay(false);
      seek(trim[0]);
    }
  };

  const toggle = () => {
    if (!screenUrl) return;
    if (!playing && time < trim[0]) seek(trim[0]);
    syncPlay(!playing);
  };

  const addLabel = () => {
    const text = draft.trim();
    if (!text) return;
    setLabels((l) => [...l, { id: crypto.randomUUID(), text, at: Math.round(time * 10) / 10 }].sort((a, b) => a.at - b.at));
    setDraft("");
  };

  const activeLabel = useMemo(() => {
    const idx = labels.findLastIndex((l) => time >= l.at && time < l.at + LABEL_SECONDS);
    return idx === -1 ? null : { ...labels[idx], n: idx + 1 };
  }, [labels, time]);

  const startRec = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(new Blob(chunks, { type: r.mimeType }));
        });
      };
      r.start();
      recorder.current = r;
      setRecording(true);
      // record against the video: play along so narration lines up
      if (screenUrl) {
        seek(trim[0]);
        void screenRef.current?.play();
        void cameraRef.current?.play();
        setPlaying(true);
      }
    } catch {
      setMicError("Microphone blocked or unavailable (needs HTTPS or localhost, and permission).");
    }
  };

  const stopRec = () => {
    recorder.current?.stop();
    setRecording(false);
    syncPlay(false);
  };

  const exportProject = () => {
    const project = {
      version: 1,
      aspect_ratio: "9:16",
      template,
      layout,
      split,
      trim_ms: trim.map((t) => Math.round(t * 1000)),
      labels: labels.map((l) => ({ text: l.text, at_ms: Math.round(l.at * 1000) })),
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }));
    a.download = "reelvii-project.json";
    a.click();
  };

  const T = TEMPLATES[template];
  const screenVideo = (
    <video
      ref={screenRef}
      src={screenUrl ?? undefined}
      onLoadedMetadata={onMeta}
      onTimeUpdate={onTime}
      onEnded={() => syncPlay(false)}
      muted
      playsInline
      className="h-full w-full object-cover"
    />
  );
  const cameraVideo = camStream || cameraUrl ? (
    <video
      ref={cameraRef}
      src={camStream ? undefined : (cameraUrl ?? undefined)}
      muted={!!camStream || !camTake}
      autoPlay={!!camStream}
      playsInline
      className={`h-full w-full object-cover ${camStream ? "-scale-x-100" : ""}`}
    />
  ) : (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-hot to-violet text-[10px] font-semibold text-white">
      Camera
    </div>
  );
  const emptyScreen = (
    <div className="relative h-full w-full">
      <TemplateScreen kind={T.kind} />
      <span className="absolute inset-x-3 bottom-3 rounded-xl bg-ink/80 px-3 py-2 text-center text-[10px] font-medium text-white">
        Template preview — import or load the sample to edit
      </span>
    </div>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="display text-2xl font-extrabold">
          reelvii<span className="text-violet-hot">.</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">{saved ? "Autosaved" : ""}</span>
          <button onClick={exportProject} className="rounded-full bg-violet px-5 py-2 text-sm font-semibold hover:bg-violet-hot">
            Save project JSON
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[280px_1fr_300px]">
        {/* LEFT: media */}
        <section className="space-y-4 rounded-3xl bg-plum-2 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-lilac">Media</h2>
          <button onClick={loadSample} className="w-full rounded-2xl border border-violet-hot/50 bg-violet-hot/10 p-3 text-sm font-semibold text-lilac hover:bg-violet-hot/20">
            ✨ Use sample recording
          </button>
          <label className="block cursor-pointer rounded-2xl bg-violet p-4 text-center text-sm font-semibold hover:bg-violet-hot">
            ＋ {screenUrl ? "Replace" : "Import"} screen recording
            <input type="file" accept="video/*" hidden onChange={pickFile(setScreenUrl, screenUrl)} />
          </label>
          {camStream ? (
            <div className="space-y-2 rounded-2xl border border-violet-hot/40 p-3">
              <p className="text-xs text-white/60">Camera live. Pick PiP or Split, then record a take — your screen recording plays while you film.</p>
              {takeRec ? (
                <button onClick={stopTake} className="w-full rounded-xl bg-red-500 p-2.5 text-sm font-semibold">■ Stop take</button>
              ) : (
                <button onClick={startTake} className="w-full rounded-xl bg-red-500 p-2.5 text-sm font-semibold">● Record take</button>
              )}
              {!takeRec && <button onClick={() => { camUserOff.current = true; camOff(); }} className="w-full text-xs text-white/50 underline">Turn camera off</button>}
            </div>
          ) : (
            <button onClick={() => { camUserOff.current = false; void camOn(); }} className="w-full rounded-2xl border border-white/15 p-3 text-sm font-semibold hover:bg-white/5">
              📷 {cameraUrl && camTake ? "Re-record with camera" : "Turn on camera"}
            </button>
          )}
          {camError && <p className="text-xs text-red-300">{camError}</p>}
          <label className="block cursor-pointer rounded-2xl border border-white/15 p-3 text-center text-sm hover:bg-white/5">
            {cameraUrl ? "Replace" : "Add"} camera video (optional)
            <input type="file" accept="video/*" hidden onChange={(e) => { setCamTake(false); pickFile(setCameraUrl, cameraUrl)(e); }} />
          </label>

          <h2 className="pt-2 text-xs font-bold uppercase tracking-widest text-lilac">Template</h2>
          <div className="space-y-2">
            {(Object.keys(TEMPLATES) as Template[]).map((k) => (
              <button
                key={k}
                onClick={() => setTemplate(k)}
                className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left text-sm font-semibold ${template === k ? "bg-white/15" : "hover:bg-white/5"}`}
              >
                <span className="h-14 w-8 shrink-0 overflow-hidden rounded-md border-2 border-ink bg-white"><TemplateScreen kind={TEMPLATES[k].kind} /></span>
                {TEMPLATES[k].name}
              </button>
            ))}
          </div>

          <h2 className="pt-2 text-xs font-bold uppercase tracking-widest text-lilac">Voiceover</h2>
          {recording ? (
            <button onClick={stopRec} className="w-full rounded-2xl bg-red-500 p-3 text-sm font-semibold">
              ■ Stop recording
            </button>
          ) : (
            <button onClick={startRec} className="w-full rounded-2xl border border-white/15 p-3 text-sm font-semibold hover:bg-white/5">
              🎙 {voiceUrl ? "Re-record" : "Record"} voiceover
            </button>
          )}
          {micError && <p className="text-xs text-red-300">{micError}</p>}
          {voiceUrl && (
            <div className="space-y-2 text-xs text-white/60">
              <audio ref={voiceRef} src={voiceUrl} />
              <p>Voiceover ready — plays in sync with the video.</p>
              <button onClick={() => setVoiceUrl(null)} className="underline">Remove</button>
            </div>
          )}
        </section>

        {/* CENTER: preview */}
        <section className="flex flex-col items-center gap-4">
          <div
            className="relative aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[28px] border-[6px] border-ink shadow-[0_30px_100px_-20px_rgba(155,123,255,0.5)]"
            style={{ background: T.bg }}
          >
            {layout === "split" ? (
              <div className="flex h-full flex-col">
                <div style={{ height: `${split}%` }}>{cameraVideo}</div>
                <div className="h-0.5 bg-white" />
                <div className="flex-1 overflow-hidden">{screenUrl ? screenVideo : emptyScreen}</div>
              </div>
            ) : (
              <div className={layout === "screen" && template === "showcase" ? "h-full p-6 pt-12" : "h-full"}>
                <div className={`h-full overflow-hidden ${template === "showcase" && layout === "screen" ? "rounded-2xl" : ""}`}>
                  {screenUrl ? screenVideo : emptyScreen}
                </div>
              </div>
            )}
            {layout === "pip" && (
              <div className="absolute bottom-6 right-3 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg">
                {cameraVideo}
              </div>
            )}
            {activeLabel && (
              <div className="absolute left-3 top-4 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                <span className="text-violet-hot">{T.prefix(activeLabel.n)}</span>
                {activeLabel.text}
              </div>
            )}
          </div>

          <div className="flex w-full max-w-[320px] items-center gap-3">
            <button
              onClick={toggle}
              disabled={!screenUrl}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink disabled:opacity-40"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.05}
              value={time}
              disabled={!screenUrl}
              onChange={(e) => seek(Number(e.target.value))}
              className="flex-1 accent-violet-hot"
              aria-label="Scrubber"
            />
            <span className="text-xs tabular-nums text-white/60">{fmt(time)} / {fmt(duration)}</span>
          </div>
        </section>

        {/* RIGHT: tools */}
        <section className="space-y-5 rounded-3xl bg-plum-2 p-5">
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-lilac">Layout</h2>
            <div className="grid grid-cols-3 gap-2">
              {([["screen", "Screen"], ["pip", "PiP"], ["split", "Split"]] as const).map(([k, n]) => (
                <button
                  key={k}
                  onClick={() => setLayout(k)}
                  className={`rounded-xl py-2.5 text-sm font-semibold ${layout === k ? "bg-violet" : "bg-white/10 hover:bg-white/15"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            {layout === "split" && (
              <div className="mt-3 flex gap-2">
                {[50, 30].map((v) => (
                  <button key={v} onClick={() => setSplit(v)} className={`flex-1 rounded-lg py-1.5 text-xs ${split === v ? "bg-white/20" : "bg-white/5"}`}>
                    {v}/{100 - v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-lilac">Trim</h2>
            <label className="block text-xs text-white/60">Start {fmt(trim[0])}
              <input type="range" min={0} max={duration || 1} step={0.1} value={trim[0]} disabled={!screenUrl}
                onChange={(e) => setTrim([Math.min(Number(e.target.value), trim[1] - 0.5), trim[1]])}
                className="w-full accent-violet-hot" />
            </label>
            <label className="block text-xs text-white/60">End {fmt(trim[1])}
              <input type="range" min={0} max={duration || 1} step={0.1} value={trim[1]} disabled={!screenUrl}
                onChange={(e) => setTrim([trim[0], Math.max(Number(e.target.value), trim[0] + 0.5)])}
                className="w-full accent-violet-hot" />
            </label>
            <p className="text-xs text-white/40">Output length {fmt(Math.max(0, trim[1] - trim[0]))}</p>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-lilac">Labels</h2>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLabel()}
                placeholder={`Label at ${fmt(time)}`}
                className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />
              <button onClick={addLabel} className="rounded-xl bg-violet px-3 text-sm font-semibold">Add</button>
            </div>
            <ul className="mt-3 space-y-1.5">
              {labels.map((l, i) => (
                <li key={l.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <button onClick={() => seek(l.at)} className="truncate text-left">
                    <span className="text-violet-hot">{String(i + 1).padStart(2, "0")}</span> {l.text}
                    <span className="ml-2 text-xs text-white/40">{fmt(l.at)}</span>
                  </button>
                  <button onClick={() => setLabels((x) => x.filter((y) => y.id !== l.id))} className="ml-2 text-white/40 hover:text-white" aria-label="Delete label">✕</button>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-white/40">
            Prototype: preview only. MP4 export needs the server render worker (not built yet) — for now you can save the project JSON.
          </p>
        </section>
      </div>
    </main>
  );
}
