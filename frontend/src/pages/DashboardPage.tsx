import React, { useState, useEffect } from 'react';
import { 
  Network, 
  GitBranch, 
  Binary, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Play,
  RefreshCw
} from 'lucide-react';
import { AppPage, DashboardStats, ActivityItem } from '../types';
import { fetchDashboardStats } from '../api/client';

interface DashboardPageProps {
  onNavigate: (page: AppPage) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    total_graphs: 24,
    algorithms_used: 3,
    sessions: 58,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDashboardStats();
    setStats(data.stats);
    setActivity(data.recent_activity);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const algoCards = [
    {
      id: 'graph-coloring' as AppPage,
      title: 'Graph Coloring Engine',
      algo: 'Welsh-Powell Greedy',
      description: 'Find minimal chromatic number, resolve adjacency conflicts, and experiment with vertex & edge coloring.',
      icon: Network,
      color: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      stats: 'Chromatic Number: χ(G)',
      features: ['Automatic Vertex Coloring', 'Greedy Edge Coloring', 'Manual Coloring Playground'],
    },
    {
      id: 'mst' as AppPage,
      title: 'Minimum Spanning Tree',
      algo: "Prim's & Kruskal's",
      description: 'Discover optimal connected subgraphs without cycles using weighted undirected graphs with visual step animations.',
      icon: GitBranch,
      color: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      stats: 'Time Complexity: O(E log V)',
      features: ['Step-by-Step Traversal', 'Current Node Highlighting', 'Edge Cost Breakdown'],
    },
    {
      id: 'huffman' as AppPage,
      title: 'Huffman Data Compression',
      algo: 'Greedy Binary Tree',
      description: 'Lossless data compression via frequency prefix trees, bitstream generator, and step-by-step bit decoding.',
      icon: Binary,
      color: 'from-purple-600 to-pink-600',
      shadow: 'shadow-purple-500/20',
      stats: 'Entropy & Compression Ratio',
      features: ['Live Frequency Counter', 'Binary Tree Visualization', 'Bitstream Interactive Decoder'],
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Simulator Dashboard</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Explore & Verify Discrete Algorithms
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Select an algorithm below to configure matrices, visualize topological structures, and step through mathematical proofs in real-time.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Graphs Created</span>
            <div className="text-3xl font-black text-white">{stats.total_graphs}</div>
            <span className="text-[11px] text-blue-400 font-medium">Session repository</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Network className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Core Algorithms</span>
            <div className="text-3xl font-black text-emerald-400">{stats.algorithms_used}</div>
            <span className="text-[11px] text-emerald-400 font-medium">Welsh-Powell, Prim, Huffman</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Simulation Runs</span>
            <div className="text-3xl font-black text-purple-400">{stats.sessions}</div>
            <span className="text-[11px] text-purple-400 font-medium">Interactive executions</span>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Algorithm Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Algorithm Workspaces</h3>
            <p className="text-xs text-slate-400">Launch a dedicated visualizer module</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {algoCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-lg ${card.shadow}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                      {card.stats}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {card.title}
                    </h4>
                    <span className="text-xs font-medium text-blue-400/90">{card.algo}</span>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                    {card.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80">
                  <button
                    onClick={() => onNavigate(card.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Visualizer</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recent Executions</h4>
          </div>
          <span className="text-xs text-slate-500">Auto-recorded from active sessions</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {activity.map((act) => (
            <div key={act.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="font-medium text-slate-200">{act.title}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium">
                  {act.module}
                </span>
              </div>
              <span className="text-slate-500">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
