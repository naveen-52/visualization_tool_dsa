from flask import Blueprint, render_template, request
import networkx as nx

# 🔥 REQUIRED for server-side rendering
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import io
import base64

import numpy as np
import threading

from app.algorithms.mst import prims_mst, kruskal_mst
from app.utils.validators import validate_weight_matrix

mst_bp = Blueprint("mst", __name__)
_render_lock = threading.Lock()


@mst_bp.route("/mst")
def mst_index():
    return render_template("mst/index.html")


@mst_bp.route("/mst/matrix", methods=["POST"])
def mst_matrix():

    num_vertices = int(request.form["num_vertices"])
    algorithm = request.form.get("algorithm", "prim")

    return render_template(
        "mst/matrix.html",
        num_vertices=num_vertices,
        algorithm=algorithm
    )


# Build full graph
def build_full_graph(matrix):
    G = nx.Graph()
    num_vertices = len(matrix)

    G.add_nodes_from(range(num_vertices))

    for i in range(num_vertices):
        for j in range(i + 1, num_vertices):
            if matrix[i][j] != 0:
                G.add_edge(i, j, weight=matrix[i][j])

    return G


def _count_edge_crossings(G, pos):
    """Counts the number of line-segment intersections in a 2D layout."""
    edges = list(G.edges())
    crossings = 0

    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

    def intersect(A, B, C, D):
        return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

    for i in range(len(edges)):
        u1, v1 = edges[i]
        p1, p2 = np.array(pos[u1], dtype=float), np.array(pos[v1], dtype=float)
        for j in range(i + 1, len(edges)):
            u2, v2 = edges[j]
            if len({u1, v1, u2, v2}) < 4:
                continue
            p3, p4 = np.array(pos[u2], dtype=float), np.array(pos[v2], dtype=float)
            if intersect(p1, p2, p3, p4):
                crossings += 1

    return crossings


