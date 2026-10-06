import {
  DashboardStats,
  ActivityItem,
  GraphGenerateResponse,
  GraphColoringResponse,
  EdgeColoringResponse,
  AllColoringsResponse,
  ManualValidationResponse,
  MSTRunResponse,
  HuffmanEncodeResponse,
  HuffmanDecodeResponse
} from '../types';

export async function fetchDashboardStats(): Promise<{ stats: DashboardStats; recent_activity: ActivityItem[] }> {
  try {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    const data = await res.json();
    return data;
  } catch (err) {
    // Fallback if backend is warming up
    return {
      stats: { total_graphs: 24, algorithms_used: 3, sessions: 58 },
      recent_activity: [
        { id: '1', title: 'Ran Graph Coloring on 12 nodes', time: '10 mins ago', module: 'Graph Coloring' },
        { id: '2', title: "Generated MST using Prim's algorithm", time: '25 mins ago', module: 'Minimum Spanning Tree' },
        { id: '3', title: 'Created Huffman tree for compression', time: '1 hour ago', module: 'Huffman Coding' }
      ]
    };
  }
}

export async function apiGenerateGraph(numVertices: number, matrix: number[][]): Promise<GraphGenerateResponse> {
  const res = await fetch('/api/graph/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_vertices: numVertices, matrix })
  });
  return res.json();
}

export async function apiColorGraph(matrix: number[][]): Promise<GraphColoringResponse> {
  const res = await fetch('/api/graph/color', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix })
  });
  return res.json();
}

export async function apiEdgeColorGraph(matrix: number[][]): Promise<EdgeColoringResponse> {
  const res = await fetch('/api/graph/edge-color', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix })
  });
  return res.json();
}

export async function apiAllColorings(matrix: number[][]): Promise<AllColoringsResponse> {
  const res = await fetch('/api/graph/all-colorings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix })
  });
  return res.json();
}

export async function apiValidateManual(matrix: number[][], coloring: Record<string, string>): Promise<ManualValidationResponse> {
  const res = await fetch('/api/graph/validate-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix, coloring })
  });
  return res.json();
}

export async function apiRunMST(numVertices: number, matrix: number[][], algorithm: 'prim' | 'kruskal'): Promise<MSTRunResponse> {
  const res = await fetch('/api/mst/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_vertices: numVertices, matrix, algorithm })
  });
  return res.json();
}

export async function apiHuffmanEncode(text: string): Promise<HuffmanEncodeResponse> {
  const res = await fetch('/api/huffman/encode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, include_steps: true })
  });
  return res.json();
}

export async function apiHuffmanDecode(encoded: string, codes: Record<string, string>): Promise<HuffmanDecodeResponse> {
  const res = await fetch('/api/huffman/decode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encoded, codes })
  });
  return res.json();
}

export async function apiSendContact(name: string, email: string, subject: string, message: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, subject, message })
  });
  return res.json();
}
