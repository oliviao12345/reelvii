import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Asset } from "expo-asset";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const c = {
  ink: "#14101f",
  plum: "#1a1626",
  plum2: "#241d38",
  violet: "#7c5cdc",
  hot: "#9b7bff",
  lilac: "#c9b8f5",
  soft: "#f3effd",
  paper: "#fbfaff",
};

const templates = [
  { name: "Finds List", tag: "Most popular", a: "#9b7bff" },
  { name: "Walkthrough", tag: "Tutorials", a: "#f4a6d7" },
  { name: "Showcase", tag: "Demos", a: "#c9b8f5" },
];

const drafts = [
  {
    name: "5 websites every London girl should know",
    meta: "Finds List · 0:28",
    status: "Draft",
  },
  {
    name: "Notion setup walkthrough",
    meta: "Walkthrough · 0:44",
    status: "Exported",
  },
];

const tools = ["Trim", "Layout", "Voice", "Text", "Zoom", "Style"] as const;
const layouts = ["Screen", "PiP", "Split"] as const;

type Project = {
  id: string;
  name: string;
  template: string;
  uri: string;
  duration: number; // seconds
  layout: (typeof layouts)[number];
  trim: [number, number];
  labels: { text: string; at: number }[];
  cameraUri?: string; // recorded talking-head take
  voiceUri?: string; // voiceover recording (audio only)
  exported?: boolean;
};

const KEY = "reelvii.projects.v1";
const fmt = (t: number) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

const rowPal = [
  ["#e9defe", "#cdb8ff"],
  ["#ffe3f1", "#f9b4d6"],
  ["#dfe9ff", "#b3c8ff"],
  ["#e4f7ec", "#a9e2c0"],
];

function MiniRows({ n = 3 }: { n?: number }) {
  return (
    <View style={{ gap: 5 }}>
      {rowPal.slice(0, n).map(([a, b], i) => (
        <View
          key={i}
          style={{ backgroundColor: a, borderRadius: 7, padding: 4 }}
        >
          <View style={{ height: 22, borderRadius: 5, backgroundColor: b }} />
          <View
            style={{
              height: 3,
              width: "65%",
              borderRadius: 2,
              backgroundColor: "rgba(20,16,31,0.25)",
              marginTop: 4,
            }}
          />
        </View>
      ))}
    </View>
  );
}

function MiniChip({ children, n }: { children: string; n?: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: c.ink,
        borderRadius: 99,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 6, fontWeight: "800" }}>
        {n ? <Text style={{ color: c.hot }}>{n} · </Text> : null}
        {children}
      </Text>
    </View>
  );
}

/** Tiny rendition of a template's editor preview. */
function MiniScreen({ name }: { name: string }) {
  if (name === "Walkthrough")
    return (
      <View
        style={{ flex: 1, backgroundColor: c.soft, padding: 6, paddingTop: 10 }}
      >
        <MiniChip n="STEP 2">Add a database</MiniChip>
        <View style={{ flex: 1, marginTop: 6 }}>
          <MiniRows n={3} />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 30,
              height: 36,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: c.violet,
            }}
          />
        </View>
      </View>
    );
  if (name === "Showcase")
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#2f2350",
          padding: 8,
          paddingTop: 12,
          alignItems: "center",
        }}
      >
        <View
          style={{
            flex: 1,
            alignSelf: "stretch",
            borderRadius: 9,
            borderWidth: 2,
            borderColor: "#fff",
            backgroundColor: c.paper,
            padding: 4,
          }}
        >
          <MiniRows n={3} />
        </View>
        <Text
          style={{
            color: "#fff",
            fontWeight: "800",
            fontSize: 9,
            marginTop: 5,
          }}
        >
          reelvii<Text style={{ color: c.hot }}>.</Text>
        </Text>
      </View>
    );
  return (
    <View
      style={{ flex: 1, backgroundColor: c.lilac, padding: 6, paddingTop: 10 }}
    >
      <Text style={{ color: c.ink, fontWeight: "800", fontSize: 8 }}>
        5 websites to know
      </Text>
      <View style={{ marginVertical: 4 }}>
        <MiniChip n="01">Notion templates</MiniChip>
      </View>
      <MiniRows n={3} />
    </View>
  );
}

