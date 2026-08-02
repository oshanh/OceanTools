import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ArrowRight } from 'lucide-react';

/**
 * Reusable card for displaying a tool category on the Home page.
 * Features glassmorphism, gradient border on hover, and accent glow.
 */
export default function CategoryCard({ category }) {
  const Icon = LucideIcons[category.icon];
  const isCyan = category.accent === 'cyan';

  const glowClass = isCyan
    ? 'hover:shadow-glow-cyan hover:border-neon-cyan/30'
    : 'hover:shadow-glow-emerald hover:border-neon-emerald/30';

  const iconColor = isCyan ? 'text-neon-cyan' : 'text-neon-emerald';
  const badgeColor = isCyan
    ? 'bg-neon-cyan/10 text-neon-cyan'
    : 'bg-neon-emerald/10 text-neon-emerald';

  return (
    <Link
      to={`/category/${category.id}`}
      className={`
        gradient-border glass-panel p-6 block
        transition-glow hover:-translate-y-1
        ${glowClass}
      `}
    >
      {/* Icon + tool count badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg bg-white/5 ${iconColor}`}
        >
          {Icon && <Icon size={24} />}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor}`}>
          {category.toolCount} tools
        </span>
      </div>

      {/* Category info */}
      <h3 className="text-lg font-semibold text-slate-100 mb-2">
        {category.name}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-4">
        {category.description}
      </p>

      {/* CTA link */}
      <span
        className={`inline-flex items-center gap-1 text-sm font-medium ${iconColor} group`}
      >
        Browse tools
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}
