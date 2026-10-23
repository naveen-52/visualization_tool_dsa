import React from 'react';
import { 
  Menu, 
  Github,
  Mail
} from 'lucide-react';
import { AppPage } from '../../types';

interface HeaderProps {
  currentPage: AppPage;
  onToggleSidebar: () => void;
  onOpenContact: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onToggleSidebar,
  onOpenContact,
}) => {
  const getPageTitle = (page: AppPage) => {
    switch (page) {
      case 'landing': return 'Welcome to NEC AlgoViz';
      case 'dashboard': return 'Analytics & Algorithm Hub';
      case 'graph-coloring': return 'Graph Coloring (Welsh-Powell)';
      case 'mst': return 'Minimum Spanning Tree Visualizer';
      case 'huffman': return 'Huffman Coding Studio';
      case 'about': return 'About NEC AlgoViz Platform';
      default: return 'NEC AlgoViz Pro';
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between">
      {/* Left controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            {getPageTitle(currentPage)}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Python Engine Ready
        </div>

        <button
          onClick={onOpenContact}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <Mail className="w-3.5 h-3.5 text-blue-400" />
          <span>Support</span>
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Source Code"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
};
