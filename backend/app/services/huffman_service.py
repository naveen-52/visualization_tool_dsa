from app.algorithms.huffman import build_huffman, decode_huffman

MAX_TEXT_LENGTH = 100000
MAX_UNIQUE_CHARS = 1000

def process_encode(text: str, include_steps: bool = True) -> dict:
    """
    Orchestrates the Huffman encoding process, integrating the algorithm layer
    and formatting the response payload.
    """
    if not text:
        resp = {
            "encoded": "",
            "codes": {},
            "tree": {}
        }
        if include_steps:
            resp["steps"] = []
        return resp

    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError(f"Input text exceeds maximum allowed length of {MAX_TEXT_LENGTH} characters.")
        
    unique_count = len(set(text))
    if unique_count > MAX_UNIQUE_CHARS:
        raise ValueError(f"Input contains too many unique characters ({unique_count}). Maximum allowed is {MAX_UNIQUE_CHARS}.")

    # Delegate purely architectural step to algorithm layer
    result = build_huffman(text, include_steps=include_steps)
    
    codes = result.get("codes", {})
    tree = result.get("tree", {})
    steps = result.get("steps", [])
    
    # Generate the encoded string
    encoded_text = "".join(codes[char] for char in text) if text and codes else ""
    
    response = {
        "encoded": encoded_text,
        "codes": codes,
        "tree": tree
    }
    
    if include_steps:
        response["steps"] = steps
        
    return response

def process_decode(encoded_text: str, codes: dict) -> dict:
    """
    Orchestrates the Huffman decoding process.
    """
    if not encoded_text or not codes:
        return {"decoded": ""}
        
    decoded_text = decode_huffman(encoded_text, codes)
    
    return {
        "decoded": decoded_text
    }
