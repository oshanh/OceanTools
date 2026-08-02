import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

/**
 * Shared layout wrapper for individual tool pages — breadcrumbs, header, content slot.
 */
export default function ToolShell({ tool, category, children }) {
  const Icon = LucideIcons[tool.icon];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
        <Link to="/" className="hover:text-neon-cyan transition-glow">
          Home
        </Link>
        <span>/</span>
        {category && (
          <>
            <Link
              to={`/category/${category.id}`}
              className="hover:text-neon-cyan transition-glow"
            >
              {category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-300">{tool.name}</span>
      </div>

      {/* Tool header */}
      <div className="glass-panel p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-neon-cyan/10 text-neon-cyan shrink-0">
            {Icon && <Icon size={28} />}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
              {tool.name}
            </h1>
            <p className="text-slate-400 mt-1">{tool.description}</p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
