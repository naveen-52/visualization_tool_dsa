import React, { useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Network, 
  GitBranch, 
  Binary, 
  Zap, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { AppPage } from '../types';

interface LandingPageProps {
  onNavigate: (page: AppPage) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodes: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];
    const count = Math.min(35, Math.floor(width / 35));

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.18 * (1 - dist / 140)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const modules = [
    {
      id: 'graph-coloring' as AppPage,
      title: 'Graph Coloring',
      subtitle: 'Welsh-Powell & Greedy Index',
      description:
        'Compute chromatic numbers, render colored graphs, discover multiple valid coloring variations, and test manual coloring in real time.',
      icon: Network,
      color: 'from-blue-600 to-cyan-500',
      tag: 'Polynomial Time Heuristic',
    },
    {
      id: 'mst' as AppPage,
      title: 'Minimum Spanning Tree',
      subtitle: "Prim's & Kruskal's Algorithms",
      description:
        'Step through minimum weight tree generation with interactive play/pause controls, node status highlights, and total cost verification.',
      icon: GitBranch,
      color: 'from-emerald-600 to-teal-500',
      tag: 'Greedy Optimization',
    },
    {
      id: 'huffman' as AppPage,
      title: 'Huffman Coding Studio',
      subtitle: 'Lossless Data Compression',
      description:
        'Analyze character frequency trees, generate binary prefix code tables, inspect compression ratios, and test step-by-step bit decoding.',
      icon: Binary,
      color: 'from-indigo-600 to-purple-500',
      tag: 'Optimal Prefix Coding',
    },
  ];

  return (
    <div className="relative min-h-screen -m-6 md:-m-8 p-6 md:p-12 overflow-hidden">
      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-80" />

      {/* Decorative Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 pt-6 md:pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEC Computer Science Engineering Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Visualize Algorithms <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-200">
              With Interactive Precision
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A research and classroom-ready platform engineered for computer science students to visualize, experiment, and deeply understand complex graph theories and data compression.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('graph-coloring')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all hover:scale-[1.02]"
            >
              <span>Launch Graph Coloring</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => onNavigate(m.id)}
                className="group relative cursor-pointer p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-tr ${m.color} text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
                      {m.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{m.subtitle}</p>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                  <span>Open Simulation</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Capabilities Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 backdrop-blur-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center text-blue-400 mb-2">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Instant Python Computations</h4>
              <p className="text-xs text-slate-400">High performance NetworkX mathematical graph engines.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center text-emerald-400 mb-2">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Step-by-Step Traversal</h4>
              <p className="text-xs text-slate-400">Interactive animation controls with frame playback and edge inspection.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center text-purple-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Academic Validation</h4>
              <p className="text-xs text-slate-400">Real-time symmetric matrix verification and chromatic heuristics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
