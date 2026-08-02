import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getCategoryById, getToolsByCategory } from '../data/data';
import ToolCard from '../components/ToolCard';

/**
 * Category page — displays all tools within a selected category.
 */
export default function Category() {
  const { categoryId } = useParams();
  const category = getCategoryById(categoryId);
  const categoryTools = getToolsByCategory(categoryId);

  // Redirect to home if category doesn't exist
  if (!category) {
    return <Navigate to="/" replace />;
  }

  const Icon = LucideIcons[category.icon];
  const isCyan = category.accent === 'cyan';
  const accentColor = isCyan ? 'text-neon-cyan' : 'text-neon-emerald';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-slate-400
                   hover:text-neon-cyan transition-glow"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      {/* Category header */}
      <div className="glass-panel p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-xl bg-white/5 ${accentColor}`}>
            {Icon && <Icon size={32} />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {category.name}
            </h1>
            <p className="text-slate-400 leading-relaxed max-w-2xl">
              {category.description}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {categoryTools.length} tool{categoryTools.length !== 1 ? 's' : ''}{' '}
              available
            </p>
          </div>
        </div>
      </div>

      {/* Tools grid */}
      {categoryTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center">
          <p className="text-slate-400">
            No tools available in this category yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
