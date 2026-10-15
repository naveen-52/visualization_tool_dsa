import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Play, 
  Palette, 
  Shuffle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers, 
  Sparkles,
  Check
} from 'lucide-react';
import { 
  apiGenerateGraph, 
  apiColorGraph, 
  apiEdgeColorGraph, 
  apiAllColorings, 
  apiValidateManual 
} from '../api/client';
import { 
  GraphGenerateResponse, 
  GraphColoringResponse, 
  EdgeColoringResponse, 
  AllColoringsResponse 
} from '../types';

const COLOR_PALETTE = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Lime', hex: '#84cc16' },
];

export const GraphColoringPage: React.FC = () => {
  const [numVertices, setNumVertices] = useState(5);
  const [matrix, setMatrix] = useState<number[][]>([]);
  
  // Results
  const [baseGraph, setBaseGraph] = useState<GraphGenerateResponse | null>(null);
  const [vertexResult, setVertexResult] = useState<GraphColoringResponse | null>(null);
  const [edgeResult, setEdgeResult] = useState<EdgeColoringResponse | null>(null);
  const [allCombinations, setAllCombinations] = useState<AllColoringsResponse | null>(null);
  
  // Manual coloring state
  const [manualColors, setManualColors] = useState<Record<string, string>>({});
  const [selectedPaletteColor, setSelectedPaletteColor] = useState(COLOR_PALETTE[0].hex);
  const [manualValidation, setManualValidation] = useState<{ valid?: boolean; conflicts?: any[]; message?: string } | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vertex' | 'edge' | 'all' | 'manual'>('vertex');

  // Initialize matrix
  useEffect(() => {
    initPreset('cycle', numVertices);
  }, [numVertices]);

  const initPreset = (type: 'cycle' | 'complete' | 'star' | 'random' | 'empty', n: number) => {
    const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    if (type === 'cycle') {
      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        m[i][next] = 1;
        m[next][i] = 1;
      }
    } else if (type === 'complete') {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          m[i][j] = 1;
          m[j][i] = 1;
        }
      }
    } else if (type === 'star') {
      for (let i = 1; i < n; i++) {
        m[0][i] = 1;
        m[i][0] = 1;
      }
    } else if (type === 'random') {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (Math.random() > 0.55) {
            m[i][j] = 1;
            m[j][i] = 1;
          }
        }
      }
      // Ensure at least one edge
      if (n > 1) {
        m[0][1] = 1;
        m[1][0] = 1;
      }
    }

    setMatrix(m);
    setBaseGraph(null);
    setVertexResult(null);
    setEdgeResult(null);
    setAllCombinations(null);
    setManualColors({});
    setManualValidation(null);
  };

  const toggleMatrixCell = (i: number, j: number) => {
    if (i === j) return; // No self loops
    const updated = matrix.map((row) => [...row]);
    const newVal = updated[i][j] === 1 ? 0 : 1;
    updated[i][j] = newVal;
    updated[j][i] = newVal; // Maintain symmetry
    setMatrix(updated);
    setBaseGraph(null);
    setVertexResult(null);
    setEdgeResult(null);
    setAllCombinations(null);
    setManualValidation(null);
  };

  const handleGenerateGraph = async () => {
    setLoading(true);
    setVertexResult(null);
    setEdgeResult(null);
    setAllCombinations(null);
    try {
      const res = await apiGenerateGraph(numVertices, matrix);
      setBaseGraph(res);
      // Auto run Welsh-Powell
      const vRes = await apiColorGraph(matrix);
      setVertexResult(vRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunVertexColoring = async () => {
    setActiveTab('vertex');
    if (vertexResult) return;
    setLoading(true);
    try {
      const res = await apiColorGraph(matrix);
      setVertexResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEdgeColoring = async () => {
    setActiveTab('edge');
    if (edgeResult) return;
    setLoading(true);
    try {
      const res = await apiEdgeColorGraph(matrix);
      setEdgeResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllColorings = async () => {
    setActiveTab('all');
    if (allCombinations) return;
    setLoading(true);
    try {
      const res = await apiAllColorings(matrix);
      setAllCombinations(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignNodeColor = (nodeIdx: number) => {
    setManualColors((prev) => ({
      ...prev,
      [nodeIdx.toString()]: selectedPaletteColor,
    }));
    setManualValidation(null);
  };

  const handleValidateManualColoring = async () => {
    setLoading(true);
    try {
      const res = await apiValidateManual(matrix, manualColors);
      setManualValidation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNodeLabel = (i: number) => {
    return numVertices <= 26 ? String.fromCharCode(65 + i) : (i + 1).toString();
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>Graph Theory & Heuristics</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Graph Coloring Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Welsh-Powell vertex coloring, greedy edge coloring, and interactive conflict testing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => initPreset('cycle', numVertices)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Cycle
          </button>
          <button
            onClick={() => initPreset('complete', numVertices)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Complete
          </button>
          <button
            onClick={() => initPreset('star', numVertices)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Star
          </button>
          <button
            onClick={() => initPreset('random', numVertices)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random</span>
          </button>
        </div>
      </div>

      {/* Configuration Grid & Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Matrix Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Vertices Count (V)</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={numVertices}
                  onChange={(e) => setNumVertices(parseInt(e.target.value))}
                  className="w-24 accent-blue-600 cursor-pointer"
                />
                <span className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center">
                  {numVertices}
                </span>
              </div>
            </div>

            {/* Matrix View */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Adjacency Matrix (Click to toggle edge)
                </span>
                <span className="text-[11px] text-slate-500">Symmetric $A = A^T$</span>
              </div>

              <div className="overflow-x-auto p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr>
                      <th className="p-1 text-slate-500"></th>
                      {Array.from({ length: numVertices }).map((_, colIdx) => (
                        <th key={colIdx} className="p-1 font-bold text-blue-400">
                          {getNodeLabel(colIdx)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-1 font-bold text-blue-400">{getNodeLabel(i)}</td>
                        {row.map((val, j) => {
                          const isSelf = i === j;
                          const hasEdge = val === 1;
                          return (
                            <td key={j} className="p-0.5">
                              <button
                                disabled={isSelf}
                                onClick={() => toggleMatrixCell(i, j)}
                                className={`w-7 h-7 rounded-md font-mono text-xs font-semibold transition-all ${
                                  isSelf
                                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                    : hasEdge
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                              >
                                {val}
                              </button>
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
              onClick={handleGenerateGraph}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Graph...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Visualize & Color Graph</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Visualization & Coloring Tabs */}
        <div className="lg:col-span-7 space-y-6">
          {baseGraph?.graph_url || vertexResult?.graph_url ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
                <button
                  onClick={handleRunVertexColoring}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                    activeTab === 'vertex'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Welsh-Powell Vertex</span>
                </button>

                <button
                  onClick={handleRunEdgeColoring}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                    activeTab === 'edge'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Edge Coloring</span>
                </button>

                <button
                  onClick={handleRunAllColorings}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Colorings</span>
                </button>

                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                    activeTab === 'manual'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Manual Coloring</span>
                </button>
              </div>

              {/* Tab 1: Welsh-Powell Vertex Coloring */}
              {activeTab === 'vertex' && (
                <div className="space-y-4">
                  {vertexResult && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div>
                        <span className="text-xs text-blue-300 uppercase tracking-wider font-semibold">
                          Chromatic Number $\chi(G)$
                        </span>
                        <div className="text-2xl font-black text-white">
                          {vertexResult.chromatic_number} Colors Required
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total Valid Colorings</span>
                        <div className="text-lg font-bold text-blue-400">
                          {vertexResult.truncated ? '5000+' : vertexResult.total_colorings}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center p-4 bg-white rounded-2xl shadow-inner min-h-[360px]">
                    <img
                      src={vertexResult?.graph_url || baseGraph?.graph_url}
                      alt="Graph Coloring Visualization"
                      className="max-h-[380px] object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Edge Coloring */}
              {activeTab === 'edge' && (
                <div className="space-y-4">
                  {edgeResult && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <div>
                        <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">
                          Chromatic Index $\chi'(G)$
                        </span>
                        <div className="text-2xl font-black text-white">
                          {edgeResult.chromatic_index} Colors for Edges
                        </div>
                      </div>
                      <span className="text-xs text-indigo-400 font-medium bg-indigo-500/20 px-3 py-1 rounded-full">
                        Greedy Line Graph Coloring
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-center p-4 bg-white rounded-2xl shadow-inner min-h-[360px]">
                    {edgeResult?.graph_url ? (
                      <img
                        src={edgeResult.graph_url}
                        alt="Edge Coloring Visualization"
                        className="max-h-[380px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-xs">Computing edge colors...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: All Colorings Combinations */}
              {activeTab === 'all' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400">
                    Displaying distinct minimal coloring permutations calculated using randomized heuristics:
                  </div>

                  {allCombinations?.combinations && allCombinations.combinations.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                      {allCombinations.combinations.map((comb, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white rounded-xl shadow border border-slate-200 flex flex-col items-center"
                        >
                          <img
                            src={comb.image}
                            alt={`Coloring combination ${idx + 1}`}
                            className="w-full object-contain rounded"
                          />
                          <span className="text-[10px] font-bold text-slate-700 mt-1">
                            Variation #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                      <span className="text-xs">Generating permutation graph suite...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Interactive Manual Coloring */}
              {activeTab === 'manual' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      1. Select a Palette Color:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setSelectedPaletteColor(c.hex)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                            selectedPaletteColor === c.hex ? 'scale-125 ring-2 ring-white shadow-lg' : ''
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {selectedPaletteColor === c.hex && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      2. Click Nodes to Apply Color:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {Array.from({ length: numVertices }).map((_, i) => {
                        const assigned = manualColors[i.toString()];
                        return (
                          <button
                            key={i}
                            onClick={() => handleAssignNodeColor(i)}
                            className="p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-2 transition-transform hover:scale-105"
                            style={{ backgroundColor: assigned ? `${assigned}22` : '#1e293b' }}
                          >
                            <span
                              className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center text-white shadow"
                              style={{ backgroundColor: assigned || '#475569' }}
                            >
                              {getNodeLabel(i)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {assigned ? 'Colored' : 'Unset'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {manualValidation && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                        manualValidation.valid
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {manualValidation.valid ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      )}
                      <span>{manualValidation.message}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleValidateManualColoring}
                      disabled={loading || Object.keys(manualColors).length === 0}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                    >
                      Validate Coloring Conflicts
                    </button>
                    <button
                      onClick={() => {
                        setManualColors({});
                        setManualValidation(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[380px] rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/80 text-blue-400">
                <Network className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">No Graph Generated Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Adjust the vertex count or toggle edges in the matrix, then click "Visualize & Color Graph" to start.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