def get_optimal_mst_layout(G):
    """
    Computes a clean, aesthetic, and balanced 2D graph layout.
    Automatically adapts to graph size, topology (cycles, stars, trees, dense, sparse,
    and disconnected components), preventing node clustering and minimizing edge crossings.
    Completely deterministic.
    """
    nodes = list(G.nodes())
    n = len(nodes)
    if n <= 1:
        return {node: (0.0, 0.0) for node in nodes}
    if n == 2:
        return {nodes[0]: (-0.80, 0.0), nodes[1]: (0.80, 0.0)}
    if n == 3:
        angles = [np.pi / 2, np.pi / 2 + 2 * np.pi / 3, np.pi / 2 + 4 * np.pi / 3]
        return {nodes[i]: (float(0.82 * np.cos(angles[i])), float(0.82 * np.sin(angles[i]))) for i in range(3)}

    # 1. Handle Disconnected Graphs (separate components cleanly)
    comps = list(nx.connected_components(G))
    if len(comps) > 1:
        comps = sorted(comps, key=len, reverse=True)
        num_c = len(comps)
        all_pos = {}
        cols = int(np.ceil(np.sqrt(num_c)))
        rows = int(np.ceil(num_c / cols))
        cell_w = 1.7 / cols
        cell_h = 1.7 / rows
        for idx, comp in enumerate(comps):
            subG = G.subgraph(comp)
            sub_pos = get_optimal_mst_layout(subG)
            r = idx // cols
            c = idx % cols
            cx = -0.85 + (c + 0.5) * cell_w
            cy = 0.85 - (r + 0.5) * cell_h
            sub_scale = 0.40 * min(cell_w, cell_h)
            for u in comp:
                all_pos[u] = (
                    float(cx + sub_pos[u][0] * sub_scale),
                    float(cy + sub_pos[u][1] * sub_scale)
                )
        return all_pos

    # 2. Check for Star / Hub-and-Spoke Topology
    degrees = dict(G.degree())
    max_node, max_deg = max(degrees.items(), key=lambda x: x[1])
    if max_deg >= n - 1 and all(deg <= 2 for node, deg in degrees.items() if node != max_node):
        pos = {max_node: (0.0, 0.0)}
        other_nodes = [node for node in nodes if node != max_node]
        for idx, node in enumerate(other_nodes):
            angle = 2.0 * np.pi * idx / len(other_nodes) - (np.pi / 2)
            pos[node] = (float(0.85 * np.cos(angle)), float(0.85 * np.sin(angle)))
        return pos

    # 3. Generate Diverse Deterministic Candidates
    candidates = []

    # Candidate A: Regular circular layout (natural index order)
    circ_natural = {}
    for idx, node in enumerate(nodes):
        angle = 2.0 * np.pi * idx / n - (np.pi / 2)
        circ_natural[node] = (float(0.85 * np.cos(angle)), float(0.85 * np.sin(angle)))
    candidates.append(('circular_natural', circ_natural))

    # Candidate B: BFS circular traversal (untangles cycles with chords)
    try:
        start_node = min(nodes)
        bfs_order = list(nx.bfs_tree(G, source=start_node).nodes())
        if len(bfs_order) == n:
            circ_bfs = {}
            for idx, node in enumerate(bfs_order):
                angle = 2.0 * np.pi * idx / n - (np.pi / 2)
                circ_bfs[node] = (float(0.85 * np.cos(angle)), float(0.85 * np.sin(angle)))
            candidates.append(('circular_bfs', circ_bfs))
    except Exception:
        pass

    # Candidate C: Spectral layout (eigenvector embedding of graph Laplacian)
    try:
        spec_raw = nx.spectral_layout(G, weight=None)
        xs = [spec_raw[u][0] for u in nodes]
        ys = [spec_raw[u][1] for u in nodes]
        x_span = max(xs) - min(xs) or 1.0
        y_span = max(ys) - min(ys) or 1.0
        scale = max(x_span, y_span, 1e-4)
        spec_pos = {
            u: (float((spec_raw[u][0] - np.mean(xs)) / scale * 1.6),
                float((spec_raw[u][1] - np.mean(ys)) / scale * 1.6))
            for u in nodes
        }
        candidates.append(('spectral', spec_pos))
    except Exception:
        pass

    # Candidate D: Spring layout relaxed from Circular (weight=None avoids weight distortion)
    try:
        sp_from_circ = nx.spring_layout(
            G, pos=circ_natural, iterations=60, k=1.4 / np.sqrt(n), weight=None, seed=42
        )
        candidates.append(('spring_from_circ', sp_from_circ))
    except Exception:
        pass

    # Candidate E: Multi-seed Spring Layouts (pure topological, weight=None)
    for seed in [42, 0, 7, 13, 21]:
        try:
            sp = nx.spring_layout(
                G, iterations=160, k=1.4 / np.sqrt(n), weight=None, seed=seed
            )
            candidates.append((f'spring_seed_{seed}', sp))
        except Exception:
            pass

    # 4. Post-Process & Score Each Candidate
    edges = list(G.edges())
    best_layout = None
    min_penalty = float('inf')
    desired_dist = max(0.25, 1.85 / np.sqrt(n))

    for name, raw_pos in candidates:
        xs = [raw_pos[u][0] for u in nodes]
        ys = [raw_pos[u][1] for u in nodes]
        span_x = max(xs) - min(xs)
        span_y = max(ys) - min(ys)
        scale = max(span_x, span_y, 1e-4)
        cx = (max(xs) + min(xs)) / 2.0
        cy = (max(ys) + min(ys)) / 2.0

        pos = {
            u: np.array([
                float((raw_pos[u][0] - cx) / scale * 1.7),
                float((raw_pos[u][1] - cy) / scale * 1.7)
            ], dtype=float)
            for u in nodes
        }

        # Local repulsive relaxation to guarantee node separation
        for _ in range(12):
            moved = False
            for i in range(n):
                for j in range(i + 1, n):
                    delta = pos[nodes[i]] - pos[nodes[j]]
                    dist = float(np.linalg.norm(delta))
                    if dist < 1e-4:
                        delta = np.array([0.01, 0.01])
                        dist = float(np.linalg.norm(delta))
                    if dist < desired_dist:
                        shift = (delta / dist) * (desired_dist - dist) * 0.25
                        pos[nodes[i]] += shift
                        pos[nodes[j]] -= shift
                        moved = True
            if not moved:
                break

        # Re-center and re-scale
        cur_xs = [pos[u][0] for u in nodes]
        cur_ys = [pos[u][1] for u in nodes]
        cur_span_x = max(cur_xs) - min(cur_xs)
        cur_span_y = max(cur_ys) - min(cur_ys)
        cur_scale = max(cur_span_x, cur_span_y, 1e-4)
        cur_cx = (max(cur_xs) + min(cur_xs)) / 2.0
        cur_cy = (max(cur_ys) + min(cur_ys)) / 2.0

        norm_pos = {
            u: (
                float((pos[u][0] - cur_cx) / cur_scale * 1.7),
                float((pos[u][1] - cur_cy) / cur_scale * 1.7)
            )
            for u in nodes
        }

        # Calculate Edge Crossings
        crossings = _count_edge_crossings(G, norm_pos)

        # Node-Node Overlap Penalty
        overlap_pen = 0.0
        for i in range(n):
            for j in range(i + 1, n):
                d = float(np.linalg.norm(np.array(norm_pos[nodes[i]]) - np.array(norm_pos[nodes[j]])))
                if d < desired_dist:
                    overlap_pen += ((desired_dist - d) / desired_dist) ** 2 * 3000.0

        # Node-Edge Clearance Penalty (prevent nodes sitting on unrelated edges)
        node_edge_pen = 0.0
        clearance = desired_dist * 0.40
        for u, v in edges:
            pu, pv = np.array(norm_pos[u]), np.array(norm_pos[v])
            line = pv - pu
            l2 = float(np.dot(line, line))
            if l2 < 1e-6:
                continue
            for w in nodes:
                if w == u or w == v:
                    continue
                pw = np.array(norm_pos[w])
                t = np.clip(np.dot(pw - pu, line) / l2, 0.0, 1.0)
                proj = pu + t * line
                d_ne = float(np.linalg.norm(pw - proj))
                if d_ne < clearance:
                    node_edge_pen += ((clearance - d_ne) / clearance) ** 2 * 1200.0

        # Spatial Distribution / Aspect Ratio Penalty
        aspect_ratio = min(cur_span_x, cur_span_y) / max(cur_span_x, cur_span_y, 1e-4)
        aspect_pen = (1.0 - aspect_ratio) * 150.0

        total_penalty = crossings * 1500.0 + overlap_pen + node_edge_pen + aspect_pen
        if total_penalty < min_penalty:
            min_penalty = total_penalty
            best_layout = norm_pos
            if crossings == 0 and overlap_pen < 1.0 and node_edge_pen < 1.0:
                break

    return best_layout if best_layout is not None else circ_natural


