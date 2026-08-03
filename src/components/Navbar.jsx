import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import LogoMark from './LogoMark';

/**
 * Top navigation bar with logo, search placeholder, and mobile menu toggle.
 */
export default function Navbar({ onMenuToggle }) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 rounded-none">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-glow"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <LogoMark
            size={28}
            className="shrink-0 drop-shadow-[0_0_10px_rgba(34,211,238,0.45)] group-hover:drop-shadow-[0_0_14px_rgba(52,211,153,0.55)] transition-glow"
          />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-neon-cyan text-glow-cyan">Ocean</span>
            <span className="text-neon-emerald text-glow-emerald">Tools</span>
          </span>
        </Link>

        {/* Search bar — desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg
                         text-sm text-slate-300 placeholder:text-slate-500
                         focus:outline-none focus:border-neon-cyan/50 focus:shadow-glow-cyan
                         transition-glow"
              readOnly
            />
          </div>
        </div>

        {/* Right spacer for mobile layout balance */}
        <div className="lg:hidden w-10" />
      </div>

      {/* Search bar — mobile */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search tools..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg
                       text-sm text-slate-300 placeholder:text-slate-500
                       focus:outline-none focus:border-neon-cyan/50 transition-glow"
            readOnly
          />
        </div>
      </div>
    </header>
  );
}
