import { Suspense } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Construction, Loader2 } from 'lucide-react';
import { getToolById, getCategoryById } from '../data/data';
import { toolRegistry } from '../tools/registry';
import ToolShell from '../components/tools/ToolShell';

/**
 * Tool page router — renders the registered tool component or a placeholder.
 */
export default function Tool() {
  const { toolId } = useParams();
  const tool = getToolById(toolId);

  if (!tool) {
    return <Navigate to="/" replace />;
  }

  const category = getCategoryById(tool.categoryId);
  const ToolComponent = toolRegistry[toolId];

  // Implemented tool
  if (ToolComponent) {
    return (
      <ToolShell tool={tool} category={category}>
        <Suspense
          fallback={
            <div className="glass-panel p-12 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-neon-cyan" />
              <p className="text-sm">Loading tool…</p>
            </div>
          }
        >
          <ToolComponent />
        </Suspense>
      </ToolShell>
    );
  }

  // Placeholder for tools not yet built
  return (
    <ToolShell tool={tool} category={category}>
      <div className="glass-panel p-12 md:p-16 text-center">
        <Construction
          size={48}
          className="mx-auto text-neon-emerald mb-4 animate-float"
        />
        <h2 className="text-xl font-semibold text-slate-200 mb-2">
          Coming Soon
        </h2>
        <p className="text-slate-400 max-w-md mx-auto mb-6">
          The {tool.name} interface is under development.
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
    </ToolShell>
  );
}