def compute_smart_edge_label_positions(G, pos, edge_list):
    """
    Computes optimal, non-overlapping label coordinates for every edge in G.
    Ensures every weight label is clearly placed along its corresponding edge,
    free from collisions with other labels, vertices, or intersecting edges.
    """
    if not edge_list:
        return {}

    n = len(G.nodes())
    t_candidates = [0.50, 0.42, 0.58, 0.35, 0.65, 0.28, 0.72]

    nodes_arr = np.array([pos[n_id] for n_id in G.nodes()])
    if len(nodes_arr) > 1:
        span_x = np.max(nodes_arr[:, 0]) - np.min(nodes_arr[:, 0])
        span_y = np.max(nodes_arr[:, 1]) - np.min(nodes_arr[:, 1])
        avg_span = max(float(np.mean([span_x, span_y])), 0.5)
    else:
        avg_span = 1.0

    label_scale = max(0.08, avg_span / np.sqrt(max(4, n)))
    perp_offsets = [
        0.0,
        0.50 * label_scale,
        -0.50 * label_scale,
        0.90 * label_scale,
        -0.90 * label_scale
    ]

    assigned_positions = {}

    for u, v in edge_list:
        p_u = np.array(pos[u], dtype=float)
        p_v = np.array(pos[v], dtype=float)
        diff = p_v - p_u
        length = float(np.linalg.norm(diff))

        if length < 1e-6:
            assigned_positions[(u, v)] = (float(p_u[0]), float(p_u[1]))
            continue

        unit_dir = diff / length
        normal = np.array([-unit_dir[1], unit_dir[0]])

        best_pos = None
        best_cost = float('inf')

        for t in t_candidates:
            for d_perp in perp_offsets:
                cand = p_u + t * diff + d_perp * normal

                cost = abs(t - 0.5) * 12.0 + abs(d_perp) * 20.0

                # 1. Closeness to edge endpoint vertices
                d_u = float(np.linalg.norm(cand - p_u))
                d_v = float(np.linalg.norm(cand - p_v))
                min_endpoint_d = min(d_u, d_v)
                if min_endpoint_d < 1.6 * label_scale:
                    cost += (1.6 * label_scale - min_endpoint_d) * 500.0

                # 2. Closeness to all other vertices
                for other_n, n_pos in pos.items():
                    if other_n in (u, v):
                        continue
                    d_node = float(np.linalg.norm(cand - np.array(n_pos)))
                    if d_node < 1.8 * label_scale:
                        cost += (1.8 * label_scale - d_node) * 600.0

                # 3. Closeness to previously assigned edge labels
                for prev_edge, prev_p in assigned_positions.items():
                    d_label = float(np.linalg.norm(cand - np.array(prev_p)))
                    if d_label < 1.7 * label_scale:
                        cost += (1.7 * label_scale - d_label) * 800.0

                # 4. Closeness to other edge segments
                for ou, ov in G.edges():
                    if (ou, ov) == (u, v) or (ov, ou) == (u, v):
                        continue
                    o_u = np.array(pos[ou], dtype=float)
                    o_v = np.array(pos[ov], dtype=float)
                    o_ab = o_v - o_u
                    o_len2 = float(np.dot(o_ab, o_ab))
                    if o_len2 > 1e-6:
                        proj_t = np.clip(np.dot(cand - o_u, o_ab) / o_len2, 0.0, 1.0)
                        closest_pt = o_u + proj_t * o_ab
                        d_edge = float(np.linalg.norm(cand - closest_pt))
                        if d_edge < 0.9 * label_scale:
                            cost += (0.9 * label_scale - d_edge) * 300.0

                if cost < best_cost:
                    best_cost = cost
                    best_pos = cand

        assigned_positions[(u, v)] = (float(best_pos[0]), float(best_pos[1]))

    return assigned_positions


