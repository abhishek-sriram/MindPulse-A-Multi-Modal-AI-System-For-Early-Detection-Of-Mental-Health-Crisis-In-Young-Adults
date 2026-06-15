import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, History, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, clearUser } from "@/lib/user-session";

const NAV_LINKS = [
  { label: "Home",     href: "/" },
  { label: "Features", href: "/features" },
  { label: "About",    href: "/about" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const user      = getUser();
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark]         = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200/60 dark:border-slate-700/60"
            : "bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-b border-slate-200/30 dark:border-slate-700/30"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* ── Logo: dark bg wrapper makes JPEG logo visible on light navbar bg ── */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-14 w-14 rounded-xl bg-white overflow-hidden shadow-md flex-shrink-0
                              border border-slate-200 group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/mindpulse_logo.png"
                  alt="MindPulse logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-serif text-[1.35rem] font-bold text-slate-800 dark:text-white tracking-tight">
                Mind<span className="text-blue-600 dark:text-blue-400">Pulse</span>
              </span>
            </Link>

            {/* ── Desktop nav links ── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  to={href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(href)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {label}
                  {isActive(href) && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-lg -z-10"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* ── Desktop actions ── */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {user ? (
                <>
                  <Link to="/history">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <History className="h-4 w-4" /> History
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[100px] truncate">
                      {user.name.split(" ")[0]}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Log In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                      Sign Up Free
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile controls ── */}
            <div className="flex md:hidden items-center gap-2">
              <button onClick={toggleDark} className="p-2 rounded-lg text-slate-500" aria-label="Toggle theme">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setOpen((o) => !o)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-20 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/history" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50">
                    <History className="h-4 w-4" /> History
                  </Link>
                  <Link to="/assessment" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50">
                    Take Assessment
                  </Link>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <Link to="/login"><Button variant="outline" className="w-full">Log In</Button></Link>
                  <Link to="/signup"><Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Sign Up Free</Button></Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
};

export default Navbar;