import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUser, getAssessmentsByEmail } from "@/lib/user-session";
import { getDepressionSeverity, getAnxietySeverity } from "@/lib/assessment-data";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from "recharts";
import {
  Brain, ArrowRight, TrendingUp, TrendingDown, Minus,
  Activity, AlertCircle, BarChart2, Sparkles, RefreshCw,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Risk color maps ────────────────────────────────────────────────────────────
const RISK_META: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Low":          { bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200",  dot: "#22c55e" },
  "Low-Moderate": { bg: "bg-lime-50",    text: "text-lime-700",   border: "border-lime-200",   dot: "#84cc16" },
  "Moderate":     { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200",  dot: "#f59e0b" },
  "High":         { bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200", dot: "#f97316" },
  "Critical":     { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",    dot: "#ef4444" },
};
const mhiColor = (s: number) => s >= 75 ? "#22c55e" : s >= 50 ? "#eab308" : s >= 25 ? "#f97316" : "#ef4444";

// Severity dot color by PHQ/GAD score
const phqColor = (s: number) => s >= 15 ? "#ef4444" : s >= 10 ? "#f97316" : s >= 5 ? "#3b82f6" : "#22c55e";
const gadColor = (s: number) => s >= 15 ? "#ef4444" : s >= 10 ? "#f97316" : s >= 5 ? "#3b82f6" : "#22c55e";

// ── Trend badge ────────────────────────────────────────────────────────────────
const TrendBadge = ({ direction }: { direction: string }) => {
  if (direction === "Improving")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 gap-1.5 font-semibold text-xs">
        <TrendingUp className="h-3 w-3" />Improving
      </Badge>
    );
  if (direction === "Deteriorating")
    return (
      <Badge className="bg-red-100 text-red-800 border border-red-300 gap-1.5 font-semibold text-xs">
        <TrendingDown className="h-3 w-3" />Deteriorating
      </Badge>
    );
  return (
    <Badge className="bg-slate-100 text-slate-700 border border-slate-300 gap-1.5 font-semibold text-xs">
      <Minus className="h-3 w-3" />Stable
    </Badge>
  );
};

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) => (
  <motion.div whileHover={{ y: -2 }}
    className="relative rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all duration-200"
    style={{ borderColor: color + "30" }}>
    <div className="absolute top-0 right-0 h-16 w-16 rounded-full opacity-[0.08] -translate-y-4 translate-x-4"
      style={{ backgroundColor: color }} />
    <div className="relative">
      <div className="h-7 w-7 rounded-xl flex items-center justify-center mb-2.5"
        style={{ backgroundColor: color + "18" }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="text-2xl font-black tabular-nums leading-none" style={{ color }}>{value}</div>
      <div className="text-[11px] font-semibold mt-1 leading-tight" style={{ color: color + "bb" }}>{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  </motion.div>
);

// ── Insight banner ─────────────────────────────────────────────────────────────
const InsightBanner = ({ type, text }: { type: "warn" | "good" | "info"; text: string }) => {
  const s = {
    warn: { bg: "bg-red-50 dark:bg-red-900/20",         border: "border-red-200",     text: "text-red-800 dark:text-red-300"         },
    good: { bg: "bg-emerald-50 dark:bg-emerald-900/20",  border: "border-emerald-200", text: "text-emerald-800 dark:text-emerald-300" },
    info: { bg: "bg-blue-50 dark:bg-blue-900/20",        border: "border-blue-200",    text: "text-blue-800 dark:text-blue-300"       },
  }[type];
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start gap-2.5 text-sm ${s.bg} ${s.border} ${s.text}`}>
      <span className="text-base mt-0.5 flex-shrink-0">{text.slice(0, 2)}</span>
      <span className="leading-relaxed">{text.slice(2)}</span>
    </div>
  );
};

// ── Custom chart tooltip ──────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs min-w-[160px]">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
          </div>
          <span className="font-black tabular-nums" style={{ color: entry.color }}>
            {typeof entry.value === "number" ? entry.value.toFixed(entry.name === "MHI" ? 1 : 0) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── FIX: Stable dot renderers (avoids React key warnings from cx collisions) ─
const renderPhqDot = (props: any) => {
  const { cx, cy, value, index } = props;
  if (cx == null || cy == null) return null;
  return <circle key={`phq-${index}`} cx={cx} cy={cy} r={5} fill={phqColor(value)} stroke="white" strokeWidth={2} />;
};
const renderGadDot = (props: any) => {
  const { cx, cy, value, index } = props;
  if (cx == null || cy == null) return null;
  return <circle key={`gad-${index}`} cx={cx} cy={cy} r={5} fill={gadColor(value)} stroke="white" strokeWidth={2} />;
};
const renderMhiDot = (props: any) => {
  const { cx, cy, value, index } = props;
  if (cx == null || cy == null) return null;
  return <circle key={`mhi-${index}`} cx={cx} cy={cy} r={5} fill={mhiColor(value)} stroke="white" strokeWidth={2} />;
};
const renderMhiSmallDot = (props: any) => {
  const { cx, cy, value, index } = props;
  if (cx == null || cy == null) return null;
  return <circle key={`mhi2-${index}`} cx={cx} cy={cy} r={3.5} fill={mhiColor(value)} stroke="white" strokeWidth={1.5} />;
};

// ─────────────────────────────────────────────────────────────────────────────
const History = () => {
  const user = getUser();
  const assessments = user
    ? getAssessmentsByEmail(user.email).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  const [trendData,    setTrendData]    = useState<any>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError,   setTrendError]   = useState(false);
  const [chartMode,    setChartMode]    = useState<"symptoms" | "mhi">("symptoms");

  const fetchTrend = useCallback(() => {
    if (!user?.email) return;
    setTrendLoading(true);
    setTrendError(false);
    fetch(`${API_BASE}/trend/${encodeURIComponent(user.email)}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (d.error) throw new Error(d.error); setTrendData(d); })
      .catch(() => { setTrendData(null); setTrendError(true); })
      .finally(() => setTrendLoading(false));
  }, [user?.email]);

  useEffect(() => { fetchTrend(); }, [fetchTrend]);

  const hasBackend = (trendData?.trend?.length ?? 0) >= 2;
  const temporal   = trendData?.temporal ?? null;

  // Build chart data — ALWAYS use session labels (S1, S2, ...) on X-axis
  // Store full date/time separately for tooltip display
  const chartData = (() => {
    const source = hasBackend ? trendData.trend : assessments;
    if (!source || source.length === 0) return [];

    return hasBackend
      ? trendData.trend.map((t: any, i: number) => {
          const d = new Date(t.date);
          return {
            // X-axis label: always session number
            label: `S${i + 1}`,
            // Full date for tooltip
            tooltipDate: d.toLocaleString(undefined, {
              month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            }),
            sessionLabel: `Session ${i + 1}`,
            "PHQ-9":  t.phq_score,
            "GAD-7":  t.gad_score,
            MHI:      t.mhi_score != null ? parseFloat((t.mhi_score).toFixed(2)) : null,
            risk:     t.risk_level ?? "",
          };
        })
      : assessments.map((a, i) => {
          const d = new Date(a.createdAt);
          return {
            label: `S${i + 1}`,
            tooltipDate: d.toLocaleString(undefined, {
              month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            }),
            sessionLabel: `Session ${i + 1}`,
            "PHQ-9":  a.phq9Score,
            "GAD-7":  a.gad7Score,
            MHI:      null,
            risk:     (a as any).riskLevel ?? "",
          };
        });
  })();

  const hasTrend = chartData.length >= 2;

  // Temporal insights
  const insights: { type: "warn" | "good" | "info"; text: string }[] = [];
  if (temporal?.sufficient_data) {
    if (temporal.mhi_change > 5)
      insights.push({ type: "good", text: `✅ Your Mental Health Index has improved by ${temporal.mhi_change} points since your first session.` });
    if (temporal.trend_direction === "Improving" && !temporal.deterioration_flag)
      insights.push({ type: "good", text: "📈 Symptom scores are trending downward — a positive sign of progress." });
    if (temporal.deterioration_flag)
      insights.push({ type: "warn", text: "⚠️ Significant worsening detected in recent sessions. Consider reaching out to a professional." });
    if ((temporal.risk_streak?.count ?? 0) >= 3 && ["High", "Critical"].includes(temporal.risk_streak?.level))
      insights.push({ type: "warn", text: `🔴 ${temporal.risk_streak.count} consecutive sessions at ${temporal.risk_streak.level} risk. Please seek professional support.` });
    if (temporal.volatility_label === "High")
      insights.push({ type: "info", text: `📊 High score fluctuation detected. Consistent daily routines may help stabilise mood.` });
  }

  const trendDirection = trendData?.trend_direction ?? null;
  const showTrendBadge = trendDirection && !["Insufficient data", "No data"].includes(trendDirection);

  // Custom tooltip that shows full date
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item = chartData.find((d: any) => d.label === label);
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs min-w-[170px]">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-0.5">{item?.sessionLabel ?? label}</p>
        {item?.tooltipDate && (
          <p className="text-slate-400 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">{item.tooltipDate}</p>
        )}
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
            </div>
            <span className="font-black tabular-nums" style={{ color: entry.color }}>
              {typeof entry.value === "number" ? entry.value.toFixed(entry.name === "MHI" ? 1 : 0) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div className="container max-w-3xl py-8 px-4 space-y-6"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 mx-auto mb-1">
          <Brain className="h-7 w-7 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Assessment History</h1>
        {assessments.length > 0 && user && (
          <p className="text-sm text-slate-500">
            {assessments.length} session{assessments.length !== 1 ? "s" : ""} recorded ·{" "}
            <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong>
          </p>
        )}
      </div>

      {assessments.length === 0 ? (
        <Card className="rounded-2xl border-dashed text-center py-14">
          <CardContent>
            <Brain className="h-12 w-12 mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-muted-foreground mb-4 text-sm">No assessments yet. Take your first one!</p>
            <Button asChild className="rounded-xl">
              <Link to="/assessment">Start Assessment <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Backend error notice ── */}
          {trendError && !trendLoading && (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3.5 flex items-center justify-between gap-2.5 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                Trend data unavailable — showing local session data.
              </div>
              <button onClick={fetchTrend}
                aria-label="Retry loading trend data"
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                <RefreshCw className="h-3.5 w-3.5" />Retry
              </button>
            </div>
          )}

          {/* ── Stat cards ── */}
          {temporal?.sufficient_data ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Sessions" value={temporal.total_sessions} sub="assessments total"
                icon={BarChart2} color="#2563eb" />
              <StatCard
                label="MHI Change"
                value={`${temporal.mhi_change >= 0 ? "+" : ""}${temporal.mhi_change}`}
                sub={temporal.trend_direction}
                icon={temporal.mhi_change >= 0 ? TrendingUp : TrendingDown}
                color={temporal.mhi_change >= 0 ? "#059669" : "#dc2626"}
              />
              <StatCard label="Peak MHI" value={temporal.peak_mhi ?? "—"} sub="best session"
                icon={Sparkles} color="#7c3aed" />
              <StatCard label="Avg MHI" value={temporal.avg_mhi ?? "—"} sub="across all sessions"
                icon={Activity} color="#d97706" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatCard label="Sessions" value={assessments.length} sub="recorded"
                icon={BarChart2} color="#2563eb" />
              <StatCard label="PHQ-9 Latest" value={assessments[assessments.length - 1]?.phq9Score ?? "—"} sub="depression"
                icon={Activity} color={phqColor(assessments[assessments.length - 1]?.phq9Score ?? 0)} />
              <StatCard label="GAD-7 Latest" value={assessments[assessments.length - 1]?.gad7Score ?? "—"} sub="anxiety"
                icon={Activity} color={gadColor(assessments[assessments.length - 1]?.gad7Score ?? 0)} />
            </div>
          )}

          {/* ── Insights ── */}
          {insights.length > 0 && (
            <div className="space-y-2.5">
              {insights.map((ins, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <InsightBanner type={ins.type} text={ins.text} />
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Wellness trend summary bar ── */}
          {trendData && (trendData.total_sessions ?? 0) >= 1 && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="py-4 px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">Wellness Trend</span>
                        {temporal?.volatility_label && (
                          <span className="text-[10px] text-slate-400">{temporal.volatility_label} volatility</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {showTrendBadge && <TrendBadge direction={trendDirection} />}
                      {trendData.mhi_change != null && (
                        <span className="text-xs text-slate-500">
                          MHI:{" "}
                          <span className={`font-bold ${trendData.mhi_change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {trendData.mhi_change >= 0 ? "+" : ""}{trendData.mhi_change}
                          </span>
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {trendData.total_sessions} session{trendData.total_sessions !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Temporal Analysis Chart ── */}
          {hasTrend && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <CardHeader className="pb-0 pt-5 px-5">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="font-serif text-base flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5 text-white" />
                      </div>
                      Temporal Analysis
                    </CardTitle>

                    {/* PHQ/GAD | MHI Score toggle */}
                    {hasBackend && (
                      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-xs"
                        role="tablist" aria-label="Chart view mode">
                        {[
                          { key: "symptoms", label: "PHQ / GAD" },
                          { key: "mhi",      label: "MHI Score" },
                        ].map(m => (
                          <button key={m.key} onClick={() => setChartMode(m.key as any)}
                            role="tab"
                            aria-selected={chartMode === m.key}
                            className={`px-3 py-1.5 font-semibold transition-colors ${
                              chartMode === m.key
                                ? "bg-blue-600 text-white"
                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-3 px-3 pb-4">
                  {/* Chart legend */}
                  <div className="flex items-center gap-4 px-2 pb-2 flex-wrap">
                    {chartMode !== "mhi" ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                          <div className="h-2.5 w-8 rounded-full bg-blue-500" />PHQ-9 (0–27)
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <div className="h-2.5 w-8 rounded-full bg-emerald-500" />GAD-7 (0–21)
                        </div>
                        {hasBackend && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <div className="h-0 w-8 border-t-2 border-dashed border-emerald-500" />MHI
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto italic hidden sm:inline">
                          PHQ/GAD: lower = better · MHI: higher = better
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <div className="h-2.5 w-8 rounded-full bg-emerald-400" />Mental Health Index (0–100)
                        </div>
                        <span className="text-[10px] text-slate-400 ml-auto italic">Higher = better wellness</span>
                      </>
                    )}
                  </div>

                  {/* ── CHART — X-axis shows Session labels (S1, S2 …), Y-axis labeled ── */}
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart
                      data={chartData}
                      margin={{ left: 8, right: hasBackend && chartMode !== "mhi" ? 48 : 16, top: 8, bottom: 30 }}
                    >
                      <defs>
                        <linearGradient id="phqFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="gadFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="mhiFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                      {/* ── X-Axis: session labels S1, S2, … ── */}
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                        height={48}
                      >
                        <Label
                          value="Assessment Session"
                          position="insideBottom"
                          offset={-12}
                          style={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                        />
                      </XAxis>

                      {/* ── Y-Axis: labeled based on chart mode ── */}
                      {chartMode === "mhi" ? (
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={48}
                        >
                          <Label
                            value="MHI Score (0–100)"
                            angle={-90}
                            position="insideLeft"
                            offset={12}
                            style={{ fontSize: 10, fill: "#22c55e", fontWeight: 700 }}
                          />
                        </YAxis>
                      ) : (
                        <>
                          {/* Left Y-axis: PHQ-9 / GAD-7 scores */}
                          <YAxis
                            yAxisId="left"
                            domain={[0, 27]}
                            ticks={[0, 5, 10, 15, 20, 27]}
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                          >
                            <Label
                              value="Score (PHQ-9 / GAD-7)"
                              angle={-90}
                              position="insideLeft"
                              offset={12}
                              style={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                            />
                          </YAxis>
                          {/* Right Y-axis: MHI */}
                          {hasBackend && (
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              domain={[0, 100]}
                              ticks={[0, 25, 50, 75, 100]}
                              tick={{ fill: "#22c55e", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              width={44}
                            >
                              <Label
                                value="MHI (0–100)"
                                angle={90}
                                position="insideRight"
                                offset={8}
                                style={{ fontSize: 10, fill: "#22c55e", fontWeight: 700 }}
                              />
                            </YAxis>
                          )}
                        </>
                      )}

                      <Tooltip content={<CustomTooltip />} />

                      {/* Reference lines */}
                      {chartMode === "mhi" ? (
                        <>
                          <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="5 3" strokeWidth={1.5}
                            label={{ value: "Good ≥75", position: "insideTopRight", fontSize: 9, fill: "#15803d", fontWeight: 700 }} />
                          <ReferenceLine y={50} stroke="#eab308" strokeDasharray="5 3" strokeWidth={1.5}
                            label={{ value: "Moderate ≥50", position: "insideTopRight", fontSize: 9, fill: "#b45309", fontWeight: 700 }} />
                          <ReferenceLine y={25} stroke="#f97316" strokeDasharray="5 3" strokeWidth={1.5}
                            label={{ value: "Poor ≥25", position: "insideTopRight", fontSize: 9, fill: "#c2410c", fontWeight: 700 }} />
                        </>
                      ) : (
                        <ReferenceLine yAxisId="left" y={10} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1.5}
                          label={{ value: "Moderate ≥10", position: "insideTopRight", fontSize: 9, fill: "#c2410c", fontWeight: 600 }} />
                      )}

                      {/* Lines */}
                      {chartMode === "mhi" ? (
                        <Area type="monotoneX" dataKey="MHI" stroke="#22c55e" strokeWidth={2.5}
                          fill="url(#mhiFill)"
                          dot={renderMhiDot}
                          activeDot={{ r: 7, stroke: "white", strokeWidth: 2 }} />
                      ) : (
                        <>
                          <Area yAxisId="left" type="monotoneX" dataKey="PHQ-9" stroke="#3b82f6" strokeWidth={2.5}
                            fill="url(#phqFill)"
                            dot={renderPhqDot}
                            activeDot={{ r: 7, stroke: "white", strokeWidth: 2 }} />
                          <Area yAxisId="left" type="monotoneX" dataKey="GAD-7" stroke="#10b981" strokeWidth={2.5}
                            fill="url(#gadFill)"
                            dot={renderGadDot}
                            activeDot={{ r: 7, stroke: "white", strokeWidth: 2 }} />
                          {hasBackend && (
                            <Line yAxisId="right" type="monotoneX" dataKey="MHI" stroke="#22c55e" strokeWidth={2}
                              strokeDasharray="6 3"
                              dot={renderMhiSmallDot}
                              activeDot={{ r: 5, stroke: "white", strokeWidth: 1.5 }} />
                          )}
                        </>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>

                  {/* Risk per session dots */}
                  {chartData.some((d: any) => d.risk) && (
                    <div className="flex items-center gap-1.5 px-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 mr-1">Risk per session:</span>
                      {chartData.map((d: any, i: number) => {
                        const rm = RISK_META[d.risk];
                        if (!rm) return null;
                        return (
                          <div key={i} title={`${d.label}: ${d.risk} risk`}
                            className="flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 border"
                            style={{ backgroundColor: rm.dot + "18", borderColor: rm.dot + "40", color: rm.dot }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rm.dot }} />
                            {d.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Session Records ── */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-serif text-lg font-bold">Session Records</h2>
              <span className="text-xs text-slate-400">{assessments.length} total</span>
            </div>

            <div className="space-y-2">
              {[...assessments].reverse().map((a, listIdx) => {
                const dep   = getDepressionSeverity(a.phq9Score);
                const anx   = getAnxietySeverity(a.gad7Score);
                const sNum  = assessments.length - listIdx;

                const entry = trendData?.trend?.find((t: any) =>
                  Math.abs(new Date(t.date).getTime() - new Date(a.createdAt).getTime()) < 90_000
                );
                const rlev  = (a as any).riskLevel ?? entry?.risk_level;
                const risk  = rlev ? RISK_META[rlev] : null;
                const mhi   = entry?.mhi_score != null ? parseFloat(entry.mhi_score.toFixed(2)) : null;
                const mhiC  = mhi != null ? mhiColor(mhi) : null;

                const dc = phqColor(a.phq9Score);
                const ac = gadColor(a.gad7Score);

                return (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: listIdx * 0.04 }}>
                    <Link to={`/results/${a.id}`} aria-label={`View session ${sNum} results`}>
                      <div className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm text-slate-500 dark:text-slate-400"
                            style={{ background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)" }}>
                            #{sNum}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {new Date(a.createdAt).toLocaleDateString(undefined, {
                                  year: "numeric", month: "short", day: "numeric",
                                })}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(a.createdAt).toLocaleTimeString(undefined, {
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold"
                                style={{ borderColor: dc + "45", backgroundColor: dc + "12", color: dc }}>
                                PHQ {a.phq9Score} · {dep.label}
                              </span>
                              <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold"
                                style={{ borderColor: ac + "45", backgroundColor: ac + "12", color: ac }}>
                                GAD {a.gad7Score} · {anx.label}
                              </span>
                              {risk && rlev && (
                                <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${risk.bg} ${risk.text} ${risk.border}`}>
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: risk.dot }} />
                                  {rlev} risk
                                </span>
                              )}
                            </div>

                            {mhi != null && mhiC && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: mhiC }} />
                                <span className="text-xs font-bold" style={{ color: mhiC }}>MHI {mhi}</span>
                              </div>
                            )}
                          </div>

                          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── New Assessment CTA ── */}
          <div className="flex justify-center pt-2 pb-6">
            <Button asChild className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 px-8 h-11">
              <Link to="/assessment">
                <Sparkles className="h-4 w-4 mr-2" />Take New Assessment
              </Link>
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default History;