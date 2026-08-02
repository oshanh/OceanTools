import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getToolById, getCategoryById } from '../data/data';

/**
 * Tool page — placeholder for the actual tool interface.
 * Will be replaced with real tool implementations later.
 */
export default function Tool() {
  const { toolId } = useParams();
  const tool = getToolById(toolId);

  if (!tool) {
    return <Navigate to="/" replace />;
  }

  const category = getCategoryById(tool.categoryId);
  const Icon = LucideIcons[tool.icon];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
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
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-neon-cyan/10 text-neon-cyan">
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

      {/* Placeholder workspace */}
      <div className="glass-panel p-12 md:p-16 text-center">
        <Construction
          size={48}
          className="mx-auto text-neon-emerald mb-4 animate-float"
        />
        <h2 className="text-xl font-semibold text-slate-200 mb-2">
          Coming Soon
        </h2>
        <p className="text-slate-400 max-w-md mx-auto mb-6">
          The {tool.name} interface is under development. This placeholder
          confirms routing and layout are working correctly.
        </p>
        <Link
          to={`/category/${tool.categoryId}`}
          className="inline-flex items-center gap-2 text-sm text-neon-cyan
                     hover:text-neon-cyan/80 transition-glow"
        >
          <ArrowLeft size={16} />
          Back to {category?.name ?? 'Category'}
        </Link>
      </div>
    </div>
  );
}
