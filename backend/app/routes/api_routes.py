import io
import base64
import random
import threading
import hashlib
import json
from collections import OrderedDict
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx
from flask import Blueprint, request, jsonify

from app.services.graph_builder import build_graph_from_matrix
from app.algorithms.graph_coloring import (
    welsh_powell_vertex_coloring,
    greedy_edge_coloring,
    greedy_coloring_with_order,
    count_min_colorings
)
from app.algorithms.mst import prims_mst, kruskal_mst
from app.services.huffman_service import process_encode, process_decode

api_bp = Blueprint("api", __name__, url_prefix="/api")

# Concurrency thread-lock for Matplotlib figure creation (prevents state race conditions across threads)
_render_lock = threading.Lock()

# Thread-safe in-memory LRU Cache for algorithm computations (serves repeated runs in <1ms)
class LRUCache:
    def __init__(self, capacity=500):
        self.cache = OrderedDict()
        self.capacity = capacity
        self.lock = threading.Lock()

    def get(self, key):
        if not key:
            return None
        with self.lock:
            if key not in self.cache:
                return None
            self.cache.move_to_end(key)
            return self.cache[key]

    def set(self, key, value):
        if not key:
            return
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = value
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)

_api_cache = LRUCache(capacity=500)

def _hash_payload(obj):
    try:
        return hashlib.sha256(json.dumps(obj, sort_keys=True).encode("utf-8")).hexdigest()
    except Exception:
        return None

VERTEX_PALETTE = [
    "#3b82f6", "#10b981", "#ef4444", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
    "#f97316", "#6366f1", "#14b8a6", "#d946ef"
]

EDGE_PALETTE = [
    "#ef4444", "#10b981", "#3b82f6", "#f59e0b",
    "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
    "#f97316", "#64748b"
]


# ==============================================================================
# 1. DASHBOARD STATS
# ==============================================================================
@api_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    return jsonify({
        "success": True,
        "stats": {
            "total_graphs": 24,
            "algorithms_used": 3,
            "sessions": 58
        },
        "recent_activity": [
            {"id": "1", "title": "Ran Graph Coloring on 12 nodes", "time": "10 mins ago", "module": "Graph Coloring"},
            {"id": "2", "title": "Generated MST using Prim's algorithm", "time": "25 mins ago", "module": "Minimum Spanning Tree"},
            {"id": "3", "title": "Created Huffman tree for compression", "time": "1 hour ago", "module": "Huffman Coding"}
        ]
    })


# ==============================================================================
# 2. GRAPH COLORING API
# ==============================================================================
def _get_layout(G, num_vertices):
    if num_vertices <= 50:
        return nx.spring_layout(G, seed=42, iterations=50)
    elif num_vertices <= 150:
        return nx.circular_layout(G)
    return nx.random_layout(G)


def _get_labels(num_vertices):
    if num_vertices <= 26:
        return {i: chr(65 + i) for i in range(num_vertices)}
    elif num_vertices <= 80:
        return {i: str(i + 1) for i in range(num_vertices)}
    return None


