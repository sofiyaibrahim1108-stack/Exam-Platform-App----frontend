import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion, AnimatePresence, useInView, useScroll, useSpring,
  useMotionValue, useTransform
} from "framer-motion";
import {
  Menu, X, ArrowRight, Sparkles, ShieldCheck, BrainCircuit, BarChart3,
  Clock, Users, CheckCircle2, ChevronDown, Star, Zap, Eye, FileText,
  Timer, TrendingUp, Award, Play, ArrowUpRight, Fingerprint,
  MessageSquareText, Layers, Lock, Globe, Database, BookOpen,
  GraduationCap, School, Building2, FlaskConical, Cpu, Wifi,
  Activity, Target, AlertTriangle, RotateCcw, MonitorCheck,
  LayoutDashboard, Bell, Lightbulb, Rocket,
  Mail, Check, ExternalLink,
  TrendingDown, Brain, Gauge, Microscope, Trophy
} from "lucide-react";

/* ─────────────────────────────── THEME CSS ───────────────────────────────── */
const THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --wine:    #8B1E3F;
    --wine2:   #B33A62;
    --wine3:   #6E1732;
    --gold:    #D4AF37;
    --gold2:   #E7C873;
    --ivory:   #F9F5F2;
    --ink:     #1F1F1F;
    --ink2:    #3D2830;
    --muted:   #666666;
    --border:  #F0D9E2;
  }

  .lp {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    background: #FFFCFA;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }
  .lp .font-display   { font-family: 'Bricolage Grotesque', sans-serif; }
  .lp .text-wine      { color: var(--wine); }
  .lp .text-gold      { color: var(--gold); }
  .lp .text-muted     { color: var(--muted); }

  /* Gradients */
  .lp .grad-wine  { background: linear-gradient(135deg, #B33A62 0%, #6E1732 100%); }
  .lp .grad-wine:hover { background: linear-gradient(135deg, #C44A72 0%, #8B1E3F 100%); }
  .lp .grad-gold  { background: linear-gradient(135deg, var(--gold) 0%, var(--gold2) 100%); }
  .lp .grad-text  {
    background: linear-gradient(135deg, #8B1E3F 0%, #B33A62 50%, #D4AF37 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .lp .grad-text-gold {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold2) 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }

  /* Glass styles */
  .lp .glass {
    background: rgba(255,252,250,0.85);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(240,217,226,0.65);
  }
  .lp .glass-dark {
    background: rgba(10,2,6,0.62);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.09);
  }
  .lp .glass-wine {
    background: rgba(139,30,63,0.07);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(139,30,63,0.18);
  }
  .lp .glass-gold {
    background: rgba(212,175,55,0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(212,175,55,0.28);
  }

  /* Shadows */
  .lp .shadow-soft  { box-shadow: 0 2px 4px rgba(139,30,63,0.04), 0 16px 40px -12px rgba(139,30,63,0.09); }
  .lp .shadow-glow  { box-shadow: 0 0 0 1px rgba(179,58,98,0.10), 0 16px 56px -8px rgba(110,23,50,0.28); }
  .lp .shadow-gold  { box-shadow: 0 8px 32px -8px rgba(212,175,55,0.5); }
  .lp .shadow-xl    { box-shadow: 0 32px 80px -20px rgba(139,30,63,0.20); }
  .lp .shadow-illus { box-shadow: 0 24px 80px -12px rgba(179,58,98,0.16), 0 0 0 1px rgba(249,245,242,0.7); }

  /* Patterns */
  .lp .grid-bg {
    background-image:
      linear-gradient(rgba(139,30,63,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,30,63,0.035) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .lp .dot-bg {
    background-image: radial-gradient(circle, rgba(139,30,63,0.09) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .lp .noise-overlay {
    background:
      radial-gradient(ellipse at 15% 20%, rgba(179,58,98,0.08), transparent 40%),
      radial-gradient(ellipse at 85% 10%, rgba(110,23,50,0.06), transparent 38%),
      radial-gradient(ellipse at 50% 95%, rgba(212,175,55,0.06), transparent 42%);
  }
  .lp .cursor-glow {
    background: radial-gradient(800px circle at var(--mx,50%) var(--my,50%), rgba(139,30,63,0.05), transparent 50%);
  }

  /* Animations */
  @keyframes float-slow { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(1deg); } }
  @keyframes float-rev  { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(14px) rotate(-1deg); } }
  @keyframes blob       { 0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40%; } 50% { border-radius:30% 60% 70% 40%/50% 60% 30% 60%; } }
  @keyframes shimmer    { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.2); opacity: 0; } }
  @keyframes ticker     { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  @keyframes aurora     { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }

  .lp .float-a { animation: float-slow 6s ease-in-out infinite; }
  .lp .float-b { animation: float-rev 5.5s ease-in-out infinite; }
  .lp .float-c { animation: float-slow 7s ease-in-out infinite 1s; }
  .lp .float-d { animation: float-rev 4.8s ease-in-out infinite 0.5s; }
  .lp .blob { animation: blob 8s ease-in-out infinite; }
  .lp .ticker-track { animation: ticker 32s linear infinite; }
  .lp .ticker-track:hover { animation-play-state: paused; }

  .lp .shimmer-text {
    background: linear-gradient(90deg, #8B1E3F 0%, #B33A62 25%, #D4AF37 50%, #B33A62 75%, #8B1E3F 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; background-clip: text; color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .lp .glow-border { position: relative; }
  .lp .glow-border::before {
    content: '';
    position: absolute; inset: -1px;
    background: linear-gradient(135deg, #8B1E3F, #D4AF37, #8B1E3F);
    border-radius: inherit;
    z-index: -1; opacity: 0;
    transition: opacity 0.3s;
  }
  .lp .glow-border:hover::before { opacity: 1; }

  .lp .illus-tilt {
    transform-style: preserve-3d;
    transition: transform 0.5s ease, box-shadow 0.5s ease;
  }
  .lp .illus-tilt:hover {
    box-shadow: 0 40px 100px -16px rgba(139,30,63,0.24);
  }
  @keyframes particle-float {
    0%,100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
    33%      { transform: translateY(-14px) translateX(6px) scale(1.2); opacity: 1; }
    66%      { transform: translateY(-6px) translateX(-8px) scale(0.9); opacity: 0.7; }
  }
  .lp .hover-particle { animation: particle-float 3s ease-in-out infinite; }

  .lp .aurora { animation: aurora 6s ease-in-out infinite; }

  ::selection { background: rgba(139,30,63,0.14); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #FFFCFA; }
  ::-webkit-scrollbar-thumb { background: var(--wine); border-radius: 3px; }
`;

/* ─────────────────────────────── PRIMITIVES ──────────────────────────────── */
function useMouseParallax(strength = 20) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 80, damping: 20 });
  const springY = useSpring(y, { stiffness: 80, damping: 20 });
  const onMove = (e) => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    x.set(((e.clientX - cx) / cx) * strength);
    y.set(((e.clientY - cy) / cy) * strength);
  };
  return { springX, springY, onMove };
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      style={{ scaleX }}
      className="grad-wine fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left"
    />
  );
}

function Reveal({ children, delay = 0, y = 28, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ end, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      setValue(Math.floor(p * end));
      if (p < 1) requestAnimationFrame(step);
      else setValue(end);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

function MagneticBtn({ children, className = "", onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 350, damping: 22 });
  const sy = useSpring(y, { stiffness: 350, damping: 22 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.4);
    y.set((e.clientY - r.top - r.height / 2) * 0.4);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <Reveal className="flex justify-center mb-6">
      <Pill className="glass-wine text-wine border border-wine/20">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {children}
      </Pill>
    </Reveal>
  );
}

function SectionHeading({ children, subtitle, light = false }) {
  return (
    <Reveal className="text-center max-w-3xl mx-auto">
      <h2 className={`font-display text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] ${light ? "text-white" : "text-ink"}`}>
        {children}
      </h2>
      {subtitle && (
        <p className={`mt-5 text-[17px] leading-relaxed ${light ? "text-white/60" : "text-muted"}`}>
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}

/* ─────────────────────────────── NAVBAR ──────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = ["Features", "How It Works", "Security", "Analytics", "Pricing"];

  return (
    <div className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-4"}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className={`flex items-center justify-between px-5 rounded-2xl transition-all duration-500 ${scrolled ? "glass shadow-soft h-14" : "h-16"}`}>
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="grad-wine h-9 w-9 rounded-xl flex items-center justify-center shadow-glow">
              <BrainCircuit className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-ink">
              Examora <span className="text-wine">AI</span>
            </span>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <a key={l} href="#" className="relative rounded-xl px-3.5 py-2 text-sm font-medium text-ink/65 hover:text-wine transition-colors group">
                <span className="relative z-10">{l}</span>
                <span className="absolute inset-0 bg-wine/5 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-200 origin-center" />
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <motion.button whileHover={{ y: -1 }} onClick={() => navigate("/login")}
              className="h-10 px-5 text-sm font-semibold text-ink/70 hover:text-wine rounded-xl transition-colors">
              Sign In
            </motion.button>
            <MagneticBtn onClick={() => navigate("/register")}
              className="h-10 px-6 text-sm font-bold text-white grad-wine rounded-full shadow-glow flex items-center gap-2 hover:shadow-[0_12px_40px_-8px_rgba(107,15,26,0.55)] transition-shadow">
              Get Started <ArrowRight className="h-4 w-4" />
            </MagneticBtn>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-xl hover:bg-wine/5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={open ? "x" : "m"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden overflow-hidden">
              <div className="glass mt-2 rounded-2xl p-4 shadow-soft space-y-1">
                {links.map((l) => (
                  <a key={l} href="#" className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-wine/5 hover:text-wine transition-colors">{l}</a>
                ))}
                <div className="border-t border-black/5 pt-3 mt-2 flex gap-2">
                  <button onClick={() => navigate("/login")} className="flex-1 h-10 rounded-xl border border-wine/20 text-sm font-semibold text-wine">Sign In</button>
                  <button onClick={() => navigate("/register")} className="flex-1 h-10 grad-wine rounded-xl text-sm font-bold text-white">Get Started</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────── HERO ILLUSTRATION ──────────────────────────── */
function HeroIllustration({ springX, springY }) {
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);
  const shadowOpacity = useMotionValue(0.1);

  const springRotateX = useSpring(rotateX, { stiffness: 160, damping: 18 });
  const springRotateY = useSpring(rotateY, { stiffness: 160, damping: 18 });
  const springScale   = useSpring(scale,   { stiffness: 160, damping: 18 });

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    rotateY.set(((e.clientX - cx) / (rect.width  / 2)) * 8);
    rotateX.set(((cy - e.clientY) / (rect.height / 2)) * 6);
    scale.set(1.03);
    shadowOpacity.set(0.28);
  };
  const onMouseLeave = () => {
    rotateX.set(0); rotateY.set(0); scale.set(1); shadowOpacity.set(0.1);
  };

  const floatingBadges = [
    { label: "AI Brain",     icon: BrainCircuit, color: "from-[#8B1E3F] to-[#A33B5E]", delay: 0,   pos: "top-6 -right-6 lg:-right-12" },
    { label: "Exam Security",icon: ShieldCheck,   color: "from-emerald-500 to-emerald-700", delay: 0.5, pos: "top-1/3 -left-4 lg:-left-10" },
    { label: "Analytics",    icon: BarChart3,     color: "from-amber-500 to-amber-700",   delay: 1,   pos: "bottom-20 -right-4 lg:-right-10" },
    { label: "Question Bank",icon: Database,      color: "from-indigo-500 to-indigo-700", delay: 1.5, pos: "bottom-4 -left-2 lg:-left-8" },
  ];

  const hoverParticles = [
    { size: 8,  color: "#8B1E3F", x: "10%",  y: "15%",  dur: 2.8, del: 0 },
    { size: 6,  color: "#D6A85F", x: "85%",  y: "20%",  dur: 3.2, del: 0.4 },
    { size: 5,  color: "#B5476D", x: "15%",  y: "75%",  dur: 2.5, del: 0.8 },
    { size: 7,  color: "#8B1E3F", x: "80%",  y: "80%",  dur: 3.0, del: 0.2 },
    { size: 4,  color: "#D6A85F", x: "50%",  y: "5%",   dur: 2.7, del: 1.0 },
    { size: 5,  color: "#A33B5E", x: "5%",   y: "50%",  dur: 3.4, del: 0.6 },
  ];

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY, rotateX: springRotateX, rotateY: springRotateY, scale: springScale, transformStyle: "preserve-3d", perspective: 1000 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative cursor-pointer select-none"
    >
      {/* Glow ring behind illustration */}
      <div className="absolute inset-0 -z-10 rounded-3xl blur-2xl" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(163,59,94,0.18) 0%, transparent 70%)", transform: "scale(1.15)" }} />

      {/* Main Illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-visible"
      >
        <div
          className="relative rounded-[28px] overflow-hidden"
          style={{
            width: "clamp(320px, 44vw, 480px)",
            boxShadow: "0 28px 90px -16px rgba(139,30,63,0.20), 0 0 0 1.5px rgba(249,245,242,0.9), 0 0 60px -20px rgba(212,175,55,0.15)",
          }}
        >
          <img
            src="/hero-ai-illustration.png"
            alt="AI-powered online examination platform — student and AI assistant"
            className="w-full h-auto object-cover block"
            style={{ borderRadius: "28px", display: "block" }}
            draggable={false}
          />
          {/* Premium top-left light catch */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(145deg, rgba(255,252,250,0.18) 0%, transparent 45%)",
              borderRadius: "28px",
            }}
          />
          {/* Subtle golden bottom edge glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(212,175,55,0.08), transparent)",
              borderRadius: "0 0 28px 28px",
            }}
          />
        </div>

        {/* Floating Satellite Badges */}
        {floatingBadges.map(({ label, icon: Icon, color, delay, pos }) => (
          <motion.div
            key={label}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
            className={`absolute glass rounded-2xl px-3 py-2.5 flex items-center gap-2.5 z-10 ${pos}`}
            style={{ boxShadow: "0 8px 24px -4px rgba(139,30,63,0.12), 0 0 0 1px rgba(240,217,226,0.6)" }}
          >
            <div className={`bg-gradient-to-br ${color} h-7 w-7 rounded-lg flex items-center justify-center shrink-0`}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[11px] font-semibold text-[#1F1F1F] whitespace-nowrap">{label}</span>
          </motion.div>
        ))}

        {/* Hover Glow Particles */}
        {hoverParticles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none z-20"
            style={{ width: p.size, height: p.size, left: p.x, top: p.y, background: p.color, opacity: 0 }}
            animate={{ y: [0, -16, 0], x: [0, 5, 0], opacity: [0, 0.7, 0], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.del, ease: "easeInOut" }}
          />
        ))}

        {/* Bottom Stats Pill */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 glass rounded-full px-5 py-2.5 flex items-center gap-4 z-10"
          style={{ boxShadow: "0 8px 32px -4px rgba(139,30,63,0.15), 0 0 0 1px rgba(240,217,226,0.6)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-[#1F1F1F]">AI Proctoring Active</span>
          </div>
          <div className="h-3.5 w-px bg-[#F0D9E2]" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#8B1E3F]" />
            <span className="text-[11px] font-bold text-[#8B1E3F]">99.2% AI Accuracy</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────── HERO ───────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { springX, springY, onMove } = useMouseParallax(14);

  const onMouseMove = (e) => {
    onMove(e);
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };


  return (
    <section
      ref={heroRef}
      onMouseMove={onMouseMove}
      className="grid-bg noise-overlay cursor-glow relative overflow-hidden min-h-screen flex items-center pt-8 pb-24"
      style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #FFF9F8 50%, #FAF3F5 100%)" }}
    >
      {/* Animated Background Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob absolute -top-40 -left-40 h-[500px] w-[500px] opacity-20" style={{ background: "radial-gradient(circle, rgba(163,59,94,0.22) 0%, transparent 70%)" }} />
        <div className="blob absolute top-1/3 -right-32 h-[400px] w-[400px] opacity-15" style={{ background: "radial-gradient(circle, rgba(214,168,95,0.28) 0%, transparent 70%)", animationDelay: "3s" }} />
        <div className="blob absolute -bottom-32 left-1/3 h-[450px] w-[450px] opacity-12" style={{ background: "radial-gradient(circle, rgba(139,30,63,0.18) 0%, transparent 70%)", animationDelay: "1.5s" }} />
      </div>

      {/* Wine-colored floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { size: 4, left: "8%",  top: "20%", color: "#8B1E3F", dur: 5.2, del: 0 },
          { size: 3, left: "15%", top: "65%", color: "#D6A85F", dur: 4.8, del: 1 },
          { size: 5, left: "25%", top: "40%", color: "#B5476D", dur: 6.1, del: 0.5 },
          { size: 3, left: "38%", top: "12%", color: "#8B1E3F", dur: 4.4, del: 2 },
          { size: 4, left: "55%", top: "78%", color: "#D6A85F", dur: 5.8, del: 0.8 },
          { size: 6, left: "68%", top: "30%", color: "#A33B5E", dur: 7.0, del: 1.5 },
          { size: 3, left: "78%", top: "55%", color: "#8B1E3F", dur: 4.6, del: 0.3 },
          { size: 4, left: "88%", top: "18%", color: "#D6A85F", dur: 5.5, del: 2.2 },
          { size: 5, left: "92%", top: "72%", color: "#B5476D", dur: 6.3, del: 1.1 },
          { size: 3, left: "45%", top: "90%", color: "#8B1E3F", dur: 4.9, del: 0.7 },
          { size: 4, left: "32%", top: "85%", color: "#D6A85F", dur: 5.3, del: 1.8 },
          { size: 3, left: "72%", top: "8%",  color: "#A33B5E", dur: 6.7, del: 0.2 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: p.size, height: p.size, left: p.left, top: p.top, background: p.color, opacity: 0.35 }}
            animate={{ y: [0, -28, 0], x: [0, 6, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.del, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2.5 glass rounded-full px-4 py-2 shadow-soft mb-8">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-ink/70">AI-Powered Assessment Platform</span>
                <span className="grad-text text-xs font-bold">v2.0 Live</span>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.03] tracking-tight">
                Redefining{" "}
                <span className="shimmer-text">Higher Education</span>
                {" "}with AI-Powered Online Examinations
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-7 text-lg leading-relaxed text-muted max-w-lg">
                Generate exams with LLMs, evaluate answers at scale, monitor browser integrity in real-time, and publish results with one click — built for modern institutions.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <MagneticBtn
                  onClick={() => navigate("/register")}
                  className="h-13 px-7 grad-wine text-white font-bold rounded-full shadow-glow flex items-center gap-2.5 hover:shadow-[0_16px_56px_-8px_rgba(107,15,26,0.6)] transition-all text-base"
                >
                  Get Started Free <ArrowRight className="h-4.5 w-4.5" />
                </MagneticBtn>
                <motion.button
                  whileHover={{ y: -2 }}
                  className="h-13 px-7 border-2 border-wine/20 text-ink font-semibold rounded-full flex items-center gap-2.5 hover:border-wine/40 hover:bg-wine/4 transition-all text-base"
                >
                  <div className="w-8 h-8 grad-wine rounded-full flex items-center justify-center">
                    <Play className="h-3 w-3 text-white ml-0.5" />
                  </div>
                  Watch Demo
                </motion.button>
              </div>
            </Reveal>

            <Reveal delay={0.28}>
              <div className="mt-12 flex items-center gap-8">
                {[
                  { n: "100+", l: "Institutions" },
                  { n: "50K+", l: "Students" },
                  { n: "1M+", l: "Questions Evaluated" },
                ].map((b) => (
                  <div key={b.l}>
                    <p className="font-display text-2xl font-bold text-wine">{b.n}</p>
                    <p className="text-xs text-muted font-medium mt-0.5">{b.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right — Premium AI Illustration */}
          <Reveal delay={0.18} y={50} className="relative flex justify-center">
            <HeroIllustration springX={springX} springY={springY} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── TRUSTED BY ───────────────────────────────── */
function TrustedBy() {
  const orgs = [
    { name: "Oxford Global", icon: Building2 },
    { name: "MIT Digital Lab", icon: FlaskConical },
    { name: "VNR Institute", icon: School },
    { name: "Northgate Univ.", icon: GraduationCap },
    { name: "Skillbridge AI", icon: Cpu },
    { name: "Everest Academy", icon: Globe },
    { name: "DataTech College", icon: Database },
    { name: "Apex Research", icon: Microscope },
    { name: "CloudLearn Corp", icon: Wifi },
    { name: "InnovatEd Hub", icon: Lightbulb },
  ];
  const doubled = [...orgs, ...orgs];

  return (
    <section className="py-14 border-y border-wine/8 bg-ivory overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Trusted by leading institutions worldwide
        </p>
      </div>
      <div className="flex overflow-hidden">
        <div className="ticker-track flex gap-8 items-center w-max">
          {doubled.map(({ name, icon: Icon }, i) => (
            <div
              key={`${name}-${i}`}
              className="flex items-center gap-2.5 glass rounded-2xl px-5 py-3 shadow-soft shrink-0 group hover:shadow-glow transition-shadow cursor-default"
            >
              <Icon className="h-4 w-4 text-wine group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-ink/65 group-hover:text-wine transition-colors whitespace-nowrap">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── AI FEATURES BENTO ──────────────────────────── */
function AIFeaturesBento() {
  const features = [
    {
      icon: BrainCircuit, title: "AI Question Generator",
      desc: "Describe your syllabus and watch Gemini generate rigorous, Bloom's taxonomy-aligned questions in seconds — MCQ, descriptive, and case-study formats.",
      span: "lg:col-span-2 lg:row-span-2",
      preview: (
        <div className="mt-5 rounded-2xl bg-ivory p-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <MessageSquareText className="h-3.5 w-3.5 text-wine" />
            Prompt Input
          </div>
          <p className="text-xs text-ink/70 italic">"Generate 10 questions on Binary Search Trees, Mix MCQ and descriptive"</p>
          <div className="bg-white rounded-xl p-3 shadow-soft space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-wine shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink/65">Q1. Explain BST insertion with time complexity analysis...</p>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-wine shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink/65">Q2. What is the worst-case height of an unbalanced BST?</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">10 Generated</span>
            <span className="px-2 py-0.5 rounded-full bg-wine/10 text-wine text-[10px] font-bold">Bloom's Level 3</span>
          </div>
        </div>
      ),
    },
    {
      icon: Activity, title: "LLM Evaluation Engine",
      desc: "Grade subjective answers with nuance, not keywords. Our LLM understands paraphrasing, context, and partial credit at 99.2% accuracy.",
      span: "",
    },
    {
      icon: Database, title: "Intelligent Question Bank",
      desc: "Organize thousands of questions by subject, unit, difficulty, and Bloom's level with smart search and AI tagging.",
      span: "",
    },
    {
      icon: Target, title: "Bloom's Taxonomy Alignment",
      desc: "Automatically classify questions across all six cognitive levels — from Knowledge to Evaluation — ensuring balanced assessments.",
      span: "lg:col-span-2",
      preview: (
        <div className="mt-4 flex flex-wrap gap-2">
          {["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"].map((l, i) => (
            <span key={l} className="px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: `hsl(${340 - i * 20},${60 + i * 5}%,${90 - i * 5}%)`, color: `hsl(${340 - i * 20},80%,30%)` }}>
              {l}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: BarChart3, title: "Smart Performance Analytics",
      desc: "Real-time insights on class performance, question difficulty, and student progress with beautiful visual dashboards.",
      span: "",
    },
    {
      icon: Zap, title: "Automated Result Processing",
      desc: "Evaluate, grade, and publish results for thousands of students in minutes with zero manual intervention.",
      span: "",
    },
  ];

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionLabel icon={BrainCircuit}>AI Capabilities</SectionLabel>
        <SectionHeading subtitle="Six powerful AI features that transform every stage of the examination lifecycle.">
          Intelligence at every <span className="grad-text">exam stage</span>
        </SectionHeading>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(200px,auto)]">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07} className={f.span}>
              <motion.div
                whileHover={{ y: -6 }}
                className="glow-border group relative h-full overflow-hidden rounded-3xl border border-wine/8 bg-white p-7 shadow-soft hover:shadow-xl transition-all duration-300"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(300px circle at 20% 10%, rgba(139,30,63,0.05), transparent 60%)" }} />
                <div className="grad-wine h-11 w-11 rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                {f.preview}
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── HOW IT WORKS ───────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", icon: FileText, title: "Create Exam", desc: "Staff creates exam using AI Question Generator or Question Bank. Admin reviews and approves.", color: "from-wine to-wine2" },
    { n: "02", icon: CheckCircle2, title: "Admin Approves", desc: "Institution Admin reviews the exam, questions, and configuration before approval.", color: "from-indigo-500 to-indigo-700" },
    { n: "03", icon: Globe, title: "Publish & Schedule", desc: "Exam is published with scheduled start/end time. Students receive notifications automatically.", color: "from-emerald-500 to-emerald-700" },
    { n: "04", icon: GraduationCap, title: "Student Attempt", desc: "Student enters secure fullscreen mode. Browser security monitors every action in real-time.", color: "from-amber-500 to-orange-600" },
    { n: "05", icon: BrainCircuit, title: "AI Evaluation", desc: "Answers are graded instantly by our LLM engine with 99.2% accuracy. No manual effort needed.", color: "from-purple-500 to-purple-700" },
    { n: "06", icon: Award, title: "Results Published", desc: "Detailed scorecards, subject analytics, and AI insights are published for every student.", color: "from-gold to-gold2" },
  ];

  return (
    <section className="bg-ivory px-6 py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <SectionLabel icon={Rocket}>Workflow</SectionLabel>
        <SectionHeading subtitle="Six intelligent steps that take an exam from idea to published results — fully automated.">
          From creation to results in <span className="grad-text">minutes</span>
        </SectionHeading>

        <div className="mt-20 relative">
          {/* Connection Line Desktop */}
          <div className="absolute top-10 left-0 right-0 hidden lg:block">
            <div className="relative mx-8 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--wine), var(--gold), var(--wine), transparent)" }}>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0 origin-left"
                style={{ background: "inherit" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="group relative bg-white rounded-2xl p-5 shadow-soft border border-wine/6 hover:shadow-xl hover:border-wine/15 transition-all duration-300 text-center lg:text-left"
                >
                  {/* Step Number Badge */}
                  <div className="flex justify-center lg:justify-start mb-4">
                    <div className={`bg-gradient-to-br ${s.color} h-12 w-12 rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform`}>
                      <s.icon className="h-5.5 w-5.5 text-white" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-wine/50 uppercase tracking-widest">{s.n}</span>
                  <h3 className="mt-1 text-sm font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">{s.desc}</p>
                  {/* Animated Glow Dot on Hover */}
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-wine/0 group-hover:bg-wine/30 transition-colors" style={{ boxShadow: "0 0 8px 2px rgba(107,15,26,0.3)" }} />
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── PLATFORM MODULES ───────────────────────────── */
function PlatformModules() {
  const modules = [
    { icon: GraduationCap, title: "Student Portal", desc: "Upcoming exams, live exam interface, completed results, and AI performance insights.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", span: "lg:col-span-2" },
    { icon: School, title: "Staff Portal", desc: "AI question generator, question bank, syllabus analyzer, and exam creation tools.", color: "text-wine", bg: "bg-wine/5", border: "border-wine/20", span: "" },
    { icon: Building2, title: "Admin Portal", desc: "Full institution control — departments, courses, semesters, exams, results, and reports.", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", span: "" },
    { icon: Cpu, title: "Super Admin", desc: "Multi-institution management, system analytics, audit logs, and platform-wide oversight.", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", span: "" },
    { icon: BarChart3, title: "Live Analytics", desc: "Real-time dashboards with charts, performance trends, and subject-wise breakdowns.", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", span: "" },
    { icon: FileText, title: "Smart Reports", desc: "Automated report generation — student scorecards, department reports, and export to PDF.", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", span: "" },
    { icon: ShieldCheck, title: "Security Layer", desc: "Fullscreen lock, tab detection, violation tracking, session management, and device control.", color: "text-wine", bg: "bg-wine/5", border: "border-wine/20", span: "lg:col-span-2" },
    { icon: Bell, title: "Notifications", desc: "Role-based notification system for exams, approvals, results, and system announcements.", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", span: "" },
  ];

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionLabel icon={LayoutDashboard}>Platform Modules</SectionLabel>
        <SectionHeading subtitle="Every role, every workflow — covered by a purpose-built module with beautiful UI and real data.">
          One platform, <span className="grad-text">eight modules</span>
        </SectionHeading>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(160px,auto)]">
          {modules.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.07} className={m.span}>
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                className={`group h-full rounded-3xl border ${m.border} bg-white p-7 shadow-soft hover:shadow-xl transition-all duration-300`}
              >
                <div className={`${m.bg} ${m.border} border h-11 w-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <h3 className="text-base font-bold text-ink">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.desc}</p>
                <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${m.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Explore module <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── SECURITY ────────────────────────────────── */
function Security() {
  const features = [
    { icon: MonitorCheck, title: "Fullscreen Lock", desc: "Exam can only be taken in enforced fullscreen mode. Exit triggers violation." },
    { icon: Eye, title: "Browser Monitoring", desc: "Every browser action is monitored and logged with timestamps for audit." },
    { icon: AlertTriangle, title: "Tab Switch Detection", desc: "Any attempt to switch tabs or windows is instantly detected and recorded." },
    { icon: Lock, title: "Single Active Session", desc: "Only one device session allowed per exam attempt. Prevents multi-device cheating." },
    { icon: RotateCcw, title: "Auto Save & Resume", desc: "Answers are auto-saved every 30 seconds. Lost connection? Resume seamlessly." },
    { icon: ShieldCheck, title: "Violation Tracking", desc: "Every security violation is logged with severity levels for post-exam review." },
  ];

  return (
    <section className="relative px-6 py-28 overflow-hidden">
      {/* Dark Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0205] via-[#1A0510] to-[#0A0205]" />

      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(107,15,26,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(107,15,26,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full aurora opacity-30"
        style={{ background: "radial-gradient(circle, rgba(107,15,26,0.5) 0%, transparent 70%)" }} />

      <div className="relative mx-auto max-w-7xl">
        <SectionLabel icon={ShieldCheck}>
          <span className="text-white/80">Security Architecture</span>
        </SectionLabel>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight">
              Exam integrity you can <span className="grad-text-gold">count on</span>
            </h2>
            <p className="mt-5 text-lg text-white/55 leading-relaxed">
              Military-grade browser security ensures every exam session is monitored, tamper-proof, and auditable.
            </p>
          </Reveal>
        </div>

        {/* Shield + Cards Layout */}
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-4">
            {features.slice(0, 3).map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ x: 6 }}
                  className="glass-dark rounded-2xl p-5 border border-white/6 hover:border-wine/40 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="grad-wine h-9 w-9 rounded-lg flex items-center justify-center shrink-0 group-hover:shadow-glow transition-shadow">
                      <f.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{f.title}</h4>
                      <p className="text-[12px] text-white/50 mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Center — 3D Shield Illustration */}
          <Reveal delay={0.2} className="flex justify-center">
            <motion.div
              animate={{ y: [0, -16, 0], rotateY: [0, 5, 0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(107,15,26,0.3) 0%, transparent 70%)", transform: "scale(1.4)" }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border border-wine/30"
                />
              </div>

              <div className="relative grad-wine h-52 w-52 rounded-[40%] flex flex-col items-center justify-center shadow-xl" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                <ShieldCheck className="h-20 w-20 text-white/90" />
              </div>

              {/* Pulse Rings */}
              {[1, 2, 3].map((r) => (
                <motion.div
                  key={r}
                  className="absolute inset-0 rounded-[40%] border border-wine/20"
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                  animate={{ scale: 1 + r * 0.2, opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: r * 0.5 }}
                />
              ))}

              {/* Status Badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 shadow-soft flex items-center gap-2 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-ink">Security Active</span>
              </div>
            </motion.div>
          </Reveal>

          {/* Right Column */}
          <div className="space-y-4">
            {features.slice(3).map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1 + 0.2}>
                <motion.div
                  whileHover={{ x: -6 }}
                  className="glass-dark rounded-2xl p-5 border border-white/6 hover:border-wine/40 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="grad-wine h-9 w-9 rounded-lg flex items-center justify-center shrink-0 group-hover:shadow-glow transition-shadow">
                      <f.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{f.title}</h4>
                      <p className="text-[12px] text-white/50 mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── LIVE ANALYTICS ─────────────────────────────── */
function LiveAnalytics() {
  const bars = [55, 75, 45, 88, 62, 94, 70, 85, 58, 91];

  return (
    <section className="px-6 py-28 bg-ivory">
      <div className="mx-auto max-w-7xl">
        <SectionLabel icon={BarChart3}>Analytics Engine</SectionLabel>
        <SectionHeading subtitle="Real-time dashboards give administrators and educators instant visibility into performance across every dimension.">
          Data that tells the <span className="grad-text">whole story</span>
        </SectionHeading>

        <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
          {/* Analytics Dashboard Preview */}
          <Reveal delay={0.1} className="order-2 lg:order-1">
            <div className="grad-wine rounded-[28px] p-1 shadow-xl">
              <div className="rounded-[24px] bg-[#08020A] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-white/50">Live Exam Analytics</p>
                  <span className="flex items-center gap-1.5 bg-emerald-500/15 rounded-full px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-300">Updating Live</span>
                  </span>
                </div>

                {/* Bar Chart */}
                <div className="bg-white/[0.05] rounded-2xl p-4">
                  <p className="text-[11px] text-white/40 mb-3">Score Distribution</p>
                  <div className="flex items-end gap-1.5 h-28">
                    {bars.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.08, duration: 0.7, ease: "easeOut" }}
                        className="flex-1 rounded-t-md"
                        style={{ background: `linear-gradient(180deg, ${i % 3 === 0 ? "var(--gold)" : "var(--wine3)"}, var(--wine))` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 mb-1">Pass Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="relative h-14 w-14">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                          <motion.circle
                            cx="18" cy="18" r="14"
                            fill="none" stroke="var(--gold)" strokeWidth="3"
                            strokeDasharray="88 100"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0 100" }}
                            whileInView={{ strokeDasharray: "88 100" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[12px] font-bold text-white">88%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">88%</p>
                        <p className="text-[10px] text-white/40">Pass Rate</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 mb-1">Top Subject</p>
                    <p className="text-sm font-bold text-white">Data Structures</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400 font-semibold">+12% vs last sem</span>
                    </div>
                  </div>
                </div>

                {/* Line Sparkline */}
                <div className="bg-white/[0.05] rounded-2xl p-4">
                  <p className="text-[11px] text-white/40 mb-3">Monthly Submission Trend</p>
                  <svg className="w-full" height="60" viewBox="0 0 300 60">
                    <defs>
                      <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C8A95A" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#C8A95A" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M0 50 L30 38 L60 44 L90 25 L120 32 L150 18 L180 28 L210 12 L240 20 L270 8 L300 14"
                      fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round"
                      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                    <motion.path
                      d="M0 50 L30 38 L60 44 L90 25 L120 32 L150 18 L180 28 L210 12 L240 20 L270 8 L300 14 L300 60 L0 60Z"
                      fill="url(#areaG)"
                      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Feature List */}
          <div className="order-1 lg:order-2 space-y-5">
            {[
              { icon: Activity, title: "Real-time Score Distribution", desc: "Watch scores populate in real-time as students submit. Interactive bar charts with hover details." },
              { icon: TrendingUp, title: "Subject-wise Performance Trends", desc: "Compare performance across all subjects, units, and topics with multi-period trend analysis." },
              { icon: Users, title: "Student Ranking & Comparison", desc: "Rank students by score, time taken, and accuracy. Identify top performers and students needing support." },
              { icon: Globe, title: "Institution-wide Reports", desc: "Department heads get bird's eye view of academic performance across all courses and semesters." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="group flex gap-5 p-5 rounded-2xl border border-wine/8 bg-white hover:border-wine/20 hover:shadow-soft transition-all"
                >
                  <div className="grad-wine h-10 w-10 shrink-0 rounded-xl flex items-center justify-center group-hover:shadow-glow transition-shadow">
                    <item.icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink text-sm">{item.title}</h4>
                    <p className="text-[13px] text-muted leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── AI INSIGHTS ──────────────────────────────── */
function AIInsights() {
  const cards = [
    {
      icon: TrendingDown, title: "Weak Subject Detection",
      desc: "AI identifies subjects where a student consistently underperforms and flags them for targeted intervention.",
      badge: "Personalized", color: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      icon: Trophy, title: "Strongest Subject",
      desc: "Recognize and celebrate each student's strongest areas with AI-generated strengths analysis and recommendations.",
      badge: "Motivational", color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      icon: Brain, title: "Performance Prediction",
      desc: "Using historical exam data, our AI predicts likely performance in future assessments with 87% accuracy.",
      badge: "Predictive", color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      icon: Lightbulb, title: "Learning Recommendations",
      desc: "Subject-specific study recommendations are generated for each student based on their unique error patterns.",
      badge: "Actionable", color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      icon: Gauge, title: "Student Analytics",
      desc: "360° student performance view including accuracy rate, time efficiency, Bloom's level mastery, and comparison metrics.",
      badge: "Comprehensive", color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionLabel icon={Sparkles}>AI Intelligence</SectionLabel>
        <SectionHeading subtitle="Our AI doesn't just grade — it understands, predicts, and guides every student's learning journey.">
          Insights that <span className="grad-text">matter most</span>
        </SectionHeading>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.09} className={i === 4 ? "md:col-span-2 lg:col-span-1" : ""}>
              <motion.div
                whileHover={{ y: -8 }}
                className="group h-full rounded-3xl border border-wine/8 bg-white p-7 shadow-soft hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="grad-wine h-11 w-11 rounded-xl flex items-center justify-center group-hover:shadow-glow transition-shadow group-hover:scale-110 transform duration-300">
                    <c.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${c.color}`}>{c.badge}</span>
                </div>
                <h3 className="text-base font-bold text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── WHY CHOOSE US ─────────────────────────────── */
function WhyUs() {
  const reasons = [
    { icon: Sparkles, title: "99.2% AI Accuracy", desc: "Our LLM evaluation engine matches human expert graders in blind tests.", highlight: true },
    { icon: ShieldCheck, title: "Enterprise Security", desc: "SOC 2-aligned infrastructure with end-to-end encryption and audit trails." },
    { icon: Zap, title: "Lightning Fast", desc: "Grade 10,000 submissions in under 5 minutes. No waiting. No delays." },
    { icon: Globe, title: "Cloud Native", desc: "99.9% uptime SLA with global CDN. Scales to 100K concurrent students." },
    { icon: BrainCircuit, title: "AI-First Design", desc: "Every workflow is supercharged by AI — from authoring to evaluation to insights." },
    { icon: TrendingUp, title: "Infinitely Scalable", desc: "From 50 students to 500,000 — the platform scales seamlessly with your institution." },
  ];

  return (
    <section className="bg-ivory px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionLabel icon={Trophy}>Why Examora AI</SectionLabel>
        <SectionHeading subtitle="Built by educators, powered by AI, trusted by institutions that demand excellence.">
          The platform that <span className="grad-text">never compromises</span>
        </SectionHeading>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.09}>
              <motion.div
                whileHover={{ y: -6 }}
                className={`group h-full rounded-3xl p-7 shadow-soft transition-all duration-300 ${r.highlight
                  ? "grad-wine text-white"
                  : "bg-white border border-wine/8 hover:border-wine/20 hover:shadow-xl"}`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${r.highlight ? "bg-white/15" : "grad-wine"}`}>
                  <r.icon className={`h-5.5 w-5.5 ${r.highlight ? "text-white" : "text-white"}`} />
                </div>
                <h3 className={`text-lg font-bold ${r.highlight ? "text-white" : "text-ink"}`}>{r.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${r.highlight ? "text-white/70" : "text-muted"}`}>{r.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── STATS STRIP ───────────────────────────────── */
function StatsStrip() {
  const stats = [
    { end: 500, suffix: "+", label: "Institutions Onboarded" },
    { end: 50, suffix: "K+", label: "Active Students" },
    { end: 1, suffix: "M+", label: "Questions Evaluated" },
    { end: 99, suffix: ".9%", label: "Platform Uptime" },
    { end: 87, suffix: "%", label: "Grading Time Saved" },
  ];

  return (
    <section className="px-6 py-20 border-y border-wine/8">
      <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-5 gap-8">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="text-center">
            <p className="font-display text-4xl lg:text-5xl font-bold grad-text">
              <CountUp end={s.end} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-muted font-medium">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── TESTIMONIALS ───────────────────────────────── */
function Testimonials() {
  const items = [
    { name: "Mr. Balaganesh Krishnamoorthy", role: "Dean of Academics, VNR Institute", quote: "Examora AI cut our grading turnaround from a week to under an hour, without sacrificing academic rigor. The AI insights are genuinely impressive.", stars: 5 },
    { name: "Mohammed Ishak", role: "Head of Assessments, Skillbridge", quote: "The proctoring finally feels non-invasive yet effective. It catches real integrity issues without making honest students feel surveilled.", stars: 5 },
    { name: "Mr. Mohammed Yashin", role: "CTO, Northgate University", quote: "LMS integration took an afternoon. The real-time analytics alone justified the switch. Our faculty saves 15+ hours per exam cycle.", stars: 5 },
    { name: "Dr. Priya Venkataraman", role: "Principal, Everest College", quote: "The Bloom's Taxonomy alignment feature is exceptional. We finally have assurance that our exams test higher-order thinking, not just recall.", stars: 5 },
    { name: "Prof. Arjun Mehta", role: "HoD Computer Science, Apex Institute", quote: "Student performance insights have transformed how we identify struggling students early. The AI is like having a teaching assistant for every student.", stars: 5 },
    { name: "Ms. Sarah Chen", role: "EdTech Lead, DataTech College", quote: "The single active session and browser lock system completely eliminated exam malpractice. Results improved because students actually prepared.", stars: 5 },
  ];

  const doubled = [...items, ...items];

  return (
    <section className="px-6 py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <SectionLabel icon={Star}>Testimonials</SectionLabel>
        <SectionHeading subtitle="Hear from educators and administrators who have transformed their institutions with Examora AI.">
          Loved by <span className="grad-text">educators everywhere</span>
        </SectionHeading>
      </div>

      <div className="mt-16 flex overflow-hidden gap-6">
        <div className="ticker-track flex gap-6 items-stretch w-max">
          {doubled.map((t, i) => (
            <motion.div
              key={`${t.name}-${i}`}
              whileHover={{ y: -6 }}
              className="glass rounded-3xl p-7 shadow-soft border border-wine/8 hover:border-wine/20 hover:shadow-xl transition-all w-80 shrink-0 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 text-gold fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-ink/75 flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-wine/8">
                <div className="grad-wine h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{t.name}</p>
                  <p className="text-[11px] text-muted">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────── FAQ ──────────────────────────────────── */
function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    { q: "How accurate is the AI grading engine?", a: "Our LLM-powered evaluation engine is benchmarked against expert human graders and consistently achieves 99.2% agreement on rubric-based subjective answers across multiple subject domains." },
    { q: "Can we import our existing question bank?", a: "Yes. Import questions via CSV, Word documents, or our REST API. The AI automatically enriches imports with difficulty tagging, Bloom's taxonomy classification, and distractor quality scoring." },
    { q: "How does the browser security work?", a: "Our multi-layer browser security enforces fullscreen mode, detects tab switches, monitors focus events, logs all violations with timestamps, and provides a single-active-session guarantee per exam attempt." },
    { q: "Is student data private and compliant?", a: "All data is encrypted in transit and at rest using AES-256. We maintain SOC 2-aligned infrastructure with regional data residency options and full audit trail capabilities." },
    { q: "Does it integrate with existing LMS platforms?", a: "We support native integrations via LTI 1.3 with major LMS platforms including Canvas, Moodle, and Blackboard, plus a comprehensive REST API for custom institutional setups." },
    { q: "How long does it take to set up for an institution?", a: "Most institutions are fully operational within 48 hours. Our onboarding team handles data migration, user provisioning, and staff training as part of the enterprise package." },
    { q: "Can staff generate exams without AI knowledge?", a: "Absolutely. The AI Question Generator uses simple natural language prompts. Staff just describe their topic and requirements — the AI handles all the technical complexity of question generation." },
  ];

  return (
    <section className="px-6 py-28 bg-ivory">
      <div className="mx-auto max-w-3xl">
        <SectionLabel icon={MessageSquareText}>FAQ</SectionLabel>
        <SectionHeading subtitle="Everything you need to know about the platform.">
          Questions, <span className="grad-text">answered</span>
        </SectionHeading>

        <div className="mt-14 space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className={`overflow-hidden rounded-2xl border bg-white shadow-soft transition-all duration-300 ${openIdx === i ? "border-wine/30 shadow-soft" : "border-wine/8"}`}>
                <button
                  onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left group"
                >
                  <span className={`text-sm font-semibold transition-colors ${openIdx === i ? "text-wine" : "text-ink group-hover:text-wine"}`}>{f.q}</span>
                  <motion.div
                    animate={{ rotate: openIdx === i ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className={`shrink-0 ml-4 ${openIdx === i ? "text-wine" : "text-muted"}`}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted border-t border-wine/6 pt-4">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── CTA ────────────────────────────────────── */
function CTA() {
  const navigate = useNavigate();

  return (
    <section className="px-6 pb-28 pt-8">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px]">
          {/* Background */}
          <div className="absolute inset-0 grad-wine" />
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.2), transparent 50%), radial-gradient(ellipse at 75% 75%, rgba(200,169,90,0.3), transparent 50%)" }} />
          <div className="absolute inset-0 grid-bg opacity-10" />

          {/* Floating Orbs */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, rgba(200,169,90,0.6), transparent 70%)" }} />

          {/* Content */}
          <div className="relative px-8 py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Transform Your Institution</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl lg:text-6xl font-bold text-white leading-[1.05] mb-6"
            >
              Transform Your Institution<br />with AI-Powered Exams
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 }}
              className="text-lg text-white/65 max-w-xl mx-auto mb-12"
            >
              Join 500+ institutions already running smarter, fairer, and faster assessments with Examora AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.26 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <MagneticBtn
                onClick={() => navigate("/register")}
                className="h-13 px-8 bg-white text-wine font-bold rounded-full shadow-gold flex items-center gap-2.5 hover:shadow-[0_16px_48px_-8px_rgba(200,169,90,0.6)] transition-all text-base"
              >
                Get Started Free <ArrowRight className="h-4.5 w-4.5" />
              </MagneticBtn>
              <motion.button
                whileHover={{ y: -2 }}
                className="h-13 px-8 border-2 border-white/25 text-white font-semibold rounded-full flex items-center gap-2 hover:bg-white/10 transition-all text-base"
              >
                Book a Demo
              </motion.button>
            </motion.div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/50 text-xs font-medium">
              {["No credit card required", "Setup in 48 hours", "SOC 2 Aligned", "99.9% Uptime SLA"].map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-gold" /> {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ──────────────────────────────── FOOTER ────────────────────────────────── */
function Footer() {
  const navigate = useNavigate();
  const cols = [
    { title: "Product", links: ["AI Question Generator", "LLM Evaluation", "Browser Security", "Live Analytics", "Smart Reports"] },
    { title: "Platform", links: ["Student Portal", "Staff Portal", "Admin Portal", "Super Admin", "Notifications"] },
    { title: "Resources", links: ["Documentation", "API Reference", "Developer Guide", "System Status", "Changelog"] },
    { title: "Company", links: ["About Us", "Careers", "Blog", "Press Kit", "Contact"] },
  ];

  return (
    <footer className="border-t border-wine/8 px-6 pt-20 pb-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5 cursor-pointer" onClick={() => navigate("/")}>
              <div className="grad-wine h-9 w-9 rounded-xl flex items-center justify-center shadow-glow">
                <BrainCircuit className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-ink">Examora <span className="text-wine">AI</span></span>
            </div>
            <p className="text-sm leading-relaxed text-muted max-w-xs mb-6">
              The intelligent assessment platform for higher education institutions that take academic integrity seriously.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-semibold text-ink mb-3">Stay updated</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@university.edu"
                  className="flex-1 h-10 px-4 rounded-xl border border-wine/15 text-sm focus:outline-none focus:border-wine/40 text-ink placeholder:text-muted/60 bg-white"
                />
                <button className="h-10 px-4 grad-wine rounded-xl text-white text-sm font-semibold hover:shadow-glow transition-shadow">
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              {[
                { label: "X", href: "#", svg: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.254 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { label: "LinkedIn", href: "#", svg: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { label: "GitHub", href: "#", svg: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg> },
                { label: "YouTube", href: "#", svg: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
              ].map((s) => (
                <motion.a key={s.label} href={s.href} aria-label={s.label} whileHover={{ y: -2 }}
                  className="h-9 w-9 rounded-xl border border-wine/15 flex items-center justify-center text-muted hover:text-wine hover:border-wine/35 transition-colors">
                  {s.svg}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-bold text-ink mb-4">{c.title}</p>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted hover:text-wine transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-wine/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">© 2026 Examora AI. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-muted">
            <a href="#" className="hover:text-wine transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-wine transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-wine transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────── MAIN EXPORT ───────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="lp">
      <style>{THEME}</style>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <TrustedBy />
      <AIFeaturesBento />
      <HowItWorks />
      <PlatformModules />
      <Security />
      <LiveAnalytics />
      <AIInsights />
      <WhyUs />
      <StatsStrip />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}