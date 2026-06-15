import { Link } from "react-router-dom";
import { Phone, ExternalLink, Heart, Shield, BookOpen } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Home",       href: "/" },
    { label: "Features",   href: "/features" },
    { label: "About",      href: "/about" },
    { label: "Assessment", href: "/assessment" },
    { label: "History",    href: "/history" },
  ],
  Research: [
    { label: "PHQ-9 Scale",         href: "https://www.phqscreeners.com/",             external: true },
    { label: "GAD-7 Scale",         href: "https://adaa.org/sites/default/files/GAD-7_Anxiety-updated_0.pdf", external: true },
    { label: "SHAP Explainability", href: "https://shap.readthedocs.io/",              external: true },
    { label: "Groq LLM API",        href: "https://console.groq.com/",                external: true },
  ],
  Support: [
    { label: "Log In",  href: "/login" },
    { label: "Sign Up", href: "/signup" },
  ],
};

const CRISIS_RESOURCES = [
  { name: "Kiran Mental Health Helpline", number: "1800-599-0019", flag: "🇮🇳" },
  { name: "iCALL Mental Health Support",  number: "+91 9152987821", flag: "🇮🇳" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300">

      {/* Crisis Banner */}
      <div className="bg-blue-900/40 border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-200">
                Crisis Resources (India) — Available 24/7
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {CRISIS_RESOURCES.map((r) => (
                <div key={r.number} className="flex items-center gap-2 text-sm">
                  <span>{r.flag}</span>
                  <a
                    href={`tel:${r.number.replace(/\s/g, "")}`}
                    className="font-semibold text-blue-300 hover:text-white transition-colors"
                  >
                    {r.number}
                  </a>
                  <span className="text-slate-400 text-xs">{r.name}</span>
                </div>
              ))}
              <a
                href="https://mohfw.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-300 hover:text-white transition-colors"
              >
                Ministry of Health <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column with logo image */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              {/*
                Logo in footer: sits on dark background, so we use a small
                white rounded pill to make the blue head graphic pop.
              */}
              <div className="h-16 w-16 rounded-xl bg-white overflow-hidden flex-shrink-0
                              group-hover:scale-105 transition-transform duration-200 border border-white/20 shadow">
                <img src="/mindpulse_logo.png" alt="MindPulse" className="w-full h-full object-cover" />
              </div>
              <span className="font-serif text-xl font-bold text-white">
                Mind<span className="text-blue-400">Pulse</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              A clinically-validated mental health screening tool using PHQ-9 and GAD-7
              assessments, enhanced with AI-powered insights and explainability (SHAP/XAI).
            </p>
            <p className="text-xs text-slate-500 italic">
              "Predictive Care for a Healthier Mind"
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                HIPAA-aware design
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                M.Tech Research Project
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                Made in India
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href, external }: any) => (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {label}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="block text-sm text-slate-400 hover:text-white transition-colors py-0.5 cursor-pointer"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 
                flex flex-col sm:flex-row 
                items-center justify-center gap-3">   {/* ← changed to justify-center */}
    <p className="text-xs text-slate-500 text-center">
      © {year} MindPulse. Built for academic research purposes only.
    </p>
  </div>
</div>

    </footer>
  );
};

export default Footer;