import React from 'react';
import { 
  Home, 
  LayoutDashboard, 
  Network, 
  GitBranch, 
  Binary, 
  Info, 
  Mail, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AppPage } from '../../types';

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onOpenContact: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenContact,
  collapsed,
}) => {
  const navItems = [
    { id: 'landing' as AppPage, label: 'Overview', icon: Home, badge: 'Home' },
    { id: 'dashboard' as AppPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'graph-coloring' as AppPage, label: 'Graph Coloring', icon: Network, badge: 'Welsh-Powell' },
    { id: 'mst' as AppPage, label: 'MST Visualizer', icon: GitBranch, badge: "Prim / Kruskal" },
    { id: 'huffman' as AppPage, label: 'Huffman Coding', icon: Binary, badge: 'Compress' },
    { id: 'about' as AppPage, label: 'About Project', icon: Info },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col transition-all duration-300 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25 shrink-0 text-white font-bold tracking-wider">
          <Sparkles className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
              NEC AlgoViz
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Interactive Algorithms
            </span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•' : 'Modules & Views'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
              
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                      isActive ? 'bg-blue-500/40 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Contact Button */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onOpenContact}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Contact Administrators"
        >
          <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1">
              <span>Feedback & Help</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
