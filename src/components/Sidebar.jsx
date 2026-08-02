import { NavLink } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { categories } from '../data/data';
import { iconMap } from '../utils/iconMap';

/**
 * Collapsible sidebar for quick category navigation.
 * On mobile it slides in as an overlay; on desktop it stays fixed.
 */
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          glass-panel border-r border-white/10 rounded-none
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:h-auto lg:min-h-[calc(100vh-57px)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Categories
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white transition-glow"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category links */}
        <nav className="p-3 space-y-1">
          {categories.map((category) => {
            const Icon = iconMap[category.icon];
            const isCyan = category.accent === 'cyan';

            return (
              <NavLink
                key={category.id}
                to={`/category/${category.id}`}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                   transition-glow group
                   ${
                     isActive
                       ? isCyan
                         ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                         : 'bg-neon-emerald/10 text-neon-emerald border border-neon-emerald/20'
                       : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                   }`
                }
              >
                {Icon && (
                  <Icon
                    size={18}
                    className="shrink-0 group-hover:scale-110 transition-transform"
                  />
                )}
                <span className="flex-1 truncate">{category.name}</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <p className="text-xs text-slate-500 text-center">
            {categories.length} categories · Free forever
          </p>
        </div>
      </aside>
    </>
  );
}
