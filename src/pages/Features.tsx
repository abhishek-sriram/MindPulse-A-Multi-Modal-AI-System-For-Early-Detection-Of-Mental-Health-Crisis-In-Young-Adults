import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ClipboardCheck, ShieldCheck, Bot, Zap, TrendingUp,
  Activity, Brain, ArrowRight, CheckCircle, BarChart2, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const PHQ9_ITEMS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling/staying asleep",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself",
  "Trouble concentrating",
  "Moving or speaking noticeably slower/faster",
  "Thoughts of self-harm or death",
];

const GAD7_ITEMS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

const AI_CAPABILITIES = [
  { icon: Brain,     label: "Severity Classification",   desc: "Multi-class ML model predicts depression and anxiety severity levels (0–3)" },
  { icon: BarChart2, label: "SHAP Explainability",       desc: "Per-instance SHAP values reveal exactly which symptoms drove the AI prediction" },
  { icon: Activity,  label: "Mental Health Index (MHI)", desc: "Composite 0–100 wellness score blending PHQ-9 and GAD-7 into one metric" },
  { icon: Zap,       label: "Early Warning Detection",   desc: "Real-time alerts for suicidal ideation, elevated self-worth risk, and diffuse distress" },
  { icon: TrendingUp,label: "Risk Escalation Engine",    desc: "Multi-factor scoring system producing Low → Critical risk classification with action protocols" },
  { icon: TrendingUp,label: "Temporal Modeling",         desc: "Tracking Mental Health trajectories/trends over sesssions or time" },
  { icon: Bot,       label: "Personalized AI-Powered Recommendations",  desc: "Personalized, symptom-specific wellness advice via Groq-hosted LLaMA 3.3 70B Versatile" },
];

const Features = () => {
  return (
    <div className="bg-white dark:bg-slate-900">

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800 py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
            <motion.h1 variants={fadeUp} className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
              Evidence-Based Screening,<br className="hidden sm:block" /> AI-Powered Insights
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mt-4">
              MindPulse combines two gold-standard clinical tools with machine learning
              and explainable AI to deliver personalized mental health assessments.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── PHQ-9 ───────────────────────────────────────────── */}
      <section id="phq9" className="py-20 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Feature 1</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
                PHQ-9 Depression Screening
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                The Patient Health Questionnaire-9 (PHQ-9) is the gold standard for depression
                screening in primary care settings globally. It measures the frequency of 9
                depressive symptoms over the past 2 weeks on a 0–3 scale (Not at all → Nearly every day).
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Score Range",   value: "0 – 27" },
                  { label: "Sensitivity",   value: "88%" },
                  { label: "Specificity",   value: "88%" },
                  { label: "Time to complete", value: "~2 min" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">{value}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <CardContent className="p-6 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    9 Screening Items
                  </p>
                  {PHQ9_ITEMS.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── GAD-7 ───────────────────────────────────────────── */}
      <section id="gad7" className="py-20 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                <CardContent className="p-6 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    7 Screening Items
                  </p>
                  {GAD7_ITEMS.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Feature 2</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
                GAD-7 Anxiety Screening
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                The Generalized Anxiety Disorder-7 (GAD-7) is the most widely used, validated
                anxiety screener in clinical practice. It captures the frequency of 7 anxiety
                symptoms over 2 weeks and is particularly sensitive to GAD, panic, and phobia disorders.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Score Range",   value: "0 – 21" },
                  { label: "Sensitivity",   value: "89%" },
                  { label: "Specificity",   value: "82%" },
                  { label: "Time to complete", value: "~1 min" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{value}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── AI Features ─────────────────────────────────────── */}
      <section id="ai" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Feature 3</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              AI-Powered Insights Engine
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Six novel AI components work together to move beyond a simple score — delivering
              explainable, actionable mental health intelligence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_CAPABILITIES.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="h-full border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-800/40 transition-colors">
                      <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy note ────────────────────────────────────── */}
      <section className="py-12 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Lock className="h-8 w-8 mx-auto text-slate-400" />
          <h3 className="font-serif text-xl font-semibold text-slate-800 dark:text-white">
            Your Privacy Matters
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            MindPulse stores assessment data locally in your browser session and persists
            session scores to a secure MySQL database for trend analysis. No data is sold or
            shared. This is an academic research tool — not a commercial product.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {["Session-based auth", "No ads, ever", "Open research purpose", "HTTPS secured"].map((p) => (
              <div key={p} className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle className="h-4 w-4 text-green-500" /> {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2 className="font-serif text-3xl font-bold text-white">
            Ready to take the assessment?
          </h2>
          <p className="text-blue-100 max-w-md mx-auto">
            It takes under 5 minutes. Completely free. Your Personal data is always kept safe and Secure.
          </p>
          <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 h-12">
            <Link to="/login">Start Assessment <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </section>

    </div>
  );
};

export default Features;