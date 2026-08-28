from flask import Blueprint, render_template, request, jsonify
from app.services.huffman_service import process_encode, process_decode

huffman_bp = Blueprint("huffman", __name__)

@huffman_bp.route("/huffman", methods=["GET"])
def huffman_index():
    return render_template("huffman/index.html")

@huffman_bp.route("/huffman/visualize", methods=["GET"])
def huffman_visualize():
    return render_template("huffman/visualize.html")

@huffman_bp.route("/huffman/decoder", methods=["GET"])
def huffman_decoder():
    return render_template("huffman/decoder.html")

@huffman_bp.route("/huffman/decoder/visualize", methods=["GET"])
def huffman_decoder_visualize():
    return render_template("huffman/decoder_visualize.html")

# Preserving other UI routes to prevent HTML/Navigation breaks
@huffman_bp.route("/huffman/result", methods=["GET"])
def huffman_result():
    return render_template("huffman/result_page.html")

@huffman_bp.route("/huffman/animate", methods=["GET"])
def huffman_animate():
    return render_template("huffman/animate.html")


@huffman_bp.route("/huffman/encode", methods=["POST"])
def huffman_encode():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400

        text = data.get("text", "")
        if not text:
            return jsonify({"error": "Text cannot be empty"}), 400
            
        include_steps = data.get("include_steps", True)

        # Delegate execution to service layer
        result = process_encode(text, include_steps=include_steps)

        return jsonify(result), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


@huffman_bp.route("/huffman/decode", methods=["POST"])
def huffman_decode():
    try:
        data = request.get_json()
        if not data or "encoded" not in data or "codes" not in data:
            return jsonify({"error": "Both 'encoded' text and 'codes' map are required"}), 400

        encoded_text = data.get("encoded", "")
        codes = data.get("codes", {})

        if not codes:
            return jsonify({"error": "Codes mapping is missing or empty"}), 400

        result = process_decode(encoded_text, codes)

        return jsonify(result), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500