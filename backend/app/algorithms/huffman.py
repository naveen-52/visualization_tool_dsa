import heapq
import uuid
from collections import Counter

class HuffmanNode:
    def __init__(self, char, freq):
        self.id = str(uuid.uuid4())
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None

    def __lt__(self, other):
        return self.freq < other.freq

    def to_dict(self):
        result_map = {}
        stack = [self]
        visited = set()
        
        while stack:
            node = stack[-1]
            if node.id in visited:
                stack.pop()
                result_map[node.id] = {
                    "id": node.id,
                    "char": node.char,
                    "freq": node.freq,
                    "value": node.freq,
                    "left": result_map.get(node.left.id) if node.left else None,
                    "right": result_map.get(node.right.id) if node.right else None
                }
            else:
                visited.add(node.id)
                if node.right:
                    stack.append(node.right)
                if node.left:
                    stack.append(node.left)
                    
        return result_map[self.id]

def _queue_snapshot(heap):
    """
    Returns a stable, frequency-sorted list of serialised node dicts
    from the current heap.  Called after every heap mutation so that
    every step object carries a complete queue snapshot for the frontend.
    Sorting is O(k log k) where k = unique characters — negligible.
    """
    return [
        {"id": n.id, "char": n.char, "freq": n.freq}
        for n in sorted(heap, key=lambda n: (n.freq, n.id))
    ]


def build_huffman(text, include_steps=True):
    if not text:
        return {
            "codes": {},
            "tree": {},
            "steps": []
        }

    # 1. Build frequency map
    frequency = Counter(text)

    # 2. Use min-heap to construct Huffman tree
    heap = []
    for char, freq in frequency.items():
        heapq.heappush(heap, HuffmanNode(char, freq))
        
    steps = []

    if include_steps:
        # O(K) initial snapshot, all future steps are O(1) deltas
        initial_queue = [{"id": n.id, "char": n.char, "freq": n.freq} for n in sorted(heap)]
        steps.append({
            "action": "init",
            "queue": initial_queue
        })

    # 5. Generate steps for visualization
    while len(heap) > 1:
        # Pop two lowest frequency nodes
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        
        selected_nodes = [
            {"id": left.id, "char": left.char, "freq": left.freq},
            {"id": right.id, "char": right.char, "freq": right.freq}
        ]
        
        if include_steps:
            # Action: select — queue = remaining heap after the two pops
            steps.append({
                "action": "select",
                "queue": _queue_snapshot(heap),   # heap already has left/right removed
                "selected": selected_nodes,
                "result": {}
            })
        
        # Merge nodes
        merged = HuffmanNode(None, left.freq + right.freq)
        merged.left = left
        merged.right = right
        
        result_node = {"id": merged.id, "char": merged.char, "freq": merged.freq}
        
        if include_steps:
            # Action: merge — queue unchanged (merged node not yet inserted)
            steps.append({
                "action": "merge",
                "queue": _queue_snapshot(heap),   # same remainder as select step
                "selected": selected_nodes,
                "result": result_node
            })
        
        # Push merged node back to heap
        heapq.heappush(heap, merged)
        
        if include_steps:
            # Action: insert — queue now contains the freshly pushed merged node
            steps.append({
                "action": "insert",
                "queue": _queue_snapshot(heap),   # heap after heappush
                "selected": [],
                "result": result_node
            })

    root = heap[0] if heap else None

    # 3. Generate binary codes
    codes = {}
    if root:
        stack = [(root, "")]
        while stack:
            node, current_code = stack.pop()
            if node.char is not None:
                codes[node.char] = current_code if current_code else "0"
            else:
                # Push right first so left is popped and processed first
                if node.right:
                    stack.append((node.right, current_code + "1"))
                if node.left:
                    stack.append((node.left, current_code + "0"))

    # 4. Encode text (built-in requirement but not returned based on constraints)
    encoded_text = "".join(codes[char] for char in text) if text and codes else ""

    return {
        "codes": codes,
        "tree": root.to_dict() if root else {},
        "steps": steps
    }

def decode_huffman(encoded_text, codes):
    """
    Decodes an encoded binary string back to its original text using the provided codes mapping.
    """
    if not encoded_text or not codes:
        return ""
        
    # Invert the mapping: binary -> character
    reverse_codes = {v: k for k, v in codes.items()}
    
    decoded_text = ""
    current_bits = ""
    
    # Reconstruct exactly the original string
    for bit in encoded_text:
        current_bits += bit
        if current_bits in reverse_codes:
            decoded_text += reverse_codes[current_bits]
            current_bits = ""
            
    return decoded_text