import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Code2, 
  Lightbulb, 
  Network, 
  GitBranch, 
  Binary
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>National Engineering College • CSE Department</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          About NEC AlgoViz
        </h2>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An interactive, academic platform built to demystify complex discrete mathematics, graph coloring heuristics, spanning trees, and entropy-optimal compression.
        </p>
      </div>

      {/* Vision & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Visual Intuition</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Move past static textbook diagrams into responsive graphs where vertex colors and spanning edges evolve step by step.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Rigorous Validation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every adjacency and weight matrix undergoes mathematical validation to guarantee accurate graph topologies and cycle detection.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Production Stack</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Engineered with a high performance Python / NetworkX computational backend coupled with a modern React + Tailwind SPA.
          </p>
        </div>
      </div>

      {/* Algorithms Detailed Guide */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-400" />
          <span>Core Algorithms Analyzed</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
              <Network className="w-4 h-4" />
              <span>Welsh-Powell Vertex Coloring</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Greedy coloring heuristic based on descending degree ordering. Computes the upper bound for the chromatic number $\chi(G)$ and identifies non-adjacent vertex clusters.
            </p>
            <div className="text-[11px] text-slate-500">Complexity: $O(V^2 + E)$</div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <GitBranch className="w-4 h-4" />
              <span>Prim's & Kruskal's MST</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Greedy algorithms that find minimum spanning trees in connected, weighted graphs. Connects all vertices with minimum cumulative edge weights without forming cycles.
            </p>
            <div className="text-[11px] text-slate-500">Complexity: $O(E \log V)$</div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
              <Binary className="w-4 h-4" />
              <span>Huffman Coding</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Entropy encoding algorithm for lossless data compression. Generates variable-length prefix-free codes assigned according to individual character frequency distributions.
            </p>
            <div className="text-[11px] text-slate-500">Complexity: $O(N \log N)$</div>
          </div>
        </div>
      </div>

      {/* Institution & Credits */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950/30 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-xl">
            NEC
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Department of Computer Science and Engineering</h4>
            <p className="text-xs text-slate-400">National Engineering College (Autonomous), K.R. Nagar, Kovilpatti</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 text-right">
          <span>Project Administration: </span>
          <span className="text-blue-400 font-semibold">24205005@nec.edu.in</span>
        </div>
      </div>
    </div>
  );
};
