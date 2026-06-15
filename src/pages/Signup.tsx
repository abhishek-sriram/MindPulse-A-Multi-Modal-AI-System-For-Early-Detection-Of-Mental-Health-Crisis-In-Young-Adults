import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, AtSign, Mail, Phone, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, Shield, ArrowRight, Sparkles, Check,
} from "lucide-react";
import { setUser } from "@/lib/user-session";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getStrength(pw: string) {
  // Hard gate: length < 8 is always "Too short" regardless of complexity.
  // This prevents misleading labels like "Good" for a short-but-complex password.
  if (pw.length < 8) {
    const need = 8 - pw.length;
    return {
      score: 0,
      label: "Too short",
      color: "#ef4444",
      tips: [`need ${need} more char${need === 1 ? "" : "s"}`],
    };
  }

  // Only score complexity once the minimum length is satisfied
  let score = 1; // baseline for reaching 8+ chars
  const tips: string[] = [];
  if (pw.length >= 12) score++; else tips.push("12+ chars recommended");
  if (/[A-Z]/.test(pw))        score++; else tips.push("uppercase letter");
  if (/[^A-Za-z0-9]/.test(pw)) score++; else tips.push("symbol (!@#$%)");
  // number is a hard requirement (already validated in pwErr) — no bonus point

  const levels = [
    { label: "Weak",   color: "#ef4444" },
    { label: "Fair",   color: "#f97316" },
    { label: "Fair",   color: "#eab308" },
    { label: "Good",   color: "#22c55e" },
    { label: "Strong", color: "#16a34a" },
  ];
  const l = levels[Math.min(score, 4)];
  return { score, label: l.label, color: l.color, tips: tips.slice(0, 2) };
}

const FieldErr = ({ msg }: { msg?: string }) =>
  msg ? (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xs text-red-500 flex items-center gap-1 mt-1.5"
    >
      <AlertCircle className="h-3 w-3 flex-shrink-0" />{msg}
    </motion.p>
  ) : null;

const Hint = ({ text }: { text: string }) => (
  <p className="text-[11px] text-slate-400 mt-1 pl-3 border-l-2 border-blue-200/50">{text}</p>
);

const Feature = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2.5 text-sm text-blue-100">
    <div className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full bg-blue-400/30 flex items-center justify-center">
      <Check className="h-2.5 w-2.5 text-blue-200" />
    </div>
    {text}
  </div>
);

