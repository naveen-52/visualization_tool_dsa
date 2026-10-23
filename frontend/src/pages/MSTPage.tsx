import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { apiRunMST } from '../api/client';
import { MSTRunResponse, MSTStep } from '../types';

export const MSTPage: React.FC = () => {
  const [numVertices, setNumVertices] = useState(4);
  const [algorithm, setAlgorithm] = useState<'prim' | 'kruskal'>('prim');
  const [matrix, setMatrix] = useState<number[][]>([]);
  
  // Results & Player
  const [result, setResult] = useState<MSTRunResponse | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // ms
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const timerRef = useRef<any>(null);

  // Initialize weighted matrix
  useEffect(() => {
    initPreset('sample', numVertices);
  }, [numVertices]);

  const initPreset = (type: 'sample' | 'complete' | 'ring', n: number) => {
    const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    if (type === 'sample') {
      // Connect consecutive nodes with varying weights
      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        const w = (i + 1) * 2;
        m[i][next] = w;
        m[next][i] = w;
      }
      // Add diagonal edge if n >= 4
      if (n >= 4) {
        m[0][2] = 5;
        m[2][0] = 5;
      }
    } else if (type === 'complete') {
      let weight = 1;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          m[i][j] = weight;
          m[j][i] = weight;
          weight += 2;
        }
      }
    }

    setMatrix(m);
    setResult(null);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const handleCellChange = (i: number, j: number, valStr: string) => {
    if (i === j) return;
    const val = parseInt(valStr) || 0;
    const updated = matrix.map((row) => [...row]);
    updated[i][j] = val;
    updated[j][i] = val; // Symmetric
    setMatrix(updated);
    setResult(null);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const handleRunMST = async () => {
    setLoading(true);
    setIsPlaying(false);
    try {
      const res = await apiRunMST(numVertices, matrix, algorithm);
      setResult(res);
      setCurrentStepIdx(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Playback timer
  useEffect(() => {
    if (isPlaying && result?.steps && result.steps.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= result.steps!.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, result, playbackSpeed]);

  const activeStep: MSTStep | null =
    result?.steps && result.steps[currentStepIdx] ? result.steps[currentStepIdx] : null;

  const getNodeLabel = (i: number) => {
    return i.toString();
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GitBranch className="w-4 h-4" />
            <span>Spanning Tree Optimization</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Minimum Spanning Tree Visualizer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Step through Prim's and Kruskal's greedy edge selection with real-time graph updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setAlgorithm('prim')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                algorithm === 'prim'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Prim's
            </button>
            <button
              onClick={() => setAlgorithm('kruskal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                algorithm === 'kruskal'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kruskal's
            </button>
          </div>

          <button
            onClick={() => initPreset('sample', numVertices)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Reset Preset
          </button>
        </div>
      </div>

      {/* Grid: Left = Matrix input; Right = Stepper Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Weight Matrix */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Vertex Count (V)</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={numVertices}
                  onChange={(e) => setNumVertices(parseInt(e.target.value))}
                  className="w-24 accent-emerald-500 cursor-pointer"
                />
                <span className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  {numVertices}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Weight Matrix (0 = No Edge)
                </span>
                <span className="text-[11px] text-slate-500">Undirected Weights</span>
              </div>

              <div className="overflow-x-auto p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr>
                      <th className="p-1 text-slate-500"></th>
                      {Array.from({ length: numVertices }).map((_, j) => (
                        <th key={j} className="p-1 font-bold text-emerald-400">
                          {getNodeLabel(j)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-1 font-bold text-emerald-400">{getNodeLabel(i)}</td>
                        {row.map((val, j) => {
                          const isSelf = i === j;
                          return (
                            <td key={j} className="p-0.5">
                              <input
                                type="number"
                                disabled={isSelf}
                                min="0"
                                max="99"
                                value={isSelf ? '0' : val}
                                onChange={(e) => handleCellChange(i, j, e.target.value)}
                                className={`w-8 h-7 text-center rounded-md font-mono text-xs font-semibold transition-all ${
                                  isSelf
                                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed border-transparent'
                                    : val > 0
                                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                                }`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={handleRunMST}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Spanning Tree...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute {algorithm === 'prim' ? "Prim's" : "Kruskal's"} MST</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Step Player & Graph Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          {result && activeStep ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
              {/* Stepper Header Metrics */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <span className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">
                    Step {currentStepIdx + 1} of {result.total_steps}
                  </span>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    Accumulated Cost: <span className="text-emerald-400">{activeStep.cost_so_far}</span>
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      (Total Final Weight: {result.total_weight})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Current Node Focus</span>
                  <div className="text-sm font-bold text-rose-400">
                    {activeStep.current !== null && activeStep.current !== undefined
                      ? `Node ${getNodeLabel(activeStep.current)}`
                      : 'Initial'}
                  </div>
                </div>
              </div>

              {/* Graph Image Display & Interactive Zoom Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Graph Visualization Canvas</span>
                  <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, parseFloat((z - 0.15).toFixed(2))))}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1.0)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                      title="Reset Zoom (100%)"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(2.5, parseFloat((z + 0.15).toFixed(2))))}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => (z === 1.0 ? 1.4 : 1.0))}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title={zoomLevel === 1.0 ? "Fit / Expand" : "Reset"}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative overflow-auto max-h-[540px] min-h-[380px] p-4 bg-white rounded-2xl shadow-inner flex items-center justify-center border border-slate-700/30">
                  <img
                    src={activeStep.image_url}
                    alt={`MST Step ${currentStepIdx + 1}`}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out'
                    }}
                    className="max-h-[500px] w-auto object-contain rounded-lg select-none"
                  />
                </div>
              </div>

              {/* Playback Controls Bar */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIdx(0);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    title="Rewind to Step 1"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentStepIdx === 0}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIdx((prev) => Math.max(0, prev - 1));
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    title="Previous Step"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
                  </button>
                  <button
                    disabled={currentStepIdx >= (result.steps?.length || 1) - 1}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIdx((prev) => Math.min((result.steps?.length || 1) - 1, prev + 1));
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    title="Next Step"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Speed:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
                  >
                    <option value={2000}>0.5x (Slow)</option>
                    <option value={1200}>1.0x (Normal)</option>
                    <option value={600}>2.0x (Fast)</option>
                  </select>
                </div>
              </div>

              {/* Edge Tree Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Edges in Minimum Spanning Tree So Far:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeStep.edges.length > 0 ? (
                    activeStep.edges.map(([u, v, w], idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5"
                      >
                        <span>({getNodeLabel(u)}, {getNodeLabel(v)})</span>
                        <span className="text-emerald-400/80">• W: {w}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Root vertex chosen; no edges added yet.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/80 text-emerald-400">
                <GitBranch className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">MST Animation Ready</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Enter weights between vertices in the matrix and click "Execute MST" to inspect the step-by-step tree assembly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
