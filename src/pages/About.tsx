import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Brain, GraduationCap, Code2, Database, Cpu,
  ArrowRight, BookOpen, Layers, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const TECH_STACK = [
  {
    category: "Frontend",
    icon: Code2,
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    items: ["React 18 + TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "Framer Motion", "Recharts"],
  },
  {
    category: "Backend",
    icon: Layers,
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    items: ["FastAPI (Python)", "Pydantic v2", "MySQL + Connection Pool", "Python-dotenv", "Uvicorn"],
  },
  {
    category: "ML & AI",
    icon: Cpu,
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    items: ["scikit-learn (Random Forest)", "SHAP (Explainability)", "Groq API", "LLaMA 3.3 70B", "joblib"],
  },
  {
    category: "Data & Research",
    icon: Database,
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    items: ["PHQ-9 Clinical Scale", "GAD-7 Clinical Scale", "MySQL persistence", "Trend analytics", "Risk stratification"],
  },
];

const NOVELTIES = [
  {
    num: "01",
    title: "Mental Health Index (MHI)",
    desc: "A novel composite 0–100 wellness score that combines PHQ-9 and GAD-7 scores with weighted distress normalization, providing a single interpretable metric for longitudinal tracking.",
  },
  {
    num: "02",
    title: "Risk Escalation Engine",
    desc: "A multi-factor scoring system that synthesizes ML predictions, MHI, early warning signals, and raw scores into a 5-level risk classification (Low → Critical) with actionable clinical protocols.",
  },
  {
    num: "03",
    title: "SHAP-Based Explainability",
    desc: "SHAP values are generated for each user's ML prediction, identifying the specific symptoms contributing most to their risk level, and enabling personalized insights rather than generic advice.",
  },
  {
    num: "04",
    title: "Temporal Modeling For Tracking Mental Health Trajectories",
    desc: "A multi-factor temporal model that tracks changes in user mental health over time, enabling early detection of worsening or improvement patterns.",
  },
  {
    num: "05",
    title: "Symptom-Specific LLM Recommendation",
    desc: "Per-instance SHAP values are fed directly into a carefully engineered LLaMA 3.3 70B prompt, ensuring the AI recommendation addresses only THIS user's specific highest-impact symptoms.",
  },
];

const About = () => {
  return (
    <div className="bg-white dark:bg-slate-900">

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-3xl space-y-6"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.h1 variants={fadeUp} className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
              About MindPulse
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              MindPulse is the intersection of clinical psychology,
              machine learning, and explainable AI — designed to make validated mental health
              screening accessible, insightful, and transparent.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Project Overview ─────────────────────────────────── */}
      <section className="py-20 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
                The Research Problem
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Mental health disorders — particularly depression and anxiety — affect over
                280 million people globally, yet access to screening and early intervention
                remains limited, especially in lower-resource settings.
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Existing digital tools provide a score, but rarely explain <em>why</em> —
                leaving users without actionable insight. MindPulse bridges this gap by
                combining gold-standard clinical tools with explainable AI (SHAP) and
                LLM-generated personalized guidance.
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                The system introduces four novel contributions: a Mental Health Index, an Early
                Warning Detection system, a Risk Escalation Engine, and symptom-specific
                LLM recommendations grounded in per-instance SHAP values.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "280M+", label: "People affected by depression globally" },
                { value: "60%",   label: "Never receive adequate treatment" },
                { value: "PHQ-9", label: "Gold standard depression tool (sensitivity 88%)" },
                { value: "SHAP",  label: "Explainability framework for ML predictions" },
              ].map(({ value, label }) => (
                <div key={value} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200/60 dark:border-slate-700/50 space-y-1">
                  <div className="font-serif text-2xl font-bold text-blue-600 dark:text-blue-400">{value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Novel Contributions ──────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Novel Contributions</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
              5 Research Innovations
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Beyond standard PHQ-9/GAD-7 scoring, MindPulse introduces four original
              AI/clinical components as part of the M.Tech thesis.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {NOVELTIES.map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                  <CardContent className="p-6 space-y-3">
                    <div className="font-mono text-3xl font-bold text-slate-200 dark:text-slate-700">{num}</div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ──────────────────────────────────────── */}
      <section className="py-20 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Technology Stack</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Built with production-grade open source tools across the full stack.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TECH_STACK.map(({ category, icon: Icon, color, items }, i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border border-slate-200 dark:border-slate-700">
                  <CardContent className="p-5 space-y-4">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${color}`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-semibold">{category}</span>
                    </div>
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────────── */}
      <section className="py-12 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <BookOpen className="h-7 w-7 mx-auto text-amber-500" />
          <h3 className="font-serif text-xl font-semibold text-slate-800 dark:text-white">Academic Use Only</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            MindPulse is developed exclusively for M.Tech research and academic evaluation purposes.
            It is not a licensed medical device and must not be used as a substitute for professional
            mental health diagnosis or treatment. Always consult a qualified clinician.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Brain className="h-10 w-10 mx-auto text-white/80" strokeWidth={1.5} />
          <h2 className="font-serif text-3xl font-bold text-white">Try MindPulse</h2>
          <p className="text-blue-100 max-w-md mx-auto">
            Experience the assessment yourself — free, confidential, and under 5 minutes.
          </p>
          <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 h-12">
            <Link to="/login">Start Assessment <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </section>

    </div>
  );
};

export default About;