const Signup = () => {
  const navigate = useNavigate();

  const [fullName,        setFullName]        = useState("");
  const [username,        setUsername]        = useState("");
  const [email,           setEmail]           = useState("");
  const [phone,           setPhone]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw,          setShowPw]          = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [agreed,          setAgreed]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [globalErr,       setGlobalErr]       = useState<string | null>(null);
  const [fieldErrs,       setFieldErrs]       = useState<Record<string, string>>({});

  const clearField = (key: string) => setFieldErrs(p => ({ ...p, [key]: "" }));

  const pwStrength = getStrength(password);

  // ── Inline validations ──────────────────────────────────────────────────────
  const usernameErr = username
    ? !/^[a-zA-Z0-9][a-zA-Z0-9_.]{2,29}$/.test(username)
      ? "3–30 chars · start with letter/number · only a–z, 0–9, _ or . allowed"
      : username.endsWith(".") || username.endsWith("_")
      ? "Cannot end with . or _"
      : ""
    : "";

  const emailErr = email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ? "Enter a valid email (e.g. name@domain.com)"
    : "";

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneErr = phone && phoneDigits.length < 10
    ? "Phone must have at least 10 digits"
    : "";

  const pwErr = password
    ? password.length < 8
      ? "Password must be at least 8 characters"
      : !/[0-9]/.test(password)
      ? "Password must include at least 1 number"
      : ""
    : "";

  // Show confirm error only after user has typed something
  const confirmPwErr = confirmPassword
    ? confirmPassword !== password
      ? "Passwords do not match"
      : ""
    : "";

  // True only when confirm is filled AND matches
  const confirmPwValid = confirmPassword.length > 0 && confirmPassword === password;

  const canSubmit =
    fullName.trim().length >= 2 &&
    username.length >= 3 && !usernameErr &&
    email.includes("@") && !emailErr &&
    (phone === "" || !phoneErr) &&
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    !pwErr &&
    confirmPwValid &&   // both must match
    agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setGlobalErr(null);
    setFieldErrs({});
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username:  username.trim().toLowerCase(),
          email:     email.trim().toLowerCase(),
          phone:     phone.trim() || "N/A",
          password,
          // confirmPassword is only used client-side — not sent to backend
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.detail && typeof data.detail === "object") {
          setFieldErrs(data.detail);
        } else {
          setGlobalErr(data.detail ?? `Signup failed (${res.status}). Try again.`);
        }
        return;
      }
      setUser({
        name:     data.user.full_name,
        email:    data.user.email,
        username: data.user.username,
        phone:    data.user.phone,
        token:    data.token,
      });
      navigate("/assessment");
    } catch {
      setGlobalErr("Cannot connect to server. Ensure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Left: form (scrolls independently) ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
        <div className="w-full max-w-[440px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="h-11 w-11 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
              <img src="/mindpulse_logo.png" alt="MindPulse" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif font-bold text-xl text-slate-900 dark:text-white">MindPulse</span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-[1.85rem] font-bold font-serif text-slate-900 dark:text-white leading-tight">
              Create your account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
              Get instant access to AI-powered mental health screening
            </p>
          </div>
          {/* Global error */}
          <AnimatePresence>
            {globalErr && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 mb-5 text-sm text-red-700 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{globalErr}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* ── Full Name ── */}
            <div>
              <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="fullName" placeholder="John Doe" value={fullName}
                  onChange={(e) => { setFullName(e.target.value); clearField("full_name"); }}
                  className="h-11 pl-9 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required autoComplete="name"
                />
              </div>
              <Hint text="Type your Full Name" />
              <FieldErr msg={fieldErrs.full_name} />
            </div>

            {/* ── Username ── */}
            <div>
              <Label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username" placeholder="john_doe or jd.07" value={username}
                  onChange={(e) => { setUsername(e.target.value); clearField("username"); }}
                  className={`h-11 pl-9 pr-9 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${fieldErrs.username || usernameErr ? "border-red-400 focus:border-red-400" : username && !usernameErr ? "border-green-400 focus:border-green-400" : ""}`}
                  required autoComplete="username"
                />
                {username && !usernameErr && !fieldErrs.username && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              <Hint text="3–30 chars · letters, numbers, _ or . · start with a letter or number" />
              <FieldErr msg={fieldErrs.username || usernameErr} />
            </div>

            {/* ── Email ── */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                Email ID <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email" type="email" placeholder="name@domain.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); clearField("email"); }}
                  className="h-11 pl-9 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required autoComplete="email"
                />
              </div>
              <Hint text="Used for Account Recovery" />
              <FieldErr msg={fieldErrs.email || emailErr} />
            </div>

            {/* ── Phone (optional) ── */}
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                Contact Number
                <span className="text-slate-400 text-xs font-normal ml-1.5">(Optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone" type="tel" placeholder="+91 98765 43210" value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearField("phone"); }}
                  className={`h-11 pl-9 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${phoneErr ? "border-red-400" : ""}`}
                  autoComplete="tel"
                />
              </div>
              <Hint text="India: +91 then 10 digits · international format OK · spaces & dashes allowed" />
              <FieldErr msg={fieldErrs.phone || phoneErr} />
            </div>

            {/* ── Password ── */}
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Minimum 8 characters + 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-11 pl-9 pr-10 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${pwErr && password ? "border-red-400" : ""}`}
                  required autoComplete="new-password"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i < pwStrength.score ? pwStrength.color : "#e2e8f0" }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: pwStrength.color }}>
                    {pwStrength.label}
                    {pwStrength.tips.length > 0 && (
                      <span style={{ color: pwStrength.score === 0 ? pwStrength.color : undefined }}
                        className={pwStrength.score === 0 ? "" : "text-slate-400"}>
                        {" — "}{pwStrength.tips.join(", ")}
                      </span>
                    )}
                  </p>
                </div>
              )}
              <Hint text="Min 8 chars · must include 1 number (0–9) · add symbol (!@#$%) for stronger security" />
              <FieldErr msg={pwErr || fieldErrs.password} />
            </div>

            {/* ── Confirm Password ── */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-11 pl-9 pr-16 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors
                    ${confirmPwErr
                      ? "border-red-400 focus:border-red-400"
                      : confirmPwValid
                      ? "border-green-400 focus:border-green-400"
                      : ""
                    }`}
                  required autoComplete="new-password"
                />
                {/* Eye toggle */}
                <button
                  type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {/* Match / mismatch icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {confirmPwValid
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : confirmPwErr
                    ? <AlertCircle className="h-4 w-4 text-red-400" />
                    : null
                  }
                </div>
              </div>
              <Hint text="Must exactly match the password entered above" />
              <FieldErr msg={confirmPwErr} />
            </div>

            {/* ── Terms ── */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setAgreed(!agreed)}
                className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 transition-all flex items-center justify-center cursor-pointer
                  ${agreed ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"}`}
              >
                {agreed && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300 leading-snug select-none"><span className="text-blue-600 dark:text-blue-400 underline"></span>
                I understand that this is a Mental Health AI Tool, not a Clinical Diagnosis.
              </span>
            </label>

            {/* ── Submit readiness hint — shows exactly what's still missing ── */}
            {!canSubmit && (fullName || username || email || password) && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Almost there! Please check:</p>
                <ul className="space-y-0.5 pl-3 list-disc">
                  {fullName.trim().length < 2 && <li>Full name must be at least 2 characters</li>}
                  {(username.length < 3 || !!usernameErr) && <li>Username is invalid or too short</li>}
                  {(!email.includes("@") || !!emailErr) && <li>Valid email address required</li>}
                  {!!phoneErr && <li>Phone number is invalid</li>}
                  {pwErr && <li>{pwErr}</li>}
                  {!confirmPwValid && confirmPassword.length > 0 && <li>Passwords do not match</li>}
                  {!confirmPwValid && confirmPassword.length === 0 && password.length >= 8 && !pwErr && <li>Please confirm your password</li>}
                  {!agreed && <li>Please accept the Terms of Service</li>}
                </ul>
              </div>
            )}

            {/* ── Submit ── */}
            <Button
              type="submit" disabled={!canSubmit || loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-500/20 gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
              ) : (
                <>Create my account <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <Link to="/login">
              <Button type="button" variant="outline"
                className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
                Already have an account? Log in
              </Button>
            </Link>

          </form>

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center mt-5">
            <Lock className="h-3 w-3" />
            Your data is secure and private.
          </p>
        </div>
      </div>

      {/* ── Right: decorative panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden">
        {/* Gradient fills the entire column */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800" />
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-violet-500/20 blur-2xl" />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Content — centred vertically */}
        <div className="relative z-10 w-full flex flex-col justify-center items-start px-10 py-10 space-y-6">

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-white overflow-hidden flex-shrink-0 shadow-lg border border-white/30">
              <img src="/mindpulse_logo.png" alt="MindPulse" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-serif text-2xl font-bold text-white">MindPulse</div>
              <div className="text-blue-200 text-[10px] tracking-[0.18em] uppercase font-medium">
                Predictive Care For A Healthier Mind
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-white font-serif text-2xl font-bold leading-snug">
              Understand your mental health in under 5 minutes
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Powered by clinically validated PHQ-9 &amp; GAD-7 screening tools combined with explainable AI.
            </p>
          </div>

          <div className="space-y-3">
            <Feature text="Clinically validated PHQ-9 & GAD-7 questionnaires" />
            <Feature text="Random Forest model with 4-tier severity classification" />
            <Feature text="Mental Health Index & Risk Escalation scoring" />
            <Feature text="SHAP explainability — See which symptoms matter most" />
            <Feature text="Temporal Modeling for Tracking Mental Health Trajectory" />
            <Feature text="Personalised AI recommendations from LLaMA 3.3-70B-Versatile" />
            <Feature text="100% private — Your data stays secured" />
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-5">
            <p className="text-white font-semibold text-sm mb-1">Designed for Young Adults</p>
            <p className="text-blue-200 text-xs leading-relaxed">
              Tailor-made for students &amp; professionals aged 18–30 navigating academic pressure,
              career stress, and life transitions.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;