@api_bp.route("/graph/generate", methods=["POST"])
def api_graph_generate():
    try:
        data = request.get_json(silent=True) or {}
        cache_key = f"graph_gen_{_hash_payload(data)}"
        cached = _api_cache.get(cache_key)
        if cached:
            return jsonify(cached)

        num_vertices = int(data.get("num_vertices", 0))
        matrix = data.get("matrix", [])

        if num_vertices < 2 or not matrix or len(matrix) != num_vertices:
            return jsonify({"success": False, "error": "Invalid matrix or vertex count"}), 400

        G = build_graph_from_matrix(matrix)
        if G.number_of_edges() == 0:
            return jsonify({"success": False, "error": "Graph must have at least one edge."}), 400

        labels = _get_labels(num_vertices)
        pos = _get_layout(G, num_vertices)

        with _render_lock:
            plt.figure(figsize=(7, 7), facecolor='#ffffff')
            plt.axis('off')
            plt.margins(0.15)

            nx.draw_networkx_nodes(
                G, pos,
                node_color="#3b82f6",
                node_size=700 if num_vertices <= 30 else 300,
                edgecolors="#1e293b",
                linewidths=1.5
            )

            nx.draw_networkx_edges(
                G, pos,
                edge_color="#334155",
                width=1.5,
                alpha=0.85
            )

            if labels and num_vertices <= 40:
                nx.draw_networkx_labels(G, pos, labels, font_size=10, font_weight="bold", font_color="#ffffff")

            buf = io.BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight", dpi=120)
            plt.close()
            buf.seek(0)
            graph_url = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

        res = {
            "success": True,
            "graph_url": graph_url,
            "num_vertices": num_vertices,
            "num_edges": G.number_of_edges()
        }
        _api_cache.set(cache_key, res)
        return jsonify(res)
    except Exception as e:
        with _render_lock:
            plt.close()
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/graph/color", methods=["POST"])
def api_graph_color():
    try:
        data = request.get_json(silent=True) or {}
        cache_key = f"graph_col_{_hash_payload(data)}"
        cached = _api_cache.get(cache_key)
        if cached:
            return jsonify(cached)

        matrix = data.get("matrix", [])
        num_vertices = len(matrix)

        if num_vertices < 2:
            return jsonify({"success": False, "error": "Invalid matrix provided"}), 400

        G = build_graph_from_matrix(matrix)
        if G.number_of_edges() == 0:
            return jsonify({"success": False, "error": "Graph must have at least one edge."}), 400

        pos = _get_layout(G, num_vertices)
        labels = _get_labels(num_vertices)

        base_coloring = welsh_powell_vertex_coloring(G)
        chromatic_number = max(base_coloring.values()) + 1 if base_coloring else 0

        # Calculate minimal colorings count if small
        if num_vertices <= 15:
            total_colorings, truncated_flag = count_min_colorings(G, chromatic_number, limit=5000)
        else:
            total_colorings, truncated_flag = 0, True

        with _render_lock:
            plt.figure(figsize=(7, 7), facecolor='#ffffff')
            plt.axis('off')
            plt.margins(0.15)

            node_colors = [
                VERTEX_PALETTE[base_coloring.get(n, 0) % len(VERTEX_PALETTE)]
                for n in G.nodes()
            ]

            nx.draw_networkx_nodes(
                G, pos,
                node_color=node_colors,
                node_size=800 if num_vertices <= 30 else 350,
                edgecolors="#0f172a",
                linewidths=1.5
            )

            nx.draw_networkx_edges(
                G, pos,
                edge_color="#334155",
                width=1.5,
                alpha=0.85
            )

            if labels and num_vertices <= 40:
                nx.draw_networkx_labels(G, pos, labels, font_size=10, font_weight="bold", font_color="#ffffff")

            buf = io.BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight", dpi=120)
            plt.close()
            buf.seek(0)
            graph_url = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

        res = {
            "success": True,
            "chromatic_number": chromatic_number,
            "total_colorings": total_colorings,
            "truncated": truncated_flag,
            "coloring": {str(k): v for k, v in base_coloring.items()},
            "graph_url": graph_url
        }
        _api_cache.set(cache_key, res)
        return jsonify(res)
    except Exception as e:
        with _render_lock:
            plt.close()
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/graph/edge-color", methods=["POST"])
def api_graph_edge_color():
    try:
        data = request.get_json(silent=True) or {}
        cache_key = f"graph_edge_{_hash_payload(data)}"
        cached = _api_cache.get(cache_key)
        if cached:
            return jsonify(cached)

        matrix = data.get("matrix", [])
        num_vertices = len(matrix)

        if num_vertices < 2:
            return jsonify({"success": False, "error": "Invalid matrix provided"}), 400

        G = build_graph_from_matrix(matrix)
        if G.number_of_edges() == 0:
            return jsonify({"success": False, "error": "Graph must have at least one edge."}), 400

        pos = _get_layout(G, num_vertices)
        labels = _get_labels(num_vertices)

        edge_coloring = greedy_edge_coloring(G)
        chromatic_index = max(edge_coloring.values()) + 1 if edge_coloring else 0

        with _render_lock:
            plt.figure(figsize=(7, 7), facecolor='#ffffff')
            plt.axis('off')
            plt.margins(0.15)

            nx.draw_networkx_nodes(
                G, pos,
                node_color="#e2e8f0",
                node_size=700 if num_vertices <= 30 else 300,
                edgecolors="#0f172a",
                linewidths=1.5
            )

            edges = list(G.edges())
            edge_colors = [
                EDGE_PALETTE[edge_coloring.get(e, 0) % len(EDGE_PALETTE)]
                for e in edges
            ]

            nx.draw_networkx_edges(
                G, pos,
                edgelist=edges,
                edge_color=edge_colors,
                width=2.5,
                alpha=0.9
            )

            if labels and num_vertices <= 40:
                nx.draw_networkx_labels(G, pos, labels, font_size=10, font_weight="bold", font_color="#0f172a")

            buf = io.BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight", dpi=120)
            plt.close()
            buf.seek(0)
            graph_url = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

        res = {
            "success": True,
            "chromatic_index": chromatic_index,
            "edge_coloring": [
                {"u": u, "v": v, "color_idx": edge_coloring.get((u, v), edge_coloring.get((v, u), 0))}
                for u, v in edges
            ],
            "graph_url": graph_url
        }
        _api_cache.set(cache_key, res)
        return jsonify(res)
    except Exception as e:
        with _render_lock:
            plt.close()
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/graph/all-colorings", methods=["POST"])
def api_graph_all_colorings():
    try:
        data = request.get_json(silent=True) or {}
        cache_key = f"graph_all_{_hash_payload(data)}"
        cached = _api_cache.get(cache_key)
        if cached:
            return jsonify(cached)

        matrix = data.get("matrix", [])
        num_vertices = len(matrix)

        G = build_graph_from_matrix(matrix)
        if G.number_of_edges() == 0:
            return jsonify({"success": False, "error": "Graph must have at least one edge."}), 400

        pos = _get_layout(G, num_vertices)
        labels = _get_labels(num_vertices)
        base_coloring = welsh_powell_vertex_coloring(G)
        chromatic_number = max(base_coloring.values()) + 1

        graphs = []
        seen = set()
        base_nodes = list(G.nodes())
        max_attempts = 10 if num_vertices > 50 else 100
        max_colorings = 12

        with _render_lock:
            for _ in range(max_attempts):
                nodes = base_nodes[:]
                random.shuffle(nodes)
                coloring = greedy_coloring_with_order(G, nodes)
                if max(coloring.values()) + 1 != chromatic_number:
                    continue
                signature = tuple(coloring[n] for n in sorted(coloring))
                if signature in seen:
                    continue
                seen.add(signature)

                plt.figure(figsize=(5, 5), facecolor='#ffffff')
                plt.axis('off')
                plt.margins(0.15)
                node_colors = [
                    VERTEX_PALETTE[coloring[n] % len(VERTEX_PALETTE)]
                    for n in G.nodes()
                ]
                nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=500, edgecolors="#0f172a")
                nx.draw_networkx_edges(G, pos, edge_color="#334155", width=1.2, alpha=0.8)
                if labels and num_vertices <= 40:
                    nx.draw_networkx_labels(G, pos, labels, font_size=8, font_weight="bold", font_color="#ffffff")

                buf = io.BytesIO()
                plt.savefig(buf, format="png", bbox_inches="tight", dpi=100)
                plt.close()
                buf.seek(0)
                graphs.append({
                    "coloring": {str(k): v for k, v in coloring.items()},
                    "image": f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"
                })

                if len(graphs) >= max_colorings:
                    break

        res = {
            "success": True,
            "chromatic_number": chromatic_number,
            "combinations": graphs
        }
        _api_cache.set(cache_key, res)
        return jsonify(res)
    except Exception as e:
        with _render_lock:
            plt.close()
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/graph/validate-manual", methods=["POST"])
def api_validate_manual():
    try:
        data = request.get_json(silent=True) or {}
        matrix = data.get("matrix", [])
        coloring = data.get("coloring", {})  # { "0": color_idx_or_hex }
        num_vertices = len(matrix)

        conflicts = []
        for i in range(num_vertices):
            for j in range(i + 1, num_vertices):
                if matrix[i][j] != 0:
                    c1 = coloring.get(str(i))
                    c2 = coloring.get(str(j))
                    if c1 is not None and c2 is not None and c1 == c2:
                        conflicts.append({"u": i, "v": j, "color": c1})

        is_valid = len(conflicts) == 0 and len(coloring) == num_vertices
        return jsonify({
            "success": True,
            "valid": is_valid,
            "conflicts": conflicts,
            "message": "Valid coloring! No adjacent nodes share the same color." if is_valid else f"Found {len(conflicts)} conflict(s)."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================================================================
# 3. MINIMUM SPANNING TREE (MST) API
# ==============================================================================
def _build_mst_graph(matrix):
    G = nx.Graph()
    n = len(matrix)
    G.add_nodes_from(range(n))
    for i in range(n):
        for j in range(i + 1, n):
            if matrix[i][j] != 0:
                G.add_edge(i, j, weight=matrix[i][j])
    return G


def _draw_mst_step(G, step, num_vertices):
    mst_edges = step.get("edges", [])
    current_node = step.get("current", None)

    if len(G.nodes()) <= 6:
        pos = nx.circular_layout(G)
    else:
        pos = nx.spring_layout(G, seed=42)

    # Center graph
    x_vals = [v[0] for v in pos.values()]
    y_vals = [v[1] for v in pos.values()]
    x_center = (max(x_vals) + min(x_vals)) / 2
    y_center = (max(y_vals) + min(y_vals)) / 2
    pos = {k: (v[0] - x_center, v[1] - y_center) for k, v in pos.items()}

    with _render_lock:
        plt.figure(figsize=(6, 6), facecolor="#ffffff")
        plt.margins(0.2)
        plt.axis("off")

        mst_set = set((min(u, v), max(u, v)) for u, v, _ in mst_edges)
        mst_edge_list = []
        non_mst_edges = []

        for u, v in G.edges():
            if (min(u, v), max(u, v)) in mst_set:
                mst_edge_list.append((u, v))
            else:
                non_mst_edges.append((u, v))

        node_colors = []
        for node in G.nodes():
            if node == current_node:
                node_colors.append("#ef4444")
            else:
                node_colors.append("#93c5fd")

        nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=800, edgecolors="#1e293b", linewidths=1.5)

        nx.draw_networkx_edges(G, pos, edgelist=non_mst_edges, edge_color="#cbd5e1", width=1.5, alpha=0.6)
        nx.draw_networkx_edges(G, pos, edgelist=mst_edge_list, edge_color="#16a34a", width=3.5)

        labels = {i: chr(65 + i) if num_vertices <= 26 else str(i) for i in range(num_vertices)}
        nx.draw_networkx_labels(G, pos, labels=labels, font_size=10, font_weight="bold", font_color="#0f172a")

        mst_labels = {(u, v): w for u, v, w in mst_edges}
        non_mst_labels = {(u, v): G[u][v]["weight"] for u, v in non_mst_edges if G.has_edge(u, v)}

        nx.draw_networkx_edge_labels(
            G, pos, edge_labels=non_mst_labels, font_size=8, font_color="#64748b",
            bbox=dict(facecolor="white", edgecolor="none", alpha=0.7)
        )
        nx.draw_networkx_edge_labels(
            G, pos, edge_labels=mst_labels, font_size=9, font_weight="bold", font_color="#15803d",
            bbox=dict(facecolor="#dcfce7", edgecolor="#86efac", alpha=0.9)
        )

        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", dpi=110)
        plt.close()
        buf.seek(0)
        return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"


@api_bp.route("/mst/run", methods=["POST"])
def api_mst_run():
    try:
        data = request.get_json(silent=True) or {}
        cache_key = f"mst_run_{_hash_payload(data)}"
        cached = _api_cache.get(cache_key)
        if cached:
            return jsonify(cached)

        num_vertices = int(data.get("num_vertices", 0))
        matrix = data.get("matrix", [])
        algorithm = data.get("algorithm", "prim")

        if num_vertices < 2 or not matrix:
            return jsonify({"success": False, "error": "Invalid matrix provided"}), 400

        G = _build_mst_graph(matrix)
        if len(G.edges()) == 0:
            return jsonify({"success": False, "error": "Graph has no edges with non-zero weights."}), 400

        if algorithm == "kruskal":
            mst_edges, total_weight, raw_steps = kruskal_mst(num_vertices, matrix)
        else:
            mst_edges, total_weight, raw_steps = prims_mst(num_vertices, matrix)

        steps = []
        for i, step in enumerate(raw_steps):
            img_url = _draw_mst_step(G, step, num_vertices)
            steps.append({
                "step_index": i + 1,
                "current": step.get("current"),
                "edges": step.get("edges", []),
                "added_edge": step.get("added_edge"),
                "cost_so_far": sum(e[2] for e in step.get("edges", [])),
                "image_url": img_url
            })

        res = {
            "success": True,
            "algorithm": algorithm,
            "total_weight": total_weight,
            "total_steps": len(steps),
            "final_edges": steps[-1]["edges"] if steps else [],
            "steps": steps
        }
        _api_cache.set(cache_key, res)
        return jsonify(res)
    except Exception as e:
        with _render_lock:
            plt.close()
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================================================================
# 4. HUFFMAN CODING API
# ==============================================================================
@api_bp.route("/huffman/encode", methods=["POST"])
def api_huffman_encode():
    try:
        data = request.get_json(silent=True) or {}
        cache_key = f"huff_enc_{_hash_payload(data)}"
        cached = _api_cache.get(cache_key)
        if cached:
            return jsonify(cached)

        text = data.get("text", "")
        if not text:
            return jsonify({"success": False, "error": "Text cannot be empty"}), 400

        include_steps = data.get("include_steps", True)
        result = process_encode(text, include_steps=include_steps)
        res = {"success": True, **result}
        _api_cache.set(cache_key, res)
        return jsonify(res)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@api_bp.route("/huffman/decode", methods=["POST"])
def api_huffman_decode():
    try:
        data = request.get_json(silent=True) or {}
        cache_key = f"huff_dec_{_hash_payload(data)}"
        cached = _api_cache.get(cache_key)
        if cached:
            return jsonify(cached)

        encoded = data.get("encoded", "")
        codes = data.get("codes", {})

        if not encoded or not codes:
            return jsonify({"success": False, "error": "Both encoded string and code map are required"}), 400

        result = process_decode(encoded, codes)
        res = {"success": True, **result}
        _api_cache.set(cache_key, res)
        return jsonify(res)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
