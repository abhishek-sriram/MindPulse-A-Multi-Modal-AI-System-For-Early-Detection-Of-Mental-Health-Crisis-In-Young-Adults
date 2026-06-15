import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrisisResources } from "@/components/CrisisResources";
import { getAssessments } from "@/lib/user-session";
import {
  Brain, ArrowLeft, ClipboardCheck, ShieldCheck,
  AlertTriangle, TrendingUp, Activity, Loader2,
  BarChart2, Zap, CheckCircle2, Info, ArrowUp,
  ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

// ── Clinical maps ──────────────────────────────────────────────────────────────
const DEP_LABELS: Record<number, string> = {
  0: "Minimal / None", 1: "Mild", 2: "Moderate", 3: "Severe",
};
const ANX_LABELS: Record<number, string> = {
  0: "Minimal / None", 1: "Mild", 2: "Moderate", 3: "Severe",
};
const PHQ_RANGES = [
  { label: "Minimal", min: 0,  max: 4,  color: "#22c55e" },
  { label: "Mild",    min: 5,  max: 9,  color: "#3b82f6" },
  { label: "Moderate",min: 10, max: 14, color: "#f97316" },
  { label: "Severe",  min: 15, max: 27, color: "#ef4444" },
];
const GAD_RANGES = [
  { label: "Minimal", min: 0,  max: 4,  color: "#22c55e" },
  { label: "Mild",    min: 5,  max: 9,  color: "#3b82f6" },
  { label: "Moderate",min: 10, max: 14, color: "#f97316" },
  { label: "Severe",  min: 15, max: 21, color: "#ef4444" },
];
const CLINICAL_DESCRIPTIONS: Record<string, string> = {
  phq_little_interest: "Lack of interest or pleasure in activities you normally enjoy — a core marker of depression",
  phq_feeling_down: "Persistent feelings of sadness, emptiness, or hopelessness throughout the day",
  phq_sleep_issues: "Difficulty falling asleep, staying asleep, or sleeping too much — disrupts recovery",
  phq_low_energy: "Feeling tired or having little energy even after rest — common in depression",
  phq_appetite: "Changes in appetite or weight, either eating too little or too much",
  phq_self_worth: "Negative self-perception, feelings of failure or being a burden to others",
  phq_concentration: "Trouble focusing, making decisions, or remembering things",
  phq_psychomotor: "Moving or speaking more slowly than usual, or feeling restless/fidgety",
  phq_suicidal_thoughts: "Thoughts of self-harm or that others would be better off without you — please seek help",
  gad_nervous: "Persistent feeling of being on edge, anxious, or nervously alert",
  gad_uncontrollable_worry: "Worrying that feels impossible to stop or control, even over small things",
  gad_excessive_worry: "Worrying about many different things simultaneously, out of proportion to the situation",
  gad_trouble_relaxing: "Difficulty winding down, feeling tense even in safe/calm situations",
  gad_restlessness: "Feeling so keyed up or restless that sitting still is difficult",
  gad_irritability: "Becoming easily annoyed, snappy, or frustrated — often linked to anxiety overload",
  gad_fear: "Sense that something terrible might happen, persistent dread without clear cause",
};

function clinicalCapDep(score: number, mlLevel: number): number {
  let max = 0;
  if (score >= 15) max = 3; else if (score >= 10) max = 2; else if (score >= 5) max = 1;
  return Math.min(mlLevel, max);
}
function clinicalCapGad(score: number, mlLevel: number): number {
  let max = 0;
  if (score >= 15) max = 3; else if (score >= 10) max = 2; else if (score >= 5) max = 1;
  return Math.min(mlLevel, max);
}

const SEV_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  1: { bg: "bg-sky-50 dark:bg-sky-900/20",         text: "text-sky-700 dark:text-sky-300",         border: "border-sky-200 dark:border-sky-800" },
  2: { bg: "bg-amber-50 dark:bg-amber-900/20",      text: "text-amber-700 dark:text-amber-300",      border: "border-amber-200 dark:border-amber-800" },
  3: { bg: "bg-rose-50 dark:bg-rose-900/20",        text: "text-rose-700 dark:text-rose-300",        border: "border-rose-200 dark:border-rose-800" },
};
const SEV_DOT: Record<number, string> = { 0: "#22c55e", 1: "#0ea5e9", 2: "#f59e0b", 3: "#ef4444" };

