import sys
import os
from flask import Flask, render_template, send_from_directory, request
from waitress import serve

from app.routes.graph_routes import graph_bp
from app.routes.mst_routes import mst_bp
from app.routes.huffman_routes import huffman_bp

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key")

# Explicitly set cache duration (12 hours) regardless of debug mode
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 43200


@app.after_request
def add_cache_headers(response):
    """Ensure static assets get cached by browser even during development."""
    if request.path.startswith('/static/') or request.path.startswith('/image/'):
        response.headers['Cache-Control'] = 'public, max-age=43200'
    return response


@app.route('/image/<path:filename>')
def serve_image_folder(filename):
    return send_from_directory(os.path.join(app.root_path, 'image'), filename)


@app.context_processor
def utility_processor():
    return dict(chr=chr)


app.register_blueprint(graph_bp)
app.register_blueprint(mst_bp)
app.register_blueprint(huffman_bp)


# NEW LANDING PAGE
@app.route("/")
def landing():
    return render_template("landing.html")


# OLD HOME PAGE MOVED HERE
@app.route("/dashboard")
def dashboard():
    stats = {
        "total_graphs": 24,
        "algorithms_used": 3,
        "sessions": 58
    }

    recent_activity = [
        "Ran Graph Coloring on 12 nodes",
        "Generated MST using Prim's algorithm",
        "Created Huffman tree for compression"
    ]

    return render_template(
        "home.html",
        stats=stats,
        recent_activity=recent_activity
    )


@app.route("/about")
def about():
    return render_template("about.html")


if __name__ == "__main__":
    is_dev = os.environ.get("FLASK_ENV") == "development" or "--dev" in sys.argv
    if is_dev:
        print("Starting Flask Built-in Development Server (Debug Mode)...", flush=True)
        app.run(debug=True, host="127.0.0.1", port=5000)
    else:
        print("Starting Production WSGI Server (Waitress) on http://127.0.0.1:5000 ...", flush=True)
        serve(app, host="127.0.0.1", port=5000, threads=8)