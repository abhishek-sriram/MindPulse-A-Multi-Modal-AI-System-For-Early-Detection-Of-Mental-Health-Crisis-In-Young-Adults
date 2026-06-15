import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, ArrowRight, Eye, EyeOff, AlertCircle, User, Brain, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setUser, getUser } from "@/lib/user-session";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const BENEFITS = [
  "PHQ-9 & GAD-7 Questionnaires for clinically-validated screening",
  "Random Forest model with 4-tier severity classification",
  "SHAP-based explainability for understanding key symptom drivers",
  "MHI & Risk Escalation scoring for better insights",
  "Session history & Mental health trend tracking",
  "AI-powered tailored recommendations",
  "Private & confidential",
];

const Login = () => {
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const navigate                        = useNavigate();

  useEffect(() => {
    if (getUser()) navigate("/assessment", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Invalid credentials. Please try again."); return; }
      setUser({ name: data.user.full_name, email: data.user.email, username: data.user.username, phone: data.user.phone ?? "", token: data.token });
      navigate("/assessment");
    } catch {
      setError("Cannot connect to the server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex bg-slate-50 dark:bg-slate-950">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700" />
        {/* Animated blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 space-y-8 w-full">
          {/* Logo in dark panel - white/semi-transparent wrapper */}
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-white overflow-hidden flex-shrink-0 shadow-lg border border-white/30">
              <img src="/mindpulse_logo.png" alt="MindPulse" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-serif text-2xl font-bold text-white">MindPulse</div>
              <div className="text-blue-200 text-xs tracking-widest uppercase">Predictive Care For A Healthier Mind</div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-4xl font-bold text-white leading-tight">
              Welcome Back!
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
              Continue your mental health journey with clinically-validated screening and AI-powered insights.
            </p>
          </div>

          <div className="space-y-3">
            {BENEFITS.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-blue-100">
                <CheckCircle2 className="h-4 w-4 text-blue-300 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Decorative quote */}
          <div className="border-l-2 border-blue-400/50 pl-4 mt-4">
            <p className="text-blue-200 text-xs italic leading-relaxed">
              "Mental health is not a destination, but a process. It's about how you drive, not where you're going."
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo - dark wrapper for light mobile background */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="h-11 w-11 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
                <img src="/mindpulse_logo.png" alt="MindPulse" className="w-full h-full object-cover" />
              </div>
              <span className="font-serif text-xl font-bold text-slate-800 dark:text-white">
                Mind<span className="text-blue-600">Pulse</span>
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/60 p-8 space-y-6">

            {/* Header */}
            <div className="space-y-1">
              <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Login</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Enter your credentials to access your account</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/60 px-4 py-3 text-sm text-red-700 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Username or Email ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="username"
                    placeholder="Type your Username or Email ID"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    required
                    autoComplete="username"
                    className="h-11 pl-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    required
                    autoComplete="current-password"
                    className="h-11 pl-10 pr-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!username.trim() || !password || loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Log In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">New to MindPulse?</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <Link to="/signup">
              <Button variant="outline" className="w-full h-11 rounded-xl border-green-400 text-green-700 dark:text-green-400 dark:border-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 active:bg-green-600 active:border-green-600 dark:hover:bg-green-600 dark:hover:border-green-600 dark:hover:text-white font-medium transition-colors duration-150">
                Create free account
              </Button>
            </Link>

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
              <Lock className="h-3 w-3" />
              Passwords are bcrypt-hashed. We never store plain text.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;