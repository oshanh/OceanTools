import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { categories, getPopularTools } from '../data/data';
import CategoryCard from '../components/CategoryCard';
import ToolCard from '../components/ToolCard';
import LogoMark from '../components/LogoMark';

/**
 * Home page — hero section + category grid + popular tools.
 */
export default function Home() {
  const popularTools = getPopularTools();

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl glass-panel hero-neon-panel p-8 md:p-12 lg:p-16">
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-cyan/20 rounded-full blur-3xl pointer-events-none animate-neon-cyan" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-neon-emerald/20 rounded-full blur-3xl pointer-events-none animate-neon-emerald" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm neon-badge">
            <Zap size={14} />
            <span>100% Free · No Sign-up Required</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            <span className="text-neon-cyan text-glow-cyan">Ocean</span>
            <span className="text-neon-emerald text-glow-emerald">Tools</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-8">
            Your free online toolkit for developers, designers, and creators.
            Format, convert, generate, and optimize — all in your browser.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="#categories"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                         bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30
                         hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow neon-btn-cyan"
            >
              Explore Tools
              <ArrowRight size={18} />
            </a>
            <Link
              to="/category/developer-tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                         bg-white/5 text-slate-300 font-medium border border-white/10
                         hover:bg-white/10 hover:border-white/20 transition-glow neon-btn-muted"
            >
              <LogoMark size={18} className="shrink-0" />
              Developer Tools
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular Tools ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            Popular Tools
          </h2>
          <span className="text-sm text-slate-500">
            Most used this week
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── Category Grid ────────────────────────────────────── */}
      <section id="categories">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            All Categories
          </h2>
          <p className="text-slate-400">
            Browse {categories.length} categories with{' '}
            {categories.reduce((sum, c) => sum + c.toolCount, 0)} free tools
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