function cleanName(feature: string): string {
  const MAP: Record<string, string> = {
    phq_little_interest: "Little interest / pleasure", phq_feeling_down: "Feeling down / hopeless",
    phq_sleep_issues: "Sleep disturbance",             phq_low_energy: "Fatigue / low energy",
    phq_appetite: "Appetite changes",                  phq_self_worth: "Feeling worthless",
    phq_concentration: "Concentration difficulty",     phq_psychomotor: "Psychomotor change",
    phq_suicidal_thoughts: "Thoughts of self-harm",
    gad_nervous: "Feeling nervous / on edge",          gad_uncontrollable_worry: "Uncontrollable worry",
    gad_excessive_worry: "Excessive worry",            gad_trouble_relaxing: "Trouble relaxing",
    gad_restlessness: "Restlessness",                  gad_irritability: "Irritability",
    gad_fear: "Fear of something awful",
  };
  if (MAP[feature]) return MAP[feature];
  return feature.replace(/^(phq|gad)_/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const SECTION_TITLES = [
  "How You May Be Feeling", "What Your Scores Indicate", "Strategies for Your Symptoms",
  "Daily Practices to Support You", "When to Reach Out for Help",
  "What Your Scores Reveal", "What Your Results Indicate",
  "Personalized Strategies", "Strategies for Your Specific Symptoms",
  "Daily Habits to Try", "Daily Habits to Support Recovery",
  "When to Reach Out", "When to Seek Support",
];
const SECTION_META: Record<string, { icon: string; color: string }> = {
  "How You May Be Feeling": { icon: "💙", color: "blue" },
  "What Your Scores Indicate": { icon: "📊", color: "violet" },
  "What Your Scores Reveal": { icon: "📊", color: "violet" },
  "What Your Results Indicate": { icon: "📊", color: "violet" },
  "Strategies for Your Symptoms": { icon: "🎯", color: "emerald" },
  "Personalized Strategies": { icon: "🎯", color: "emerald" },
  "Strategies for Your Specific Symptoms": { icon: "🎯", color: "emerald" },
  "Daily Practices to Support You": { icon: "🌿", color: "teal" },
  "Daily Habits to Try": { icon: "🌿", color: "teal" },
  "Daily Habits to Support Recovery": { icon: "🌿", color: "teal" },
  "When to Reach Out for Help": { icon: "🆘", color: "orange" },
  "When to Reach Out": { icon: "🆘", color: "orange" },
  "When to Seek Support": { icon: "🆘", color: "orange" },
};
const SECTION_BG: Record<string, string> = {
  blue: "bg-blue-50/90 dark:bg-blue-900/25 border-blue-200/80",
  violet: "bg-violet-50/90 dark:bg-violet-900/25 border-violet-200/80",
  emerald: "bg-emerald-50/90 dark:bg-emerald-900/25 border-emerald-200/80",
  teal: "bg-teal-50/90 dark:bg-teal-900/25 border-teal-200/80",
  orange: "bg-orange-50/90 dark:bg-orange-900/25 border-orange-200/80",
};

function parseAI(text: string) {
  if (!text) return [];
  const cleaned = text
    .replace(/^#{1,4}\s*/gm, "").replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1").replace(/^[-•]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n").trim();
  const matches: { title: string; start: number; end: number }[] = [];
  for (const title of SECTION_TITLES) {
    const idx = cleaned.indexOf(title);
    if (idx !== -1 && !matches.some(m => Math.abs(m.start - idx) < 5))
      matches.push({ title, start: idx, end: idx + title.length });
  }
  matches.sort((a, b) => a.start - b.start);
  const sections: { title: string; body: string; color: string; icon: string }[] = [];
  if (matches.length > 0 && matches[0].start > 10) {
    const pre = cleaned.slice(0, matches[0].start).trim();
    if (pre.length > 10) sections.push({ title: "", body: pre, color: "blue", icon: "✨" });
  }
  for (let i = 0; i < matches.length; i++) {
    const { title, end } = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].start : cleaned.length;
    const body = cleaned.slice(end, nextStart).replace(/^[\s:]+/, "").trim();
    if (body.length > 0) {
      const meta = SECTION_META[title] ?? { icon: "•", color: "blue" };
      sections.push({ title, body, ...meta });
    }
  }
  if (sections.length === 0 && cleaned.length > 0)
    sections.push({ title: "", body: cleaned, color: "blue", icon: "✨" });
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────
// MHI GAUGE — Clean, correct semicircle gauge
//
// SVG COORDINATE SYSTEM (critical to understand):
//   • Origin (0,0) is top-left
//   • Y increases downward
//   • Angles measured clockwise from the positive X-axis (right)
//
// GAUGE LAYOUT:
//   • ViewBox 260×160, center pivot at (130, 140)
//   • Arc radius R=110, track stroke width=20
//   • Semicircle from angle=180° (left, score=0) to angle=0° (right, score=100)
//   • In SVG: angle 180° = left, going COUNTER-clockwise through top to 0° = right
//   • Arc drawn with sweep-flag=0 (counter-clockwise) so it goes over the top
//
// ANGLE MATH:
//   score → angle in radians: a = π - (score/100)·π
//   point on arc: x = CX + R·cos(a),  y = CY - R·sin(a)   ← note MINUS for y
//     because sin is positive above x-axis but SVG y decreases upward
//
// NEEDLE:
//   • Rests pointing LEFT at rotate=0 (score=0 position)
//   • Rotates clockwise by (score/100)·180° via CSS transform
//   • Transform origin = pivot center (CX, CY)
// ─────────────────────────────────────────────────────────────────────────────
const MHIGauge = ({ score, label }: { score: number; label: string }) => {
  const CX = 130;   // pivot X — horizontal center
  const CY = 140;   // pivot Y — near bottom of viewBox
  const R  = 108;   // arc radius (center of stroke)
  const SW = 20;    // stroke width of arc track

  // ── Core math helpers ──────────────────────────────────────────────────────
  // Convert a 0–100 score to an angle in radians
  // score=0  → π   (180°, leftmost point)
  // score=50 → π/2 (90°,  top)
  // score=100→ 0   (0°,   rightmost point)
  const toRad = (s: number) => Math.PI - (s / 100) * Math.PI;

  // Get (x, y) for a score at a given radius
  const pt = (s: number, r: number) => ({
    x: CX + r * Math.cos(toRad(s)),
    y: CY - r * Math.sin(toRad(s)),   // minus because SVG y-axis is flipped
  });

  // Build an SVG arc path from score s1 to score s2
  // Points go from left side (s=0) upward over top to right side (s=100)
  // sweep=1 means CLOCKWISE in SVG which, given our start/end points, draws the upper arc ✓
  // large-arc: each zone is 25% = 45° < 180° → always 0 (minor arc)
  // Full 180° arc (s=0→100) needs large-arc=1
  const arc = (s1: number, s2: number, r: number = R): string => {
    const a = pt(s1, r);
    const b = pt(s2, r);
    const span = s2 - s1;
    const large = span > 50 ? 1 : 0;
    // sweep=1 → clockwise in SVG → draws the arc going upward (over the top) ✓
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  };

  // ── Zones (left-to-right = Critical→Poor→Moderate→Good) ──────────────────
  const zones = [
    { id: "critical", s1: 0,  s2: 25,  color: "#ef4444", label: "Critical" },
    { id: "poor",     s1: 25, s2: 50,  color: "#f97316", label: "Poor"     },
    { id: "moderate", s1: 50, s2: 75,  color: "#eab308", label: "Moderate" },
    { id: "good",     s1: 75, s2: 100, color: "#22c55e", label: "Good"     },
  ];
  const activeZone = zones.find(z => score >= z.s1 && (score < z.s2 || z.s2 === 100))
    ?? zones[0];

  // ── Needle ─────────────────────────────────────────────────────────────────
  // Needle is drawn pointing LEFT (negative X direction) from CX,CY
  // That corresponds to score=0 (angle=180°)
  // To point at current score, rotate clockwise by (score/100)×180°
  const needleRotateDeg = (score / 100) * 180;
  const needleLen = R - SW / 2 - 8;

  // ── Labels outside arc ─────────────────────────────────────────────────────
  const labelR = R + SW / 2 + 16;
  const zoneLabels = zones.map(z => {
    const mid = (z.s1 + z.s2) / 2;
    const p = pt(mid, labelR);
    // text-anchor: left side → end, right side → start, top → middle
    const relX = p.x - CX;
    const anchor = relX < -25 ? "end" : relX > 25 ? "start" : "middle";
    return { ...z, mid, px: p.x, py: p.y, anchor };
  });

  // ── Boundary scale numbers (inside arc, near track) ───────────────────────
  const numR = R - SW / 2 - 12;
  const scaleNums = [0, 25, 50, 75, 100];

  // ── Colors ─────────────────────────────────────────────────────────────────
  const scoreColors: Record<string, string> = {
    Good: "#22c55e", Moderate: "#eab308", Poor: "#f97316", Critical: "#ef4444",
  };
  const pillBg: Record<string, string> = {
    Good: "#f0fdf4", Moderate: "#fefce8", Poor: "#fff7ed", Critical: "#fef2f2",
  };
  const scoreColor = scoreColors[label] ?? "#6b7280";

  // Active dot on arc
  const activePt = pt(score, R);

  return (
    <div className="flex flex-col items-center select-none">
      {/* ── SVG canvas ── */}
      <div className="relative" style={{ width: 300, height: 190 }}>
        <svg
          viewBox="0 0 260 185"
          width="300"
          height="190"
          overflow="visible"
        >
          {/* 1. Grey background track (full 180°) */}
          <path
            d={arc(0, 100)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={SW}
            strokeLinecap="butt"
          />

          {/* 2. Colored zone arcs */}
          {zones.map(z => (
            <path
              key={z.id}
              d={arc(z.s1, z.s2)}
              fill="none"
              stroke={z.color}
              strokeWidth={SW}
              strokeLinecap="butt"
              opacity={activeZone.id === z.id ? 1 : 0.72}
            />
          ))}

          {/* 3. White divider ticks at zone boundaries (0,25,50,75,100) */}
          {[0, 25, 50, 75, 100].map(s => {
            const inner = pt(s, R - SW / 2 - 2);
            const outer = pt(s, R + SW / 2 + 2);
            return (
              <line
                key={`div-${s}`}
                x1={inner.x.toFixed(2)} y1={inner.y.toFixed(2)}
                x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

          {/* 4. Minor ticks every 10 units */}
          {[10, 20, 30, 40, 60, 70, 80, 90].map(s => {
            const inner = pt(s, R - SW / 2 + 3);
            const outer = pt(s, R + SW / 2 - 3);
            return (
              <line
                key={`tick-${s}`}
                x1={inner.x.toFixed(2)} y1={inner.y.toFixed(2)}
                x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
                stroke="white"
                strokeWidth={1.5}
                strokeOpacity={0.85}
              />
            );
          })}

          {/* 5. Scale numbers at 25 / 50 / 75 (just inside the track) */}
          {[25, 50, 75].map(s => {
            const p = pt(s, numR);
            return (
              <text
                key={`n-${s}`}
                x={p.x.toFixed(2)}
                y={p.y.toFixed(2)}
                fontSize="8"
                fontWeight="700"
                fill="#94a3b8"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {s}
              </text>
            );
          })}

          {/* 6. Zone labels OUTSIDE the arc, at zone midpoints */}
          {zoneLabels.map(lc => (
            <text
              key={lc.id}
              x={lc.px.toFixed(2)}
              y={lc.py.toFixed(2)}
              fontSize="8"
              fontWeight="800"
              fill={lc.color}
              textAnchor={lc.anchor}
              dominantBaseline="middle"
              style={{ fontFamily: "system-ui, sans-serif", letterSpacing: "0.03em" }}
            >
              {lc.label}
            </text>
          ))}

          {/* 7. Active score indicator dot on arc */}
          <motion.circle
            cx={activePt.x}
            cy={activePt.y}
            r={SW / 2 + 3}
            fill="white"
            stroke={scoreColor}
            strokeWidth={3}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
          />

          {/* 8. Needle shadow */}
          <g transform={`rotate(${needleRotateDeg}, ${CX}, ${CY})`}
             style={{ transition: "transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <line
              x1={CX} y1={CY}
              x2={CX - needleLen} y2={CY}
              stroke="rgba(0,0,0,0.13)"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </g>

          {/* 9. Needle — pointing LEFT at 0°, rotated CW to score angle */}
          <g transform={`rotate(${needleRotateDeg}, ${CX}, ${CY})`}
             style={{ transition: "transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <polygon
              points={`${CX - needleLen},${CY} ${CX + 10},${CY - 4} ${CX + 10},${CY + 4}`}
              fill="#1e293b"
            />
          </g>

          {/* 10. Pivot cap (on top of needle base) */}
          <circle cx={CX} cy={CY} r={13}  fill="#1e293b" />
          <circle cx={CX} cy={CY} r={8}   fill="white"   />
          <circle cx={CX} cy={CY} r={4}   fill="#334155" />

          {/* 11. Score text — rendered inside SVG so it never overlaps needle
               Positioned in the open bottom area below the pivot */}
          <text
            x={CX}
            y={CY + 30}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="28"
            fontWeight="900"
            fill={scoreColor}
            style={{ fontFamily: "system-ui, sans-serif", fontVariantNumeric: "tabular-nums" }}
          >
            {score}
          </text>
          <text
            x={CX}
            y={CY + 46}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fontWeight="600"
            fill="#94a3b8"
            letterSpacing="1.5"
            style={{ fontFamily: "system-ui, sans-serif", textTransform: "uppercase" }}
          >
            OUT OF 100
          </text>
        </svg>

        {/* No HTML overlay needed — score is now inside SVG */}
      </div>

      {/* Wellness label pill */}
      <motion.div
        className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold border-2 shadow-sm"
        style={{
          color: scoreColor,
          borderColor: scoreColor,
          backgroundColor: pillBg[label] ?? "#f8fafc",
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
      >
        <motion.span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: scoreColor }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {label} Wellness
      </motion.div>
    </div>
  );
};

// ── Score Range Bar ───────────────────────────────────────────────────────────
const ScoreRangeBar = ({ score, max, ranges }: {
  score: number; max: number;
  ranges: { label: string; min: number; max: number; color: string }[];
}) => (
  <div className="mt-3 space-y-1.5">
    <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px]">
      {ranges.map(r => {
        const w      = ((r.max - r.min + (r.min === 0 ? 1 : 0)) / (max + 1)) * 100;
        const active = score >= r.min && score <= r.max;
        return (
          <div key={r.label} style={{ width: `${w}%` }}>
            <div className="h-full transition-all duration-500 rounded-sm"
              style={{ backgroundColor: active ? r.color : r.color + "25",
                       boxShadow: active ? `0 0 8px ${r.color}70` : "none" }}
            />
          </div>
        );
      })}
    </div>
    <div className="flex justify-between text-[9px] px-0.5">
      {ranges.map(r => {
        const active = score >= r.min && score <= r.max;
        return (
          <span key={r.label} style={{ color: active ? r.color : "#94a3b8", fontWeight: active ? 800 : 500 }}>
            {r.label}
          </span>
        );
      })}
    </div>
  </div>
);

// ── SHAP Chart ────────────────────────────────────────────────────────────────
const RANK_LABELS = ["Strongest driver", "Strong contributor", "Notable contributor"];

const SHAPChart = ({ drivers, category, allDrivers }: {
  drivers: { feature: string; impact?: number; importance?: number }[];
  category: "depression" | "anxiety";
  allDrivers?: { feature: string; impact?: number }[];
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showRadar,  setShowRadar]  = useState(false);
  const isD    = category === "depression";
  const pos    = isD ? "#3b82f6" : "#10b981";
  const hdrBg  = isD ? "bg-blue-600" : "bg-emerald-600";
  const secBg  = isD
    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
  const hdrTx  = isD ? "text-blue-700 dark:text-blue-300" : "text-emerald-700 dark:text-emerald-300";

  const items = drivers.slice(0, 3).map((d, i) => {
    const raw = d.impact ?? d.importance ?? 0;
    const abs = parseFloat(Math.abs(raw).toFixed(4));
    return { rank: i + 1, name: cleanName(d.feature), feature: d.feature, impact: abs, sign: raw >= 0 ? "+" : "−", isPos: raw >= 0, pct: 0 };
  });
  const maxImp = Math.max(...items.map(x => x.impact), 0.001);
  items.forEach(x => { x.pct = (x.impact / maxImp) * 100; });

  const radarData = (allDrivers ?? []).map(d => ({
    subject: cleanName(d.feature).substring(0, 16),
    value: Math.abs(d.impact ?? 0),
  })).slice(0, 7);

  const medals  = ["🥇", "🥈", "🥉"];
  const allNeg  = items.length > 0 && items.every(x => !x.isPos);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`h-5 w-5 rounded-md ${hdrBg} flex items-center justify-center`}>
          <BarChart2 className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {isD ? "Depression" : "Anxiety"} — Key Symptom Drivers
        </span>
        <div className="ml-auto flex items-center gap-2">
          {radarData.length >= 3 && (
            <button onClick={() => setShowRadar(!showRadar)}
              className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition-all ${showRadar
                ? `${isD ? "bg-blue-600 border-blue-600" : "bg-emerald-600 border-emerald-600"} text-white`
                : `border-current ${hdrTx} hover:opacity-80`}`}>
              {showRadar ? "Bar view" : "Radar view"}
            </button>
          )}
          <Badge variant="outline" className={`text-[10px] px-2 ${hdrTx}`}>SHAP XAI</Badge>
        </div>
      </div>

      {allNeg ? (
        <div className={`rounded-xl border p-4 ${secBg} text-center`}>
          <div className="text-2xl mb-1">✅</div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Symptoms well-managed</p>
          <p className="text-xs text-slate-500 mt-1">All {isD ? "depression" : "anxiety"} indicators are protective factors.</p>
        </div>
      ) : showRadar && radarData.length >= 3 ? (
        <div className="rounded-xl border p-3" style={{ background: isD ? "#eff6ff" : "#ecfdf5" }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
              <PolarGrid stroke={pos + "30"} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#64748b" }} />
              <PolarRadiusAxis angle={30} domain={[0, 0.1]} tick={false} axisLine={false} />
              <Radar name="Impact" dataKey="value" stroke={pos} fill={pos} fillOpacity={0.35} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(3)}`, "SHAP impact"]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${pos}40` }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i}
              className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 ${item.isPos ? secBg : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"} ${hoveredIdx === i ? "shadow-md scale-[1.01]" : ""}`}
              onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-base leading-none flex-shrink-0 mt-0.5">{medals[i]}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug block">{item.name}</span>
                    {!item.isPos && <span className="text-[9px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 rounded-md px-1.5 py-0.5 mt-0.5 inline-block">Protective factor</span>}
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-lg font-mono text-white flex-shrink-0"
                  style={{ backgroundColor: item.isPos ? pos : "#94a3b8" }}>
                  {item.sign}{item.impact.toFixed(3)}
                </span>
              </div>
              <div className="h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: item.isPos ? pos : "#94a3b8" }}
                  initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: "easeOut" }} />
              </div>
              <div className="mt-1 text-[10px]" style={{ color: item.isPos ? pos : "#94a3b8" }}>
                {item.isPos ? (RANK_LABELS[i] ?? "Contributor") : "Reduces predicted severity — protective"}
              </div>
              <AnimatePresence>
                {hoveredIdx === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                        {CLINICAL_DESCRIPTIONS[item.feature] ?? "This symptom influenced the AI's prediction for your specific profile."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Escalation Bar ────────────────────────────────────────────────────────────
const EscalationBar = ({ score, colorCode }: { score: number; colorCode: string }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Risk Escalation Score</span>
      <span className="font-black text-2xl tabular-nums" style={{ color: colorCode }}>
        {score}<span className="text-xs font-normal text-slate-400 ml-0.5">/ 7</span>
      </span>
    </div>
    <div className="h-3 rounded-full overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800">
      <motion.div className="h-full rounded-full relative"
        style={{ background: `linear-gradient(90deg, #22c55e, ${colorCode})` }}
        initial={{ width: 0 }} animate={{ width: `${(score / 7) * 100}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}>
        <div className="absolute right-0 top-0 bottom-0 w-1 rounded-full opacity-60"
          style={{ backgroundColor: "white", boxShadow: `0 0 6px ${colorCode}` }} />
      </motion.div>
    </div>
    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
      <span>Low</span><span>Low-Mod</span><span>Moderate</span><span>High</span><span>Critical</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [aiData,  setAiData]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFab, setShowFab] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const assessments = getAssessments();
  const assessment  = id === "latest"
    ? assessments[assessments.length - 1]
    : assessments.find(a => a.id === id);

  useEffect(() => {
    if (!assessment) { setLoading(false); return; }
    if ("aiData" in assessment && assessment.aiData) setAiData(assessment.aiData);
    setLoading(false);
  }, [assessment?.id]);

  useEffect(() => {
    const fn = () => setShowFab(window.scrollY > 400);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (!assessment) return (
    <div className="container max-w-xl py-20 text-center space-y-4">
      <Brain className="h-14 w-14 mx-auto text-slate-300" strokeWidth={1.5} />
      <h2 className="text-xl font-bold">No results found</h2>
      <p className="text-muted-foreground text-sm">Complete an assessment to see your results.</p>
      <Button asChild><Link to="/assessment">Start Assessment</Link></Button>
    </div>
  );

  const mhi        = aiData?.mental_health_index   ?? null;
  const warning    = aiData?.early_warning          ?? null;
  const escalation = aiData?.risk_escalation        ?? null;
  const depDrivers = aiData?.top_depression_factors ?? [];
  const anxDrivers = aiData?.top_anxiety_factors    ?? [];
  const allDepShap = aiData?.all_depression_shap    ?? [];
  const allAnxShap = aiData?.all_anxiety_shap       ?? [];

  const rawDepSev = aiData?.depression_severity ?? (assessment as any).depressionSeverity ?? 0;
  const rawAnxSev = aiData?.anxiety_severity    ?? (assessment as any).anxietySeverity    ?? 0;
  const depSev    = clinicalCapDep(assessment.phq9Score, rawDepSev);
  const anxSev    = clinicalCapGad(assessment.gad7Score, rawAnxSev);

  const isCritical = escalation?.risk_level === "Critical" || escalation?.risk_level === "High";
  const aiSections = parseAI(aiData?.ai_recommendation ?? "");
  const depColors  = SEV_COLORS[depSev] ?? SEV_COLORS[0];
  const anxColors  = SEV_COLORS[anxSev] ?? SEV_COLORS[0];

  return (
    <>
      <motion.div className="max-w-2xl mx-auto py-8 px-4 space-y-5"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        {/* ── Header ── */}
        <div className="text-center space-y-2.5">
          <motion.div
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/30 mx-auto mb-1"
            initial={{ scale: 0.7, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}>
            <Brain className="h-8 w-8 text-white" strokeWidth={1.5} />
          </motion.div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Your Mental Health Results
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Assessed on {new Date(assessment.createdAt).toLocaleDateString(undefined, {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
          </div>

        {/* ── MHI + Escalation ── */}
        {loading ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />Generating AI analysis…
            </CardContent>
          </Card>
        ) : mhi && escalation ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 px-5 py-3.5 flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-blue-300" />
                </div>
                <h2 className="text-white font-bold text-sm tracking-wide">Mental Health Index &amp; Risk Assessment</h2>
              </div>
              <CardContent className="p-5 bg-white dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Gauge */}
                  <div className="flex-shrink-0 flex justify-center" style={{ minWidth: 280 }}>
                    <MHIGauge score={mhi.mhi_score} label={mhi.mhi_label} />
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <EscalationBar score={escalation.escalation_score} colorCode={escalation.color_code} />
                    <div className="rounded-xl border-2 p-4"
                      style={{ borderColor: escalation.color_code + "55", background: escalation.color_code + "08" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <motion.span className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: escalation.color_code }}
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }} />
                        <span className="font-black text-sm" style={{ color: escalation.color_code }}>
                          {escalation.risk_level} Risk
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{escalation.protocol}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-8 text-center text-sm text-slate-400">
              <Activity className="h-8 w-8 mx-auto opacity-20 mb-2" />
              AI analysis unavailable. Submit a new assessment.
            </CardContent>
          </Card>
        )}

        {/* ── Early Warning ── */}
        {!loading && warning?.total_warnings > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50/60 dark:from-orange-900/20 dark:to-amber-900/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
                <span className="font-bold text-sm text-orange-800 dark:text-orange-200">
                  {warning.warning_level} Warning Detected
                </span>
              </div>
              {warning.warnings.map((w: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-orange-700 dark:text-orange-300 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span><strong>{w.domain}:</strong> {w.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── PHQ-9 / GAD-7 Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "PHQ-9 Depression", sub: "9-item patient health questionnaire",
              score: assessment.phq9Score, max: 27, sev: depSev, colors: depColors, ranges: PHQ_RANGES,
              icon: ClipboardCheck, iconColor: "text-blue-600", label: DEP_LABELS[depSev] },
            { title: "GAD-7 Anxiety", sub: "7-item generalised anxiety disorder scale",
              score: assessment.gad7Score, max: 21, sev: anxSev, colors: anxColors, ranges: GAD_RANGES,
              icon: ShieldCheck, iconColor: "text-emerald-600", label: ANX_LABELS[anxSev] },
          ].map((card, idx) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + idx * 0.06 }}>
              <Card className={`rounded-2xl shadow-sm border h-full ${card.colors.border} ${card.colors.bg}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center flex-shrink-0">
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200 block">{card.title}</span>
                      <span className="text-[10px] text-slate-400">{card.sub}</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <motion.span className={`text-5xl font-black tabular-nums ${card.colors.text}`}
                      initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}>{card.score}</motion.span>
                    <span className="text-slate-400 text-sm mb-2 font-medium">/ {card.max}</span>
                  </div>
                  <ScoreRangeBar score={card.score} max={card.max} ranges={card.ranges} />
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEV_DOT[card.sev] }} />
                    <span className={`text-xs font-bold ${card.colors.text}`}>{card.label}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── SHAP ── */}
        {!loading && (depDrivers.length > 0 || anxDrivers.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold text-base text-slate-800 dark:text-slate-100">Explainable AI — SHAP Symptom Drivers</span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-white/60 dark:bg-slate-800/40 rounded-xl p-2.5 mt-2">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-violet-500" />
                  <span>Which <strong>individual symptoms</strong> most influenced the AI's prediction for <em>you specifically</em>. Toggle Radar view for full symptom profile. Hover any bar for clinical context.</span>
                </div>
              </div>
              <CardContent className="px-5 pb-5 pt-4 space-y-5">
                {depDrivers.length > 0 && <SHAPChart drivers={depDrivers} category="depression" allDrivers={[...allDepShap, ...allAnxShap]} />}
                {depDrivers.length > 0 && anxDrivers.length > 0 && <div className="border-t border-slate-100 dark:border-slate-800" />}
                {anxDrivers.length > 0 && <SHAPChart drivers={anxDrivers} category="anxiety" allDrivers={[...allDepShap, ...allAnxShap]} />}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isCritical && <CrisisResources prominent />}

        {/* ── AI Recommendation ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
          <Card className="rounded-2xl border-0 shadow-xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 px-5 py-5 overflow-hidden">
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
              <div className="relative flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-snug">Personalised AI Recommendation</h2>
                  <p className="text-blue-100/70 text-xs mt-0.5">Generated by LLaMA-3.3-70B · Tailored to your specific symptom profile</p>
                </div>
              </div>
            </div>
            <CardContent className="px-5 pb-5 pt-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
              {loading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-8">
                  <Loader2 className="h-4 w-4 animate-spin" />Generating…
                </div>
              ) : aiSections.length > 0 ? (
                <div className="space-y-2">
                  {aiSections.map((sec, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className={`rounded-xl border overflow-hidden ${sec.title ? SECTION_BG[sec.color] ?? SECTION_BG.blue : "bg-transparent border-transparent"}`}>
                      {sec.title ? (
                        <>
                          <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-left hover:opacity-75 transition-opacity">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg leading-none">{sec.icon}</span>
                              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{sec.title}</h3>
                            </div>
                            {openIdx === i ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                          </button>
                          <AnimatePresence initial={false}>
                            {openIdx === i && (
                              <motion.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line px-4 pb-4">{sec.body}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">{sec.body}</p>
                      )}
                    </motion.div>
                  ))}
                  <p className="text-[10px] text-slate-400 text-center pt-1 italic">
                    Tap each section to expand · {aiSections.filter(s => s.title).length} personalised sections
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-6">AI recommendation not available.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Disclaimer ── */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
          <p className="font-bold flex items-center gap-1.5 mb-0.5"><AlertTriangle className="h-3.5 w-3.5" />Medical Disclaimer</p>
          <p className="text-amber-700/80">For research &amp; educational purposes only — not a clinical diagnosis. Consult a licensed mental health professional for any concerns.</p>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-center pb-8">
          <Button variant="outline" asChild className="rounded-xl border-2">
            <Link to="/history"><ArrowLeft className="h-4 w-4 mr-1.5" />History</Link>
          </Button>
          <Button asChild className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0">
            <Link to="/assessment"><Sparkles className="h-4 w-4 mr-1.5" />New Assessment</Link>
          </Button>
        </div>
      </motion.div>

      {/* FAB */}
      <AnimatePresence>
        {showFab && (
          <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl flex items-center justify-center"
            aria-label="Back to top">
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default Results;