const SAMPLE_LABELS = [
  "Noted",
  "Fernwood",
  "Pennywise",
  "Brunchbook",
  "Loomly",
];
const captionPrefix = (template: string, n: number) =>
  template === "Finds List"
    ? `${String(n).padStart(2, "0")} · `
    : template === "Walkthrough"
      ? `STEP ${n} · `
      : "";

function Home({
  projects,
  onNew,
  onSample,
  onOpen,
}: {
  projects: Project[];
  onNew: (template: string) => void;
  onSample: (template: string) => void;
  onOpen: (p: Project) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={s.homeContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.logo}>
        reelvii<Text style={{ color: c.hot }}>.</Text>
      </Text>
      <Text style={s.h1}>
        Record it.{"\n"}Style it.{"\n"}Share it.
      </Text>

      <Pressable
        style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}
        onPress={() => onNew("Finds List")}
      >
        <Text style={s.ctaText}>＋ Import recording</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [s.ctaAlt, pressed && { opacity: 0.85 }]}
        onPress={() => onSample("Finds List")}
      >
        <Text style={s.ctaAltText}>✨ Try a sample recording</Text>
      </Pressable>

      <Text style={s.section}>Templates</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
      >
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20 }}>
          {templates.map((t) => (
            <Pressable
              key={t.name}
              onPress={() => onNew(t.name)}
              style={[s.tpl, { backgroundColor: t.a }]}
            >
              <Text style={s.tplTag}>{t.tag}</Text>
              <View style={s.tplPhone}>
                <MiniScreen name={t.name} />
              </View>
              <Text style={s.tplName}>{t.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={s.section}>Recent projects</Text>
      {projects.length === 0 && (
        <Text style={s.sheetHint}>
          No projects yet. Import a recording to start.
        </Text>
      )}
      {projects.map((p) => (
        <Pressable key={p.id} style={s.draft} onPress={() => onOpen(p)}>
          <View style={s.draftThumb} />
          <View style={{ flex: 1 }}>
            <Text style={s.draftName} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={s.draftMeta}>
              {p.template} · {fmt(p.trim[1] - p.trim[0])}
            </Text>
          </View>
          <Text style={[s.badge, !p.exported && s.badgeDraft]}>
            {p.exported ? "Exported" : "Draft"}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Editor({
  project,
  onChange,
  onBack,
}: {
  project: Project;
  onChange: (p: Project) => void;
  onBack: () => void;
}) {
  const [tool, setTool] = useState<(typeof tools)[number]>("Layout");
  const [draft, setDraft] = useState("");
  const { layout, trim, labels } = project;
  const patch = (p: Partial<Project>) => onChange({ ...project, ...p });

  const [camOn, setCamOn] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [camMsg, setCamMsg] = useState<string | null>(null);
  const [takeRec, setTakeRec] = useState(false);
  const [camPerm, askCam] = useCameraPermissions();
  const [micPerm, askMic] = useMicrophonePermissions();
  const [micOk, setMicOk] = useState(false);
  const camRef = useRef<CameraView>(null);
  const camPlayer = useVideoPlayer(project.cameraUri ?? null, (p) => {
    p.loop = false;
  });

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recState = useAudioRecorderState(recorder, 100);
  const voicePlayer = useAudioPlayer(project.voiceUri ?? null);
  const [voiceRec, setVoiceRec] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null);

  const player = useVideoPlayer(project.uri, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const timeEvt = useEvent(player, "timeUpdate");
  const currentTime = timeEvt?.currentTime ?? 0;

  // keep playback inside the trimmed range
  useEffect(() => {
    if (isPlaying && currentTime >= trim[1] - 0.05) {
      player.pause();
      camPlayer.pause();
      voicePlayer.pause();
      player.currentTime = trim[0];
      camSeek(trim[0]);
      voiceSeek(trim[0]);
    }
  }, [currentTime, isPlaying, trim, player]);

  const voiceSeek = (t: number) => {
    if (project.voiceUri) void voicePlayer.seekTo(Math.max(0, t - trim[0]));
  };
  const camSeek = (t: number) => {
    if (project.cameraUri) camPlayer.currentTime = t;
  };
  const toggle = () => {
    if (isPlaying) {
      player.pause();
      camPlayer.pause();
      voicePlayer.pause();
      return;
    }
    if (player.currentTime < trim[0] || player.currentTime >= trim[1])
      player.currentTime = trim[0];
    camSeek(player.currentTime);
    voiceSeek(player.currentTime);
    player.play();
    if (project.voiceUri && !voiceRec) voicePlayer.play();
    if (project.cameraUri && !camOn) {
      camPlayer.muted = false;
      camPlayer.volume = 1;
      camPlayer.play();
    }
  };

  const startVoice = async () => {
    setVoiceMsg(null);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setVoiceMsg("Microphone permission denied. Enable it for Expo Go in Settings.");
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      voicePlayer.pause();
      await recorder.prepareToRecordAsync();
      player.currentTime = trim[0];
      recorder.record();
      player.play();
      setVoiceRec(true);
    } catch (e) {
      setVoiceMsg(`Could not start recording: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const stopVoice = async () => {
    if (!voiceRec) return;
    setVoiceRec(false);
    player.pause();
    try {
      await recorder.stop();
      if (recorder.uri) patch({ voiceUri: recorder.uri });
    } catch {
      setVoiceMsg("Recording was interrupted.");
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  };
  // stop automatically when the trimmed range ends
  useEffect(() => {
    if (voiceRec && currentTime >= trim[1] - 0.1) void stopVoice();
  }, [voiceRec, currentTime]);

  const openCamera = async () => {
    setCamMsg(null);
    try {
      const cam = camPerm?.granted ? camPerm : await askCam();
      if (!cam.granted) {
        setCamMsg(
          "Camera permission denied. Enable it for Expo Go / Reelvii in Settings, then try again.",
        );
        return;
      }
      const mic = micPerm?.granted ? micPerm : await askMic();
      setMicOk(mic.granted);
      if (!mic.granted)
        setCamMsg(
          "Microphone denied — takes will have no audio. Enable it in Settings.",
        );
      if (layout === "Screen") patch({ layout: "PiP" });
      setCamReady(false);
      setCamOn(true);
    } catch (e) {
      setCamMsg(
        `Could not start camera: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  // auto-enable camera + mic for PiP/Split unless the user switched it off
  const camUserOff = useRef(false);
  useEffect(() => {
    if (
      layout !== "Screen" &&
      !camOn &&
      !project.cameraUri &&
      !camUserOff.current
    )
      void openCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const startTake = async () => {
    if (!camRef.current || !camReady || takeRec) return;
    player.currentTime = trim[0];
    player.play();
    setTakeRec(true);
    try {
      const video = await camRef.current.recordAsync({
        maxDuration: Math.ceil(trim[1] - trim[0]),
      });
      if (video?.uri) patch({ cameraUri: video.uri });
    } catch {
      // recording interrupted
    } finally {
      setTakeRec(false);
      player.pause();
      setCamOn(false);
    }
  };
  const stopTake = () => camRef.current?.stopRecording();

  // end the take when the trimmed range finishes
  useEffect(() => {
    if (takeRec && currentTime >= trim[1] - 0.1) stopTake();
  }, [takeRec, currentTime, trim]);

  const seekFromTrack = (x: number, width: number) => {
    const t = Math.max(
      0,
      Math.min(project.duration, (x / width) * project.duration),
    );
    player.currentTime = t;
    camSeek(t);
    voiceSeek(t);
  };
  const [trackW, setTrackW] = useState(1);
  const pct = (project.duration ? currentTime / project.duration : 0) * 100;

  const idx = labels.findLastIndex(
    (l) => currentTime >= l.at && currentTime < l.at + 3,
  );
  const active = idx === -1 ? null : labels[idx];

  const nudge = (which: 0 | 1, d: number) => {
    const t: [number, number] = [...trim];
    t[which] = Math.max(0, Math.min(project.duration, t[which] + d));
    if (t[1] - t[0] < 0.5) return;
    patch({ trim: t });
  };

  const addLabel = () => {
    const text = draft.trim();
    if (!text) return;
    patch({
      labels: [...labels, { text, at: Math.round(currentTime * 10) / 10 }].sort(
        (a, b) => a.at - b.at,
      ),
    });
    setDraft("");
  };

  const camNode = camOn ? (
    <CameraView
      key={micOk ? 'mic' : 'nomic'}
      ref={camRef}
      style={s.fill}
      facing="front"
      mode="video"
      mute={!micOk}
      onCameraReady={() => setCamReady(true)}
      onMountError={(e) => {
        setCamOn(false);
        setCamMsg(`Camera error: ${e.message}`);
      }}
    />
  ) : project.cameraUri ? (
    <VideoView
      player={camPlayer}
      nativeControls={false}
      contentFit="cover"
      style={s.fill}
    />
  ) : (
    <View
      style={[
        s.fill,
        {
          backgroundColor: c.violet,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text style={s.camText}>Camera</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={s.edTop}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={s.edBack}>‹ Back</Text>
        </Pressable>
        <Text style={s.edTitle}>{project.template}</Text>
        <Pressable
          style={s.exportBtn}
          onPress={() => patch({ exported: true })}
        >
          <Text style={s.exportText}>
            {project.exported ? "Saved ✓" : "Export"}
          </Text>
        </Pressable>
      </View>

      <View style={s.previewWrap}>
        <View style={s.preview}>
          {layout === "Split" ? (
            <>
              <View style={[s.fill, { overflow: "hidden" }]}>{camNode}</View>
              <View style={[s.fill, { overflow: "hidden" }]}>
                <VideoView
                  player={player}
                  nativeControls={false}
                  contentFit="cover"
                  style={s.fill}
                />
              </View>
            </>
          ) : (
            <VideoView
              player={player}
              nativeControls={false}
              contentFit="cover"
              style={s.fill}
            />
          )}
          {layout === "PiP" && (
            <View style={[s.bubble, { overflow: "hidden" }]}>{camNode}</View>
          )}
          {active && (
            <View style={s.caption}>
              <Text style={s.captionText}>
                <Text style={{ color: c.hot }}>
                  {captionPrefix(project.template, idx + 1)}
                </Text>
                {active.text}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.transport}>
        <Pressable style={s.play} onPress={toggle}>
          <Text style={s.playIcon}>{isPlaying ? "❚❚" : "▶"}</Text>
        </Pressable>
        <Pressable
          style={{ flex: 1, height: 28, justifyContent: "center" }}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          onPressIn={(e) => seekFromTrack(e.nativeEvent.locationX, trackW)}
        >
          <View style={s.scrubber} pointerEvents="none">
            <View
              style={{
                position: "absolute",
                height: 6,
                left: `${(trim[0] / (project.duration || 1)) * 100}%`,
                width: `${((trim[1] - trim[0]) / (project.duration || 1)) * 100}%`,
                backgroundColor: "rgba(155,123,255,0.35)",
              }}
            />
            <View style={[s.scrubFill, { width: `${pct}%` }]} />
            <View style={[s.scrubKnob, { left: `${pct}%` }]} />
          </View>
        </Pressable>
        <Text style={s.time}>
          {fmt(currentTime)} / {fmt(project.duration)}
        </Text>
      </View>

      <View style={s.sheet}>
        {tool === "Layout" && (
          <View style={s.sheetRow}>
            {layouts.map((l) => (
              <Pressable
                key={l}
                onPress={() => patch({ layout: l })}
                style={[s.layoutChip, layout === l && s.layoutChipOn]}
              >
                <Text style={[s.layoutText, layout === l && { color: "#fff" }]}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {tool === "Layout" && layout !== "Screen" && (
          <View style={{ marginBottom: 14, gap: 8 }}>
            {camOn ? (
              <View style={s.stepRow}>
                <Pressable
                  style={[
                    s.stepBtn,
                    {
                      flex: 1,
                      alignItems: "center",
                      backgroundColor: takeRec ? "#ef4444" : "#dc2626",
                    },
                  ]}
                  onPress={takeRec ? stopTake : startTake}
                  disabled={!camReady}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {takeRec
                      ? "■ Stop take"
                      : camReady
                        ? "● Record take"
                        : "Starting camera… (tap Off to cancel)"}
                  </Text>
                </Pressable>
                {!takeRec && (
                  <Pressable
                    style={s.stepBtn}
                    onPress={() => {
                      camUserOff.current = true;
                      setCamOn(false);
                    }}
                  >
                    <Text style={s.layoutText}>Off</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Pressable
                style={[s.stepBtn, { alignItems: "center" }]}
                onPress={() => {
                  camUserOff.current = false;
                  void openCamera();
                }}
              >
                <Text style={s.layoutText}>
                  📷{" "}
                  {project.cameraUri
                    ? "Re-record with camera"
                    : "Turn on camera"}
                </Text>
              </Pressable>
            )}
            {camMsg && <Text style={s.sheetHint}>{camMsg}</Text>}
          </View>
        )}
        {tool === "Trim" && (
          <View style={{ marginBottom: 14, gap: 8 }}>
            {([0, 1] as const).map((w) => (
              <View key={w} style={s.stepRow}>
                <Text style={s.stepLabel}>
                  {w === 0 ? "Start" : "End"} {fmt(trim[w])}
                </Text>
                <Pressable style={s.stepBtn} onPress={() => nudge(w, -1)}>
                  <Text style={s.layoutText}>−1s</Text>
                </Pressable>
                <Pressable style={s.stepBtn} onPress={() => nudge(w, 1)}>
                  <Text style={s.layoutText}>+1s</Text>
                </Pressable>
                <Pressable
                  style={s.stepBtn}
                  onPress={() =>
                    patch({
                      trim:
                        w === 0
                          ? [currentTime, trim[1]]
                          : [trim[0], currentTime],
                    })
                  }
                >
                  <Text style={s.layoutText}>Here</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {tool === "Text" && (
          <View style={{ marginBottom: 14, gap: 8 }}>
            <View style={s.stepRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={addLabel}
                placeholder={`Label at ${fmt(currentTime)}`}
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={s.input}
              />
              <Pressable
                style={[s.stepBtn, { backgroundColor: c.violet }]}
                onPress={addLabel}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Add</Text>
              </Pressable>
            </View>
            {labels.map((l, i) => (
              <View key={`${l.at}-${i}`} style={s.stepRow}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => (player.currentTime = l.at)}
                >
                  <Text style={{ color: "#fff" }} numberOfLines={1}>
                    {i + 1}. {l.text}{" "}
                    <Text style={{ color: "rgba(255,255,255,0.4)" }}>
                      {fmt(l.at)}
                    </Text>
                  </Text>
                </Pressable>
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    patch({ labels: labels.filter((_, j) => j !== i) })
                  }
                >
                  <Text style={{ color: "rgba(255,255,255,0.5)" }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {(tool === "Voice" || (tool === "Layout" && layout === "Screen")) && (
          <View style={{ marginBottom: 14, gap: 8 }}>
            <Pressable
              style={[
                s.stepBtn,
                { alignItems: "center", backgroundColor: voiceRec ? "#ef4444" : "#dc2626" },
              ]}
              onPress={voiceRec ? stopVoice : startVoice}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {voiceRec ? "■ Stop recording" : project.voiceUri ? "● Re-record voiceover" : "● Record voiceover"}
              </Text>
            </Pressable>
            {voiceRec && (
              <View style={s.meterTrack}>
                <View
                  style={[
                    s.meterFill,
                    { width: `${Math.max(4, Math.min(100, ((recState.metering ?? -60) + 60) * (100 / 60)))}%` },
                  ]}
                />
              </View>
            )}
            <Text style={s.sheetHint}>
              {voiceRec
                ? "Recording… talk over your screen recording."
                : project.voiceUri
                  ? "Voiceover saved — it plays with the video (press ▶)."
                  : "Works in any layout, including Screen only. The video plays while you talk."}
            </Text>
            {project.voiceUri && !voiceRec && (
              <Pressable style={[s.stepBtn, { alignItems: "center" }]} onPress={() => patch({ voiceUri: undefined })}>
                <Text style={s.layoutText}>Remove voiceover</Text>
              </Pressable>
            )}
            {voiceMsg && <Text style={s.sheetHint}>{voiceMsg}</Text>}
          </View>
        )}
        {(tool === "Zoom" || tool === "Style") && (
          <Text style={s.sheetHint}>{tool} tools coming soon</Text>
        )}
        <View style={s.rail}>
          {tools.map((t) => (
            <Pressable key={t} onPress={() => setTool(t)} style={s.railItem}>
              <View
                style={[s.railDot, tool === t && { backgroundColor: c.hot }]}
              />
              <Text style={[s.railText, tool === t && { color: c.hot }]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Shell() {
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setProjects(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const save = (next: Project[]) => {
    setProjects(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  const newProject = async (template: string) => {
    setError(null);
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
    });
    if (res.canceled) return;
    const v = res.assets[0];
    const duration = (v.duration ?? 0) / 1000;
    if (duration <= 0)
      return setError("Could not read that video. Try another recording.");
    if (duration > 60)
      return setError(
        "Recordings over 60 seconds are not supported in the MVP.",
      );
    const p: Project = {
      id: String(Date.now()),
      name: v.fileName?.replace(/\.[^.]+$/, "") || "Untitled video",
      template,
      uri: v.uri,
      duration,
      layout: "PiP",
      trim: [0, duration],
      labels: [],
    };
    save([p, ...projects]);
    setOpenId(p.id);
  };

  const sampleProject = async (template: string) => {
    setError(null);
    try {
      const asset = Asset.fromModule(require("./assets/sample-recording.mp4"));
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      const p: Project = {
        id: String(Date.now()),
        name: "5 websites every London girl should know",
        template,
        uri,
        duration: 15,
        layout: "PiP",
        trim: [0, 15],
        labels: SAMPLE_LABELS.map((text, i) => ({ text, at: i * 3 })),
      };
      save([p, ...projects]);
      setOpenId(p.id);
    } catch {
      setError("Could not load the sample recording.");
    }
  };

  const open = projects.find((p) => p.id === openId);

  return (
    <View
      style={[
        s.root,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <StatusBar style="light" />
      {open ? (
        <Editor
          key={open.id}
          project={open}
          onChange={(p) => save(projects.map((x) => (x.id === p.id ? p : x)))}
          onBack={() => setOpenId(null)}
        />
      ) : (
        <>
          {error && <Text style={s.error}>{error}</Text>}
          <Home
            projects={projects}
            onNew={newProject}
            onSample={sampleProject}
            onOpen={(p) => setOpenId(p.id)}
          />
        </>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.plum },
  homeContent: { padding: 20, paddingBottom: 40 },
  logo: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  h1: {
    color: "#fff",
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: -2.5,
    lineHeight: 54,
    marginTop: 28,
  },
  cta: {
    backgroundColor: c.violet,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 28,
  },
  ctaAlt: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(201,184,245,0.4)",
  },
  ctaAltText: { color: c.lilac, fontSize: 16, fontWeight: "700" },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  section: {
    color: c.lilac,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 32,
    marginBottom: 12,
  },
  tpl: { width: 150, borderRadius: 24, padding: 14 },
  tplTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(20,16,31,0.75)",
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  tplPhone: {
    alignSelf: "center",
    width: 84,
    height: 148,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: c.ink,
    backgroundColor: "#fff",
    marginVertical: 14,
    overflow: "hidden",
  },
  tplName: { color: c.ink, fontSize: 17, fontWeight: "800" },
  draft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: c.plum2,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  draftThumb: {
    width: 44,
    height: 58,
    borderRadius: 10,
    backgroundColor: c.lilac,
  },
  draftName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  draftMeta: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  badge: {
    color: c.ink,
    backgroundColor: c.lilac,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeDraft: { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" },

  meterTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: 4, backgroundColor: c.hot },
  camText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepLabel: { color: "#fff", flex: 1, fontVariant: ["tabular-nums"] },
  stepBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: "#ffb4c8",
    backgroundColor: "rgba(255,80,120,0.12)",
    margin: 20,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
  },

  edTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  edBack: { color: c.lilac, fontSize: 17, fontWeight: "600" },
  edTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  exportBtn: {
    backgroundColor: c.violet,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exportText: { color: "#fff", fontWeight: "700" },
  previewWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  preview: {
    aspectRatio: 9 / 16,
    height: "100%",
    maxWidth: "78%",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: c.paper,
    borderWidth: 3,
    borderColor: c.ink,
  },
  fill: { flex: 1 },
  fakeCard: {
    height: 110,
    borderRadius: 14,
    backgroundColor: "#e9defe",
    marginBottom: 10,
  },
  bubble: {
    position: "absolute",
    right: 12,
    bottom: 56,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: c.hot,
    borderWidth: 3,
    borderColor: "#fff",
  },
  caption: {
    position: "absolute",
    left: 12,
    top: 14,
    backgroundColor: c.ink,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  captionText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  transport: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { color: c.ink, fontSize: 15, fontWeight: "800" },
  scrubber: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
  },
  scrubFill: { height: 6, borderRadius: 3, backgroundColor: c.hot },
  scrubKnob: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginLeft: -8,
  },
  time: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  sheet: {
    backgroundColor: c.plum2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sheetRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  sheetHint: {
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 14,
    paddingVertical: 12,
  },
  layoutChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  layoutChipOn: { backgroundColor: c.violet },
  layoutText: { color: c.lilac, fontWeight: "700" },
  rail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  railItem: { alignItems: "center", gap: 6, paddingVertical: 6, minWidth: 48 },
  railDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  railText: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600" },
});