def draw_mst_figure(G, step, num_vertices=None, pos=None, label_positions=None, as_data_url=False):
    """
    Renders an adaptive, high-DPI visualization of an MST graph step.
    Dynamically scales canvas dimensions, node radius, and label sizes according
    to vertex count so graphs with 2-5, 6-10, 11-20, or larger stay perfectly legible.
    """
    if len(G.edges()) == 0:
        return None

    mst_edges = step.get("edges", [])
    current_node = step.get("current", -1)
    n_count = num_vertices or len(G.nodes())

    if pos is None:
        pos = get_optimal_mst_layout(G)

    mst_set = set((min(u, v), max(u, v)) for u, v, _ in mst_edges)
    mst_edge_list = []
    non_mst_edges = []

    for u, v in G.edges():
        if (min(u, v), max(u, v)) in mst_set:
            mst_edge_list.append((u, v))
        else:
            non_mst_edges.append((u, v))

    if label_positions is None:
        all_edges_ordered = mst_edge_list + non_mst_edges
        label_positions = compute_smart_edge_label_positions(G, pos, all_edges_ordered)

    # Adaptive canvas sizing and typography
    if n_count <= 6:
        fig_size = (6.5, 6.5)
        dpi = 130
        node_size, node_font, edge_font = 850, 11.5, 9.5
        non_mst_w, mst_w = 1.8, 3.8
        pad_edge = 0.26
    elif n_count <= 10:
        fig_size = (7.5, 7.5)
        dpi = 130
        node_size, node_font, edge_font = 750, 10.5, 9.0
        non_mst_w, mst_w = 1.6, 3.5
        pad_edge = 0.25
    elif n_count <= 16:
        fig_size = (9.0, 9.0)
        dpi = 140
        node_size, node_font, edge_font = 650, 10.0, 8.5
        non_mst_w, mst_w = 1.4, 3.2
        pad_edge = 0.23
    elif n_count <= 25:
        fig_size = (11.0, 11.0)
        dpi = 140
        node_size, node_font, edge_font = 550, 9.0, 8.0
        non_mst_w, mst_w = 1.2, 2.8
        pad_edge = 0.21
    else:
        fig_size = (13.0, 13.0)
        dpi = 140
        node_size, node_font, edge_font = 450, 8.0, 7.5
        non_mst_w, mst_w = 1.0, 2.4
        pad_edge = 0.19

    with _render_lock:
        fig = plt.figure(figsize=fig_size, facecolor="#ffffff", dpi=dpi)
        plt.margins(0.12)
        plt.axis('off')

        # Highlight current focus node in red, other nodes in soft slate blue
        node_colors = []
        for node in G.nodes():
            if node == current_node:
                node_colors.append("#ef4444")
            else:
                node_colors.append("#93c5fd")

        nx.draw_networkx_nodes(
            G, pos,
            node_color=node_colors,
            node_size=node_size,
            edgecolors="#1e293b",
            linewidths=1.8 if n_count <= 15 else 1.2
        )

        # Draw Non-MST edges (subtle light gray)
        if non_mst_edges:
            nx.draw_networkx_edges(
                G, pos,
                edgelist=non_mst_edges,
                edge_color="#cbd5e1",
                width=non_mst_w,
                alpha=0.70
            )

        # Draw MST edges (bold vibrant green)
        if mst_edge_list:
            nx.draw_networkx_edges(
                G, pos,
                edgelist=mst_edge_list,
                edge_color="#16a34a",
                width=mst_w
            )

        # Draw integer vertex labels
        labels = {i: str(i) for i in G.nodes()}
        nx.draw_networkx_labels(
            G, pos,
            labels=labels,
            font_size=node_font,
            font_weight="bold",
            font_color="#0f172a"
        )

        ax = plt.gca()

        # 1. Non-MST edge labels
        for u, v in non_mst_edges:
            norm_key = (u, v) if (u, v) in label_positions else (v, u)
            if norm_key in label_positions and G.has_edge(u, v):
                x, y = label_positions[norm_key]
                w = G[u][v].get("weight", "")
                ax.text(
                    x, y, str(w),
                    fontsize=edge_font,
                    fontweight="bold",
                    ha="center",
                    va="center",
                    color="#64748b",
                    bbox=dict(
                        boxstyle=f"round,pad={pad_edge}",
                        facecolor="#ffffff",
                        edgecolor="#cbd5e1",
                        linewidth=1.0,
                        alpha=0.96
                    ),
                    zorder=4
                )

        # 2. MST edge labels (crisp green badge with high zorder)
        for u, v, w in mst_edges:
            norm_key = (u, v) if (u, v) in label_positions else (v, u)
            if norm_key in label_positions:
                x, y = label_positions[norm_key]
                ax.text(
                    x, y, str(w),
                    fontsize=edge_font + 1.0,
                    fontweight="bold",
                    ha="center",
                    va="center",
                    color="#15803d",
                    bbox=dict(
                        boxstyle=f"round,pad={pad_edge + 0.04}",
                        facecolor="#dcfce7",
                        edgecolor="#16a34a",
                        linewidth=1.4,
                        alpha=0.98
                    ),
                    zorder=6
                )

        img = io.BytesIO()
        plt.savefig(img, format="png", bbox_inches='tight', dpi=dpi, facecolor='#ffffff')
        plt.close()

    img.seek(0)
    raw_b64 = base64.b64encode(img.read()).decode('utf-8')
    if as_data_url:
        return f"data:image/png;base64,{raw_b64}"
    return raw_b64


