import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2,
  Lock, Brain, Heart, Shield, Info,
} from "lucide-react";
import { getUser, saveAssessment } from "@/lib/user-session";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOTAL_STEPS = 3;

// ── Clinical questions ────────────────────────────────────────────────────────
const PHQ9 = [
  { q: "Little interest or pleasure in doing things", emoji: "😶" },
  { q: "Feeling down, depressed, or hopeless",         emoji: "😔" },
  { q: "Trouble falling or staying asleep, or sleeping too much", emoji: "😴" },
  { q: "Feeling tired or having little energy",         emoji: "🪫" },
  { q: "Poor appetite or overeating",                   emoji: "🍽️" },
  { q: "Feeling bad about yourself — or that you are a failure", emoji: "💭" },
  { q: "Trouble concentrating on things",               emoji: "🧠" },
  { q: "Moving or speaking so slowly others noticed, or being fidgety/restless", emoji: "🔄" },
  { q: "Thoughts that you would be better off dead, or thoughts of hurting yourself", emoji: "⚠️" },
];

const GAD7 = [
  { q: "Feeling nervous, anxious, or on edge",          emoji: "😬" },
  { q: "Not being able to stop or control worrying",    emoji: "🌀" },
  { q: "Worrying too much about different things",      emoji: "💭" },
  { q: "Trouble relaxing",                              emoji: "😤" },
  { q: "Being so restless that it is hard to sit still", emoji: "🏃" },
  { q: "Becoming easily annoyed or irritable",          emoji: "😠" },
  { q: "Feeling afraid as if something awful might happen", emoji: "😨" },
];

const OPTS = [
  { v: 0, label: "Not at all",               short: "Never" },
  { v: 1, label: "Several days",             short: "Sometimes" },
  { v: 2, label: "More than half the days",  short: "Often" },
  { v: 3, label: "Nearly every day",         short: "Always" },
];

const GENDERS = ["Male","Female","Non-binary / Gender non-conforming","Prefer to self-describe","Prefer not to say"];

const EDUCATION = [
  "Currently in High School (9th–12th / Junior College)",
  "Completed 12th / Higher Secondary",
  "Diploma / Vocational / ITI",
  "Undergraduate — B.E / B.Tech (pursuing)",
  "Undergraduate — B.Sc / B.A / BCA / B.Com (pursuing)",
  "Undergraduate Degree (completed)",
  "Postgraduate — M.Tech / M.E (pursuing)",
  "Postgraduate — MBA / M.Sc / M.A (pursuing)",
  "Postgraduate Degree (completed)",
  "PhD / Research Scholar",
  "Dropped out / Taking a break",
  "Working professional (no college currently)",
  "Other",
];

const OCCUPATIONS = [
  "School student (9th–12th)",
  "College student — undergraduate",
  "College student — postgraduate",
  "Working professional — IT / Tech",
  "Working professional — Non-IT",
  "Freelancer / Self-employed",
  "Job seeker / Between jobs",
  "Entrepreneur / Startup founder",
  "Research scholar / PhD",
  "Not currently working or studying",
  "Prefer not to say",
];

const SLEEP = [
  "Less than 4 hrs (severely sleep-deprived)",
  "4–5 hrs (below recommended)",
  "6–7 hrs (slightly below optimal)",
  "7–9 hrs (healthy range ✓)",
  "More than 9 hrs (oversleeping)",
  "Very irregular — varies significantly each night",
];

const STRESS = [
  "Academic pressure — exams, assignments, grades",
  "Career stress — job search, appraisals, workplace",
  "Financial stress — money, loans, expenses",
  "Relationship issues — romantic partner",
  "Family conflict or parental pressure",
  "Friendship issues or social rejection",
  "Social media pressure, comparison, or FOMO",
  "Body image or self-esteem concerns",
  "Physical health or chronic illness",
  "Grief, loss, or bereavement",
  "Major life transition (graduation, relocation, etc.)",
  "Loneliness or social isolation",
  "Academic-career mismatch or confusion",
  "Nothing significant right now",
];

