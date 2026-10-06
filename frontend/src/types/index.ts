export type AppPage = 'landing' | 'dashboard' | 'about' | 'graph-coloring' | 'mst' | 'huffman';

export interface DashboardStats {
  total_graphs: number;
  algorithms_used: number;
  sessions: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  module: string;
}

export interface GraphGenerateResponse {
  success: boolean;
  graph_url?: string;
  num_vertices?: number;
  num_edges?: number;
  error?: string;
}

export interface GraphColoringResponse {
  success: boolean;
  chromatic_number?: number;
  total_colorings?: number;
  truncated?: boolean;
  coloring?: Record<string, number>;
  graph_url?: string;
  error?: string;
}

export interface EdgeColoringResponse {
  success: boolean;
  chromatic_index?: number;
  edge_coloring?: Array<{ u: number; v: number; color_idx: number }>;
  graph_url?: string;
  error?: string;
}

export interface AllColoringsResponse {
  success: boolean;
  chromatic_number?: number;
  combinations?: Array<{
    coloring: Record<string, number>;
    image: string;
  }>;
  error?: string;
}

export interface ManualValidationResponse {
  success: boolean;
  valid?: boolean;
  conflicts?: Array<{ u: number; v: number; color: string }>;
  message?: string;
  error?: string;
}

export interface MSTStep {
  step_index: number;
  current: number | null;
  edges: Array<[number, number, number]>;
  added_edge?: [number, number, number];
  cost_so_far: number;
  image_url: string;
}

export interface MSTRunResponse {
  success: boolean;
  algorithm?: 'prim' | 'kruskal';
  total_weight?: number;
  total_steps?: number;
  final_edges?: Array<[number, number, number]>;
  steps?: MSTStep[];
  error?: string;
}

export interface HuffmanEncodeResponse {
  success: boolean;
  encoded?: string;
  codes?: Record<string, string>;
  frequencies?: Record<string, number>;
  original_bits?: number;
  compressed_bits?: number;
  compression_ratio?: number;
  tree?: any;
  steps?: any[];
  error?: string;
}

export interface HuffmanDecodeResponse {
  success: boolean;
  decoded?: string;
  error?: string;
}
