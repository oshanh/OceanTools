import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import { categories, tools } from '../data/data';
import { iconMap } from '../utils/iconMap';

/**
 * Collapsible sidebar for quick category & tool navigation.
 * Categories act as accordions to reveal tools.
 */
export default function Sidebar({ isOpen, onClose }) {
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const toggleCategory = (categoryId) => {
    setExpanded((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

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
          fixed lg:static inset-y-0 left-0 z-50 h-full w-64
          glass-panel border-r border-white/10 rounded-none overflow-y-auto custom-scrollbar
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b border-white/10 bg-ocean-950/90 backdrop-blur-md">
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
            const isExpanded = expanded[category.id];

            // Highlight if we are on this category's page, OR if we are inside a tool that belongs to this category.
            const isCategoryActive = location.pathname === `/category/${category.id}`;
            const categoryTools = tools.filter(t => t.categoryId === category.id);
            const isToolActive = categoryTools.some(t => location.pathname === `/tool/${t.id}`);
            const isActive = isCategoryActive || isToolActive;

            return (
              <div key={category.id} className="mb-0.5">
                {/* Category button */}
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer
                   transition-glow group
                   ${isActive
                      ? isCyan
                        ? 'bg-neon-cyan/5 text-neon-cyan border border-neon-cyan/10'
                        : 'bg-neon-emerald/5 text-neon-emerald border border-neon-emerald/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div
                    className="flex items-center gap-3 flex-1 overflow-hidden"
                    onClick={() => {
                      navigate(`/category/${category.id}`);
                      if (!isExpanded) toggleCategory(category.id); // auto-expand if navigating
                      // Close sidebar on mobile
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    {Icon && (
                      <Icon
                        size={18}
                        className="shrink-0 group-hover:scale-110 transition-transform"
                      />
                    )}
                    <span className="flex-1 truncate">{category.name}</span>
                  </div>

                  {/* Chevron to expand tools */}
                  <div
                    className="p-1 px-1.5 -mr-1.5 hover:bg-white/10 rounded ml-1 transition-colors flex shrink-0 items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.id);
                    }}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 opacity-60 group-hover:opacity-100 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                    />
                  </div>
                </div>

                {/* Sub-tools list */}
                <div
                  className={`grid transition-all duration-200 ease-in-out ${isExpanded ? 'grid-rows-[1fr] mt-1' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden space-y-0.5 ml-2 border-l border-white/10 pl-2">
                    {categoryTools.map(tool => {
                      const ToolIcon = iconMap[tool.icon] || Hash;
                      return (
                        <NavLink
                          key={tool.id}
                          to={`/tool/${tool.id}`}
                          onClick={onClose}
                          className={({ isActive: toolIsActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs
                                         transition-glow group/tool border border-transparent
                                         ${toolIsActive
                              ? isCyan
                                ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20'
                                : 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/20'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 hover:border-white/10'
                            }`
                          }
                        >
                          <ToolIcon size={12} className="shrink-0 opacity-70 group-hover/tool:opacity-100" />
                          <span className="truncate">{tool.name}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
