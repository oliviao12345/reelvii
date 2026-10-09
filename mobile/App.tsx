import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const c = {
  ink: '#14101f',
  plum: '#1a1626',
  plum2: '#241d38',
  violet: '#7c5cdc',
  hot: '#9b7bff',
  lilac: '#c9b8f5',
  soft: '#f3effd',
  paper: '#fbfaff',
};

const templates = [
  { name: 'Finds List', tag: 'Most popular', a: '#9b7bff' },
  { name: 'Walkthrough', tag: 'Tutorials', a: '#f4a6d7' },
  { name: 'Showcase', tag: 'Demos', a: '#c9b8f5' },
];

const drafts = [
  { name: '5 websites every London girl should know', meta: 'Finds List · 0:28', status: 'Draft' },
  { name: 'Notion setup walkthrough', meta: 'Walkthrough · 0:44', status: 'Exported' },
];

const tools = ['Trim', 'Layout', 'Voice', 'Text', 'Zoom', 'Style'] as const;
const layouts = ['Screen', 'PiP', 'Split'] as const;

function Home({ onNew }: { onNew: () => void }) {
  return (
    <ScrollView contentContainerStyle={s.homeContent} showsVerticalScrollIndicator={false}>
      <Text style={s.logo}>
        reelvii<Text style={{ color: c.hot }}>.</Text>
      </Text>
      <Text style={s.h1}>Record it.{'\n'}Style it.{'\n'}Share it.</Text>

      <Pressable style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]} onPress={onNew}>
        <Text style={s.ctaText}>＋  Import recording</Text>
      </Pressable>

      <Text style={s.section}>Templates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20 }}>
          {templates.map((t) => (
            <Pressable key={t.name} onPress={onNew} style={[s.tpl, { backgroundColor: t.a }]}>
              <Text style={s.tplTag}>{t.tag}</Text>
              <View style={s.tplPhone} />
              <Text style={s.tplName}>{t.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={s.section}>Recent projects</Text>
      {drafts.map((d) => (
        <View key={d.name} style={s.draft}>
          <View style={s.draftThumb} />
          <View style={{ flex: 1 }}>
            <Text style={s.draftName} numberOfLines={1}>{d.name}</Text>
            <Text style={s.draftMeta}>{d.meta}</Text>
          </View>
          <Text style={[s.badge, d.status === 'Draft' && s.badgeDraft]}>{d.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Editor({ onBack }: { onBack: () => void }) {
  const [tool, setTool] = useState<(typeof tools)[number]>('Layout');
  const [layout, setLayout] = useState<(typeof layouts)[number]>('PiP');
  const [playing, setPlaying] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.edTop}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={s.edBack}>‹ Back</Text>
        </Pressable>
        <Text style={s.edTitle}>Finds List</Text>
        <Pressable style={s.exportBtn}>
          <Text style={s.exportText}>Export</Text>
        </Pressable>
      </View>

      {/* preview */}
      <View style={s.previewWrap}>
        <View style={s.preview}>
          {layout === 'Split' ? (
            <>
              <View style={[s.fill, { backgroundColor: c.lilac }]} />
              <View style={[s.fill, { backgroundColor: c.violet }]} />
            </>
          ) : (
            <View style={[s.fill, { backgroundColor: c.lilac, padding: 14 }]}>
              <View style={s.fakeCard} />
              <View style={[s.fakeCard, { backgroundColor: '#ffe3f1', height: 70 }]} />
            </View>
          )}
          {layout === 'PiP' && <View style={s.bubble} />}
          <View style={s.caption}>
            <Text style={s.captionText}>
              <Text style={{ color: c.hot }}>01</Text> · Notion templates
            </Text>
          </View>
        </View>
      </View>

      {/* transport */}
      <View style={s.transport}>
        <Pressable style={s.play} onPress={() => setPlaying((p) => !p)}>
          <Text style={s.playIcon}>{playing ? '❚❚' : '▶'}</Text>
        </Pressable>
        <View style={s.scrubber}>
          <View style={[s.scrubFill, { width: playing ? '62%' : '28%' }]} />
          <View style={[s.scrubKnob, { left: playing ? '62%' : '28%' }]} />
        </View>
        <Text style={s.time}>0:08 / 0:28</Text>
      </View>

      {/* tool sheet */}
      <View style={s.sheet}>
        {tool === 'Layout' ? (
          <View style={s.sheetRow}>
            {layouts.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLayout(l)}
                style={[s.layoutChip, layout === l && s.layoutChipOn]}
              >
                <Text style={[s.layoutText, layout === l && { color: '#fff' }]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={s.sheetHint}>{tool} tools coming soon</Text>
        )}
        <View style={s.rail}>
          {tools.map((t) => (
            <Pressable key={t} onPress={() => setTool(t)} style={s.railItem}>
              <View style={[s.railDot, tool === t && { backgroundColor: c.hot }]} />
              <Text style={[s.railText, tool === t && { color: c.hot }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Shell() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<'home' | 'editor'>('home');
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <StatusBar style="light" />
      {screen === 'home' ? <Home onNew={() => setScreen('editor')} /> : <Editor onBack={() => setScreen('home')} />}
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
  logo: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  h1: { color: '#fff', fontSize: 54, fontWeight: '800', letterSpacing: -2.5, lineHeight: 54, marginTop: 28 },
  cta: { backgroundColor: c.violet, borderRadius: 999, paddingVertical: 18, alignItems: 'center', marginTop: 28 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  section: { color: c.lilac, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 32, marginBottom: 12 },
  tpl: { width: 150, borderRadius: 24, padding: 14 },
  tplTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(20,16,31,0.75)', color: '#fff', fontSize: 10, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  tplPhone: { alignSelf: 'center', width: 70, height: 120, borderRadius: 14, borderWidth: 3, borderColor: c.ink, backgroundColor: 'rgba(255,255,255,0.9)', marginVertical: 14 },
  tplName: { color: c.ink, fontSize: 17, fontWeight: '800' },
  draft: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.plum2, borderRadius: 18, padding: 12, marginBottom: 10 },
  draftThumb: { width: 44, height: 58, borderRadius: 10, backgroundColor: c.lilac },
  draftName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  draftMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  badge: { color: c.ink, backgroundColor: c.lilac, fontSize: 11, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  badgeDraft: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' },

  edTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  edBack: { color: c.lilac, fontSize: 17, fontWeight: '600' },
  edTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  exportBtn: { backgroundColor: c.violet, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  exportText: { color: '#fff', fontWeight: '700' },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  preview: { aspectRatio: 9 / 16, height: '100%', maxWidth: '78%', borderRadius: 22, overflow: 'hidden', backgroundColor: c.paper, borderWidth: 3, borderColor: c.ink },
  fill: { flex: 1 },
  fakeCard: { height: 110, borderRadius: 14, backgroundColor: '#e9defe', marginBottom: 10 },
  bubble: { position: 'absolute', right: 12, bottom: 56, width: 62, height: 62, borderRadius: 31, backgroundColor: c.hot, borderWidth: 3, borderColor: '#fff' },
  caption: { position: 'absolute', left: 12, top: 14, backgroundColor: c.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  captionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: c.ink, fontSize: 15, fontWeight: '800' },
  scrubber: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center' },
  scrubFill: { height: 6, borderRadius: 3, backgroundColor: c.hot },
  scrubKnob: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', marginLeft: -8 },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontVariant: ['tabular-nums'] },
  sheet: { backgroundColor: c.plum2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 16 },
  sheetRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  sheetHint: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 14, paddingVertical: 12 },
  layoutChip: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  layoutChipOn: { backgroundColor: c.violet },
  layoutText: { color: c.lilac, fontWeight: '700' },
  rail: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  railItem: { alignItems: 'center', gap: 6, paddingVertical: 6, minWidth: 48 },
  railDot: { width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  railText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
});