def generate_graph_image(G, step, pos=None, label_positions=None):
    return draw_mst_figure(G, step, num_vertices=len(G.nodes()), pos=pos, label_positions=label_positions, as_data_url=False)


@mst_bp.route("/mst/calculate", methods=["POST"])
def mst_calculate():

    num_vertices = int(request.form.get("num_vertices", 0))
    algorithm = request.form.get("algorithm", "prim")

    matrix = []

    for i in range(num_vertices):
        row = []
        for j in range(num_vertices):
            value = request.form.get(f"cell_{i}_{j}")
            row.append(int(value) if value else 0)

        matrix.append(row)

    validate_weight_matrix(matrix)

    if algorithm == "kruskal":
        mst_edges, total_weight, steps = kruskal_mst(num_vertices, matrix)
    else:
        mst_edges, total_weight, steps = prims_mst(num_vertices, matrix)

    G = build_full_graph(matrix)

    # Precompute stable layout and collision-free edge label positions
    pos = get_optimal_mst_layout(G)
    mst_set = set((min(u, v), max(u, v)) for u, v, _ in mst_edges)
    all_edges_ordered = [(u, v) for u, v, _ in mst_edges] + [
        (u, v) for u, v in G.edges() if (min(u, v), max(u, v)) not in mst_set
    ]
    smart_label_positions = compute_smart_edge_label_positions(G, pos, all_edges_ordered)

    # Final static graph
    graph_image = generate_graph_image(
        G,
        {"edges": mst_edges, "current": -1},
        pos=pos,
        label_positions=smart_label_positions
    )

    # Generate animation frames with the identical stable layout
    step_images = []
    for step in steps:
        img = generate_graph_image(
            G,
            step,
            pos=pos,
            label_positions=smart_label_positions
        )
        step_images.append(img)

    is_connected = (len(mst_edges) == num_vertices - 1 or num_vertices <= 1)

    return render_template(
        "mst/result.html",
        num_vertices=num_vertices,
        is_connected=is_connected,
        mst_edges=mst_edges,
        total_weight=total_weight,
        algorithm=algorithm,
        graph_image=graph_image,
        step_images=step_images
    )