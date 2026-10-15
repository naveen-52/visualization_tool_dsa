import unittest
import json
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from run import app

class TestAlgoVizComplete(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        cls.client = app.test_client()

    # --------------------------------------------------------------------------
    # 1. Page Serving & Static Asset Tests
    # --------------------------------------------------------------------------
    def test_01_landing_page(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"NEC AlgoViz", res.data)

    def test_02_dashboard_page(self):
        res = self.client.get("/dashboard")
        self.assertEqual(res.status_code, 200)

    def test_03_about_page(self):
        res = self.client.get("/about")
        self.assertEqual(res.status_code, 200)

    def test_04_react_spa(self):
        res = self.client.get("/react")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"<div id=\"root\"></div>", res.data)

    def test_05_react_assets(self):
        res = self.client.get("/assets/index-Ck44GkJU.css")
        self.assertEqual(res.status_code, 200)

    def test_06_jinja_module_routes(self):
        for route in ["/graph", "/mst", "/huffman"]:
            res = self.client.get(route)
            self.assertEqual(res.status_code, 200, f"Route {route} failed")

    # --------------------------------------------------------------------------
    # 2. REST API - Dashboard
    # --------------------------------------------------------------------------
    def test_07_api_dashboard_stats(self):
        res = self.client.get("/api/dashboard/stats")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("stats", data)
        self.assertIn("recent_activity", data)

    # --------------------------------------------------------------------------
    # 3. REST API - Graph Coloring
    # --------------------------------------------------------------------------
    def test_08_api_graph_generate(self):
        # 4-node cycle graph
        matrix = [
            [0, 1, 0, 1],
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [1, 0, 1, 0]
        ]
        res = self.client.post("/api/graph/generate", json={
            "num_vertices": 4,
            "matrix": matrix
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("graph_url", data)
        self.assertTrue(data["graph_url"].startswith("data:image/png;base64,"))

    def test_09_api_graph_color(self):
        # 3-node triangle graph (Chromatic number should be 3)
        matrix = [
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0]
        ]
        res = self.client.post("/api/graph/color", json={"matrix": matrix})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("chromatic_number"), 3)
        self.assertIn("coloring", data)
        self.assertIn("graph_url", data)

    def test_10_api_graph_edge_color(self):
        matrix = [
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0]
        ]
        res = self.client.post("/api/graph/edge-color", json={"matrix": matrix})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("chromatic_index", data)
        self.assertIn("edge_coloring", data)

    def test_11_api_graph_all_colorings(self):
        matrix = [
            [0, 1, 0, 1],
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [1, 0, 1, 0]
        ]
        res = self.client.post("/api/graph/all-colorings", json={"matrix": matrix})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("combinations", data)

    def test_12_api_graph_validate_manual_valid(self):
        # Bipartite 4-cycle: nodes 0 and 2 colored 0, nodes 1 and 3 colored 1
        matrix = [
            [0, 1, 0, 1],
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [1, 0, 1, 0]
        ]
        coloring = {"0": 0, "1": 1, "2": 0, "3": 1}
        res = self.client.post("/api/graph/validate-manual", json={
            "matrix": matrix,
            "coloring": coloring
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("valid"))
        self.assertEqual(len(data.get("conflicts", [])), 0)

    def test_13_api_graph_validate_manual_conflict(self):
        # Nodes 0 and 1 adjacent with same color
        matrix = [
            [0, 1],
            [1, 0]
        ]
        coloring = {"0": 0, "1": 0}
        res = self.client.post("/api/graph/validate-manual", json={
            "matrix": matrix,
            "coloring": coloring
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertFalse(data.get("valid"))
        self.assertGreater(len(data.get("conflicts", [])), 0)

    # --------------------------------------------------------------------------
    # 4. REST API - Minimum Spanning Tree (MST)
    # --------------------------------------------------------------------------
    def test_14_api_mst_prim(self):
        # 4 vertices, weighted
        matrix = [
            [0, 1, 4, 3],
            [1, 0, 2, 0],
            [4, 2, 0, 5],
            [3, 0, 5, 0]
        ]
        res = self.client.post("/api/mst/run", json={
            "num_vertices": 4,
            "matrix": matrix,
            "algorithm": "prim"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("algorithm"), "prim")
        self.assertEqual(data.get("total_weight"), 6)  # edges: (0,1:1), (1,2:2), (0,3:3) -> 6
        self.assertGreater(len(data.get("steps", [])), 0)

    def test_15_api_mst_kruskal(self):
        matrix = [
            [0, 1, 4, 3],
            [1, 0, 2, 0],
            [4, 2, 0, 5],
            [3, 0, 5, 0]
        ]
        res = self.client.post("/api/mst/run", json={
            "num_vertices": 4,
            "matrix": matrix,
            "algorithm": "kruskal"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("algorithm"), "kruskal")
        self.assertEqual(data.get("total_weight"), 6)

    # --------------------------------------------------------------------------
    # 5. REST API - Huffman Coding
    # --------------------------------------------------------------------------
    def test_16_api_huffman_encode(self):
        text = "ABRACADABRA"
        res = self.client.post("/api/huffman/encode", json={"text": text})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("encoded_text", data)
        self.assertIn("codes", data)
        self.assertIn("frequency_table", data)
        self.assertIn("original_bits", data)
        self.assertIn("compressed_bits", data)
        self.assertIn("compression_ratio", data)

    def test_17_api_huffman_decode(self):
        text = "TEST_HUFFMAN_CODE"
        # First encode
        enc_res = self.client.post("/api/huffman/encode", json={"text": text})
        enc_data = enc_res.get_json()
        encoded = enc_data["encoded_text"]
        codes = enc_data["codes"]

        # Now decode
        dec_res = self.client.post("/api/huffman/decode", json={
            "encoded": encoded,
            "codes": codes
        })
        self.assertEqual(dec_res.status_code, 200)
        dec_data = dec_res.get_json()
        self.assertTrue(dec_data.get("success"))
        self.assertEqual(dec_data.get("decoded_text"), text)

    # --------------------------------------------------------------------------
    # 6. Error & Edge Case Handling Tests
    # --------------------------------------------------------------------------
    def test_18_graph_invalid_input(self):
        # Empty matrix
        res = self.client.post("/api/graph/generate", json={"num_vertices": 0, "matrix": []})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json().get("success"))

    def test_19_huffman_empty_text(self):
        res = self.client.post("/api/huffman/encode", json={"text": ""})
        self.assertEqual(res.status_code, 400)

    def test_20_mst_zero_edges(self):
        # Matrix with 0 everywhere
        res = self.client.post("/api/mst/run", json={
            "num_vertices": 3,
            "matrix": [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
            "algorithm": "prim"
        })
        self.assertEqual(res.status_code, 400)

if __name__ == "__main__":
    unittest.main(verbosity=2)
