import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Star } from 'lucide-react';

/**
 * Reusable card for displaying an individual tool.
 * Used on Category pages and the Home page popular tools section.
 */
export default function ToolCard({ tool }) {
  const Icon = LucideIcons[tool.icon];

  return (
    <Link
      to={`/tool/${tool.id}`}
      className="
        gradient-border glass-panel p-5 block
        transition-glow hover:-translate-y-1
        hover:shadow-glow-cyan hover:border-neon-cyan/30
      "
    >
      <div className="flex items-start gap-4">
        {/* Tool icon */}
        <div className="p-2.5 rounded-lg bg-neon-cyan/10 text-neon-cyan shrink-0">
          {Icon && <Icon size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + popular badge */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-slate-100 truncate">
              {tool.name}
            </h3>
            {tool.popular && (
              <Star
                size={14}
                className="text-neon-emerald fill-neon-emerald shrink-0"
              />
            )}
          </div>

          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