const MH_HISTORY = [
  "No previous diagnosis",
  "Depression",
  "Anxiety (GAD / Panic / Social Anxiety)",
  "Both Depression and Anxiety",
  "ADHD / ADD",
  "OCD (Obsessive-Compulsive Disorder)",
  "PTSD / Trauma-related",
  "Bipolar Disorder",
  "Eating Disorder",
  "Other",
  "Prefer not to say",
];

const SUPPORT_SYSTEM = [
  "Strong — family & friends support me well",
  "Moderate — some support but could be better",
  "Weak — mostly dealing with things alone",
  "None — I have no one to talk to",
  "Seeing a therapist / counsellor",
  "Prefer not to say",
];

// ── Step indicator ────────────────────────────────────────────────────────────
const steps = [
  { label: "About You", icon: Shield,  color: "from-violet-600 to-indigo-600" },
  { label: "PHQ-9",     icon: Brain,   color: "from-blue-600 to-cyan-600" },
  { label: "GAD-7",     icon: Heart,   color: "from-emerald-600 to-teal-600" },
];

const Field = ({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
    {hint && <p className="text-[11px] text-slate-400 pl-2 border-l-2 border-slate-200 dark:border-slate-700">{hint}</p>}
  </div>
);

const AnswerCard = ({
  opt, selected, onSelect, accent,
}: { opt: typeof OPTS[0]; selected: boolean; onSelect: () => void; accent: string }) => (
  <button
    type="button" onClick={onSelect}
    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 px-2 text-center text-xs font-medium transition-all duration-150 cursor-pointer select-none
      ${selected
        ? `border-current ${accent} text-white shadow-md scale-[1.02]`
        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
      }`}
  >
    <span className={`text-base font-bold ${selected ? "text-white" : "text-slate-400"}`}>{opt.v}</span>
    <span className="leading-tight">{opt.short}</span>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
const Assessment = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [step, setStep]             = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string|null>(null);

  // Demographics
  const [age, setAge]               = useState("");
  const [ageErr, setAgeErr]         = useState<string|null>(null);
  const [gender, setGender]         = useState("");
  const [education, setEducation]   = useState("");
  const [occupation, setOccupation] = useState("");
  const [sleep, setSleep]           = useState("");
  const [stress, setStress]         = useState("");
  const [mhHistory, setMhHistory]   = useState("");
  const [support, setSupport]       = useState("");
  const [events, setEvents]         = useState("");

  const [phq9, setPhq9] = useState<(number|null)[]>(Array(9).fill(null));
  const [gad7, setGad7] = useState<(number|null)[]>(Array(7).fill(null));

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);

  // FIX: Age range extended to 13–100 to match backend
  const validateAge = (v: string) => {
    const n = parseInt(v);
    if (!v)                    { setAgeErr("Age is required"); return false; }
    if (isNaN(n)||n<13||n>100) { setAgeErr("Age must be between 13 and 100"); return false; }
    setAgeErr(null); return true;
  };

  const canProceed = () => {
    if (step === 0) {
      const n = parseInt(age);
      return age && !isNaN(n) && n>=13 && n<=100 && !ageErr && gender && education && sleep && mhHistory;
    }
    if (step === 1) return phq9.every(a => a !== null);
    if (step === 2) return gad7.every(a => a !== null);
    return false;
  };

  const phq9Done = phq9.filter(a => a!==null).length;
  const gad7Done = gad7.filter(a => a!==null).length;

  const setAns = (setter: any, i: number, v: number) =>
    setter((prev: any[]) => { const n=[...prev]; n[i]=v; return n; });

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    const phqScore = phq9.reduce((a,b) => a!+b!, 0) as number;
    const gadScore = gad7.reduce((a,b) => a!+b!, 0) as number;

    // FIX: Send occupation, support_system, stressful_events as SEPARATE fields
    // matching backend MentalInput schema exactly
    const payload = {
      user_name:  user!.name,
      user_email: user!.email,
      age: parseInt(age)||0,
      gender,
      education,
      occupation,                    // FIX: separate field
      sleep_pattern: sleep,
      stress_source: stress,
      mental_history: mhHistory,     // FIX: only the actual history, not concatenated
      support_system: support,       // FIX: separate field
      stressful_events: events,      // FIX: separate field (was "additional_context" before — wrong key)
      phq_little_interest: phq9[0]!, phq_feeling_down: phq9[1]!, phq_sleep_issues: phq9[2]!,
      phq_low_energy: phq9[3]!,       phq_appetite: phq9[4]!,      phq_self_worth: phq9[5]!,
      phq_concentration: phq9[6]!,    phq_psychomotor: phq9[7]!,   phq_suicidal_thoughts: phq9[8]!,
      phq_total_score: phqScore,
      gad_nervous: gad7[0]!,          gad_uncontrollable_worry: gad7[1]!, gad_excessive_worry: gad7[2]!,
      gad_trouble_relaxing: gad7[3]!, gad_restlessness: gad7[4]!,  gad_irritability: gad7[5]!,
      gad_fear: gad7[6]!,
      gad_total_score: gadScore,
    };
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const aiData = await res.json();

      // FIX: Include user_email so getAssessmentsByEmail() can filter correctly in History
      saveAssessment({
        user_email: user!.email,     // FIX: was missing — causes History to show empty
        phq9Score: phqScore,
        gad7Score: gadScore,
        depressionSeverity: aiData.depression_severity ?? 0,
        anxietySeverity:    aiData.anxiety_severity    ?? 0,
        riskLevel: aiData.risk_escalation?.risk_level ?? "Low",
        aiData,
      });

      navigate("/results/latest");
    } catch(e: any) {
      setError(e.message || "Failed to submit. Please check the backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step+1)/TOTAL_STEPS)*100;
  const StepIcon = steps[step].icon;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">

        {/* ── Step indicator ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-4">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i < step, active = i === step;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 transition-all ${active ? "opacity-100" : done ? "opacity-60" : "opacity-30"}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0
                      ${done ? "bg-green-500" : active ? `bg-gradient-to-br ${s.color}` : "bg-slate-200 dark:bg-slate-700"}`}>
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-white"/>
                        : <Icon className="h-3.5 w-3.5 text-white"/>
                      }
                    </div>
                    <span className={`text-xs font-semibold hidden sm:block ${active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length-1 && (
                    <div className="flex-1 mx-2 h-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: i<step?"100%":"0%" }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Step {step+1} of {TOTAL_STEPS}</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}/>
          </div>
        </div>

        {/* ── Step content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-40 }}
            transition={{ duration:0.22 }}>

            {/* ══ STEP 0: DEMOGRAPHICS ══════════════════════════════════════════ */}
            {step === 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                <div className={`bg-gradient-to-r ${steps[0].color} px-6 pt-5 pb-6 text-white`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-5 w-5 opacity-80"/>
                    <h2 className="font-serif text-xl font-bold">About You</h2>
                  </div>
                  <p className="text-violet-100 text-sm">Help us personalise your results. Fields with <span className="text-red-300 font-bold">*</span> are required.</p>
                </div>

                <div className="p-6 space-y-5">
                  {/* Age + Gender */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* FIX: Age max extended to 100 */}
                    <Field label="Age" required hint="Must be between 13 and 100.">
                      <Input type="number" min="13" max="100" value={age}
                        onChange={(e) => { setAge(e.target.value); if(e.target.value) validateAge(e.target.value); else setAgeErr(null); }}
                        onBlur={() => age && validateAge(age)}
                        className={`h-11 rounded-xl ${ageErr?"border-red-400":""}`}
                        placeholder="e.g. 21"/>
                      {ageErr && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3"/>{ageErr}</p>}
                    </Field>
                    <Field label="Gender" required hint="Used to contextualise results.">
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select gender"/></SelectTrigger>
                        <SelectContent>{GENDERS.map(g=><SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Education + Occupation */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Education Level" required hint="Your current or most recently completed level.">
                      <Select value={education} onValueChange={setEducation}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select education"/></SelectTrigger>
                        <SelectContent>{EDUCATION.map(e=><SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Current Occupation" hint="Helps the AI understand your life context.">
                      <span className="text-slate-400 text-xs font-normal ml-1.5">(Optional)</span>
                      <Select value={occupation} onValueChange={setOccupation}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="What do you do?"/></SelectTrigger>
                        <SelectContent>{OCCUPATIONS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Sleep */}
                  <Field label="Average Nightly Sleep" required hint="Sleep quality is one of the strongest predictors of mental health.">
                    <Select value={sleep} onValueChange={setSleep}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="How many hours do you sleep per night?"/></SelectTrigger>
                      <SelectContent>{SLEEP.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>

                  {/* Primary stressor */}
                  <Field label="Primary Source of Stress" hint="What's weighing on you most right now?">
                    <span className="text-slate-400 text-xs font-normal ml-1.5">(Optional)</span>
                    <Select value={stress} onValueChange={setStress}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="What stresses you most?"/></SelectTrigger>
                      <SelectContent>{STRESS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>

                  {/* Mental health history + support */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Previous Mental Health Diagnosis" required hint="Only used to personalise your AI recommendation.">
                      <Select value={mhHistory} onValueChange={setMhHistory}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Any prior diagnosis?"/></SelectTrigger>
                        <SelectContent>{MH_HISTORY.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Support System" hint="Having support impacts mental health significantly.">
                      <span className="text-slate-400 text-xs font-normal ml-1.5">(Optional)</span>
                      <Select value={support} onValueChange={setSupport}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Who can you talk to?"/></SelectTrigger>
                        <SelectContent>{SUPPORT_SYSTEM.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Optional events */}
                  <Field label="Recent Stressful Events" hint="Optional — helps the AI give more relevant coping strategies.">
                    <span className="text-slate-400 text-xs font-normal ml-1.5">(Optional)</span>
                    <Textarea value={events} onChange={e=>setEvents(e.target.value)} rows={3} className="rounded-xl resize-none"
                      placeholder="e.g. upcoming exams, breakup, job rejection, financial trouble, family conflict…"/>
                  </Field>

                  {/* Privacy note */}
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
                    <Lock className="h-3.5 w-3.5 flex-shrink-0"/>
                    Your responses are private and are used only to generate your personalized mental health results.
                  </div>

                  {!canProceed() && (age||gender||education||mhHistory) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Info className="h-3 w-3"/>
                      Please fill in Age, Gender, Education, Sleep and Prior Diagnosis to continue.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ══ STEP 1: PHQ-9 ════════════════════════════════════════════════ */}
            {step === 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                <div className={`bg-gradient-to-r ${steps[1].color} px-6 pt-5 pb-5 text-white`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-5 w-5 opacity-80"/>
                    <h2 className="font-serif text-xl font-bold">PHQ-9 — Depression Screening</h2>
                  </div>
                  <p className="text-blue-100 text-sm mb-2">
                    Over the <strong className="text-white">last 2 weeks</strong>, how often have you been bothered by each of the following?
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-blue-400/40 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width:`${(phq9Done/9)*100}%` }}/>
                    </div>
                    <span className="text-xs text-blue-100 font-semibold whitespace-nowrap">
                      {phq9Done === 9 ? "✓ All done!" : `${phq9Done} / 9`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                  {OPTS.map(o => (
                    <div key={o.v} className="py-2 text-center">
                      <div className="text-base font-bold text-blue-600 dark:text-blue-400">{o.v}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{o.label}</div>
                    </div>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {PHQ9.map(({ q, emoji }, i) => (
                    <div key={i}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        phq9[i] !== null
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/10"
                          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}>
                      <div className="flex items-start gap-2 mb-3">
                        <span className="flex-shrink-0 text-lg leading-none">{emoji}</span>
                        <div className="flex-1">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold mr-1.5 align-middle">{i+1}</span>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{q}</span>
                          {i === 8 && (
                            <span className="ml-2 inline-flex items-center text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700 rounded px-1.5 py-0.5 font-semibold">
                              ⚠ Safety question
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {OPTS.map(opt => (
                          <AnswerCard key={opt.v} opt={opt} selected={phq9[i]===opt.v}
                            onSelect={() => setAns(setPhq9, i, opt.v)} accent="bg-blue-600"/>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ STEP 2: GAD-7 ════════════════════════════════════════════════ */}
            {step === 2 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                <div className={`bg-gradient-to-r ${steps[2].color} px-6 pt-5 pb-5 text-white`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-5 w-5 opacity-80"/>
                    <h2 className="font-serif text-xl font-bold">GAD-7 — Anxiety Screening</h2>
                  </div>
                  <p className="text-emerald-100 text-sm mb-2">
                    Over the <strong className="text-white">last 2 weeks</strong>, how often have you been bothered by each of the following?
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-emerald-400/40 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width:`${(gad7Done/7)*100}%` }}/>
                    </div>
                    <span className="text-xs text-emerald-100 font-semibold whitespace-nowrap">
                      {gad7Done === 7 ? "✓ All done!" : `${gad7Done} / 7`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                  {OPTS.map(o => (
                    <div key={o.v} className="py-2 text-center">
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{o.v}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{o.label}</div>
                    </div>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {GAD7.map(({ q, emoji }, i) => (
                    <div key={i}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        gad7[i] !== null
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-900/10"
                          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}>
                      <div className="flex items-start gap-2 mb-3">
                        <span className="flex-shrink-0 text-lg leading-none">{emoji}</span>
                        <div>
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold mr-1.5 align-middle">{i+1}</span>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{q}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {OPTS.map(opt => (
                          <AnswerCard key={opt.v} opt={opt} selected={gad7[i]===opt.v}
                            onSelect={() => setAns(setGad7, i, opt.v)} accent="bg-emerald-600"/>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {gad7Done === 7 && (
                  <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0"/>
                    All questions answered! Click Submit to get your personalised AI analysis.
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Error ── */}
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4"/><AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 px-4 py-3 shadow-sm">
          <Button variant="outline" onClick={() => { setStep(s=>s-1); setError(null); }}
            disabled={step===0||submitting} className="gap-1.5 rounded-xl h-10">
            <ArrowLeft className="h-4 w-4"/> Back
          </Button>

          <div className="flex items-center gap-1.5">
            {steps.map((_,i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i===step?"w-6 bg-blue-600":"w-2 bg-slate-200 dark:bg-slate-700"}`}/>
            ))}
          </div>

          {step < TOTAL_STEPS-1 ? (
            <Button onClick={() => setStep(s=>s+1)} disabled={!canProceed()}
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-10 shadow-md shadow-blue-500/20">
              Next <ArrowRight className="h-4 w-4"/>
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()||submitting}
              className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-10 px-5 shadow-md shadow-emerald-500/20">
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin"/>Analysing with AI…</>
                : <>Submit &amp; Get Results <ArrowRight className="h-4 w-4"/></>
              }
            </Button>
          )}
        </div>

        {!canProceed() && step > 0 && (
          <p className="text-center text-xs text-slate-400">
            {step===1
              ? `${9-phq9Done} more question${9-phq9Done!==1?"s":""} remaining`
              : `${7-gad7Done} more question${7-gad7Done!==1?"s":""} remaining`}
          </p>
        )}
      </div>
    </div>
  );
};

export default Assessment;