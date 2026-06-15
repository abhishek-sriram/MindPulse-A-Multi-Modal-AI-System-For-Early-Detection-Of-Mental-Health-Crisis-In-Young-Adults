import { Link } from "react-router-dom";
import { Bot, ClipboardCheck, ShieldCheck, ArrowRight, Sparkles, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUser } from "@/lib/user-session";
import { motion } from "framer-motion";

// FIX: Typed as const Variants to satisfy Framer Motion's strict TS types.
// ease must be a string (not string[]) when used inside a Variants object.
import type { Variants } from "framer-motion";

// FIX: Framer Motion TS strict types reject inline `transition` inside variant targets.
// Keep variants clean (opacity/y only), pass `transition` as a prop on each motion element.
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0 },
};
const itemTransition = { duration: 0.55, ease: "easeOut" } as const;

const STATS = [
  { value: "PHQ-9",         label: "Depression Screener",  icon: ClipboardCheck },
  { value: "GAD-7",         label: "Anxiety Screener",     icon: ShieldCheck },
  { value: "SHAP",          label: "XAI Explainability",   icon: Sparkles },
  { value: "Llama 3.3 70B", label: "AI Recommendations",   icon: Bot },
];

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "PHQ-9 Depression Screen",
    desc:  "9-item questionnaire measuring depression severity on a 0–27 scale, used worldwide in clinical practice.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    href:  "/features#phq9",
  },
  {
    icon: ShieldCheck,
    title: "GAD-7 Anxiety Screen",
    desc:  "7-item measure of generalized anxiety severity on a 0–21 scale, validated across diverse populations.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    href:  "/features#gad7",
  },
  {
    icon: Bot,
    title: "AI-Powered Insights",
    desc:  "Receive a personalized analysis with SHAP-driven recommendations, coping strategies, and guidance on next steps.",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    href:  "/features#ai",
  },
];

const TRUST_POINTS = [
  "Clinically validated screening tools",
  "Explainable AI (XAI) with SHAP",
  "Session history & trend tracking",
  "Private — data stays in your session",
];

const Index = () => {
  const user = getUser();
  const ctaHref = user ? "/assessment" : "/login";
  // FIX: label string has NO "→" — the <ArrowRight> icon is added in JSX below
  // so there is exactly ONE arrow symbol shown, never two
  const ctaLabel = user ? `Continue, ${user.name.split(" ")[0]}` : "Start Free Assessment";

  return (
    <div className="flex flex-col">

      {/* ── Hero section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 pt-8 pb-20 sm:pt-16 sm:pb-28">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/*
            FIX: animate="show" is set directly here.
            All children animate in once on mount and STAY visible permanently.
            No whileInView (which can re-trigger), no exit animation.
          */}
          <motion.div
            className="max-w-3xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} transition={itemTransition} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Sparkles className="h-7 w-7" />
                MindPulse - Predictive Care For A Healthier Mind
              </span>
            </motion.div>

            {/*
              LOGO ABOVE "MindPulse" HEADING
              The logo is a JPEG with a BLACK background.
              mix-blend-screen makes it INVISIBLE on light pages (bg turns transparent = nothing to see).
              FIX: White background container — logo is clearly visible on any page background.
              Size: 120x120px container with the image filling it.
            */}
            <motion.div variants={itemVariants} transition={itemTransition} className="flex justify-center mb-6">
              <div className="relative">
                {/* Glow ring behind the dark container */}
                <div className="absolute -inset-3 rounded-3xl bg-blue-500/20 blur-xl pointer-events-none" />
                {/* White background container */}
                <div className="relative h-64 w-64 rounded-2xl bg-white shadow-2xl overflow-hidden
                                hover:scale-105 transition-transform duration-300 border-2 border-slate-200/60">
                  <img
                    src="/mindpulse_logo.png"
                    alt="MindPulse logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>

            {/* MindPulse heading — rendered directly below the logo */}
            <motion.h1
              variants={itemVariants}
              transition={itemTransition}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-5"
            >
              Mind<span className="text-blue-600 dark:text-blue-400">Pulse</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              transition={itemTransition}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed mb-6"
            >
              Clinically-validated mental health screening with PHQ-9 & GAD-7,
              powered by explainable AI — private, quick, and deeply insightful.
            </motion.p>

            <motion.div variants={itemVariants} transition={itemTransition} className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-8">
              {TRUST_POINTS.map((p) => (
                <div key={p} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {p}
                </div>
              ))}
            </motion.div>

            {/* FIX: ctaLabel has no "→" text; only ONE ArrowRight icon in JSX */}
            <motion.div variants={itemVariants} transition={itemTransition} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 text-base px-8 h-12"
              >
                <Link to={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8 h-12 border-slate-300 dark:border-slate-600">
                <Link to="/features">Learn More</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-slate-800 dark:bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={value} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-mono">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              How MindPulse Works
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Three evidence-based components work together to deliver accurate, personalized mental health insights.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color, href }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="h-full border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <CardContent className="pt-8 pb-7 px-7 space-y-4">
                    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${color}`}>
                      <Icon className="h-6 w-6" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-serif font-semibold text-lg text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                    <Link
                      to={href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all"
                    >
                      Learn more <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          {/* CTA band logo - on blue bg, white/semi-transparent container works */}
          <div className="flex justify-center">
            <div className="h-32 w-32 rounded-xl bg-white shadow-lg overflow-hidden border border-white/30">
              <img src="/mindpulse_logo.png" alt="MindPulse" className="w-full h-full object-cover" />
            </div>
          </div>
          <h2 className="font-serif text-3xl font-bold text-white">
            Take your mental health seriously.
          </h2>
          <p className="text-blue-100 max-w-md mx-auto">
            Complete a free, confidential PHQ-9 & GAD-7 screening and receive AI-powered personalized insights in minutes.
          </p>
          <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold px-8 h-12">
            <Link to={ctaHref}>
              <Users className="h-4 w-4 mr-2" />
              {user ? "Take New Assessment" : "Get Started — It's Free"}
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
};

export default Index;