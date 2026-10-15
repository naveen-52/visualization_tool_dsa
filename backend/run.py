import sys
import os
from flask import Flask, render_template, send_from_directory, request
from flask_mail import Mail
from dotenv import load_dotenv

# Load environment variables from .env before anything else
load_dotenv()

try:
    from waitress import serve
    _has_waitress = True
except ImportError:
    _has_waitress = False

from app.routes.graph_routes import graph_bp
from app.routes.mst_routes import mst_bp
from app.routes.huffman_routes import huffman_bp
from app.routes.contact_routes import contact_bp
from app.routes.api_routes import api_bp


app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key")

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True

# -- Flask-Mail Configuration (loaded from .env) --------------------------------
app.config['MAIL_SERVER']   = os.environ.get('MAIL_SERVER',   'smtp.gmail.com')
app.config['MAIL_PORT']     = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS']  = os.environ.get('MAIL_USE_TLS',  'True').lower() == 'true'
app.config['MAIL_USE_SSL']  = os.environ.get('MAIL_USE_SSL',  'False').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = (
    'NEC AlgoViz',
    os.environ.get('MAIL_USERNAME', '')
)

# Initialise Flask-Mail
mail = Mail(app)


# -- Startup SMTP Configuration Validator --------------------------------------
def _validate_mail_config():
    """
    Runs once at startup.
    Prints a clear status table showing every SMTP env var.
    Flags placeholder / empty values without crashing the server.
    """
    PLACEHOLDER_USER = "your_sender_gmail@gmail.com"
    PLACEHOLDER_PASS = "your_16char_app_password"

    username = app.config.get("MAIL_USERNAME", "")
    password = app.config.get("MAIL_PASSWORD", "")
    sender   = app.config.get("MAIL_DEFAULT_SENDER", "")
    admin    = os.environ.get("ADMIN_EMAIL", "24205005@nec.edu.in")

    errors = []

    if not username:
        errors.append("  [!!] MAIL_USERNAME is EMPTY -- set it to your Gmail address in .env")
    elif username == PLACEHOLDER_USER:
        errors.append(
            "  [!!] MAIL_USERNAME is still the placeholder value: "
            f"{username!r}\n"
            "       Replace it with your actual Gmail address in .env"
        )

    if not password:
        errors.append("  [!!] MAIL_PASSWORD is EMPTY -- set it to your Gmail App Password in .env")
    elif password == PLACEHOLDER_PASS:
        errors.append(
            "  [!!] MAIL_PASSWORD is still the placeholder value.\n"
            "       Generate an App Password at https://myaccount.google.com/apppasswords\n"
            "       and set it in .env as MAIL_PASSWORD"
        )

    SEP  = "=" * 62
    DASH = "-" * 62

    print("", flush=True)
    print(SEP, flush=True)
    print("  NEC AlgoViz -- SMTP Configuration Check", flush=True)
    print(SEP, flush=True)
    print(f"  MAIL_SERVER         : {app.config.get('MAIL_SERVER')}", flush=True)
    print(f"  MAIL_PORT           : {app.config.get('MAIL_PORT')}", flush=True)
    print(f"  MAIL_USE_TLS        : {app.config.get('MAIL_USE_TLS')}", flush=True)
    print(f"  MAIL_USERNAME       : {username!r}", flush=True)
    print(f"  MAIL_PASSWORD       : {'*' * len(password) if password else '(EMPTY)'}", flush=True)
    print(f"  MAIL_DEFAULT_SENDER : {sender}", flush=True)
    print(f"  ADMIN_EMAIL         : {admin!r}", flush=True)
    print(DASH, flush=True)

    if errors:
        print("  [ERROR] MAIL CONFIG ERRORS DETECTED -- server will start", flush=True)
        print("          but email submissions will FAIL until resolved:", flush=True)
        print("", flush=True)
        for err in errors:
            print(err, flush=True)
        print("", flush=True)
        print(DASH, flush=True)
        print("  HOW TO FIX:", flush=True)
        print("  1. Open .env in the project root", flush=True)
        print("  2. Set  MAIL_USERNAME=your_actual_gmail@gmail.com", flush=True)
        print("  3. Set  MAIL_PASSWORD=xxxx xxxx xxxx xxxx  (App Password)", flush=True)
        print("  4. Get an App Password:", flush=True)
        print("     -> https://myaccount.google.com/apppasswords", flush=True)
        print("  5. Restart the server after saving .env", flush=True)
    else:
        print("  [OK] MAIL_USERNAME       : loaded correctly", flush=True)
        print("  [OK] MAIL_PASSWORD       : loaded correctly", flush=True)
        print("  [OK] MAIL_DEFAULT_SENDER : loaded correctly", flush=True)
        print("  [OK] ADMIN_EMAIL         : 24205005@nec.edu.in", flush=True)
        print("  [OK] SMTP config valid -- ready to send emails", flush=True)

    print(SEP, flush=True)
    print("", flush=True)


_validate_mail_config()


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
app.register_blueprint(contact_bp)
app.register_blueprint(api_bp)



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


# React SPA routes
@app.route("/react")
@app.route("/react/<path:path>")
def serve_react(path=""):
    dist_dir = os.path.join(app.root_path, "..", "frontend", "dist")
    if not os.path.exists(dist_dir):
        dist_dir = os.path.join(app.root_path, "dist")

    if os.path.exists(dist_dir):
        if path != "" and os.path.exists(os.path.join(dist_dir, path)):
            return send_from_directory(dist_dir, path)
        return send_from_directory(dist_dir, "index.html")
    return "React build not found. Run 'npm run build' inside the frontend directory first.", 404


@app.route("/assets/<path:filename>")
def serve_react_assets(filename):
    dist_assets = os.path.join(app.root_path, "..", "frontend", "dist", "assets")
    if not os.path.exists(dist_assets):
        dist_assets = os.path.join(app.root_path, "dist", "assets")
    return send_from_directory(dist_assets, filename)



application = app

@app.route("/vite.svg")
def serve_vite_icon():
    dist_dir = os.path.join(app.root_path, "..", "frontend", "dist")
    if os.path.exists(os.path.join(dist_dir, "vite.svg")):
        return send_from_directory(dist_dir, "vite.svg")
    return send_from_directory(os.path.join(app.root_path, "static"), "vite.svg", silent=True) or ("", 404)


if __name__ == "__main__":
    is_dev = os.environ.get("FLASK_ENV") == "development" or "--dev" in sys.argv
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "127.0.0.1" if is_dev else "0.0.0.0")

    if is_dev:
        print(f"Starting Flask Built-in Development Server on http://{host}:{port} (Debug Mode)...", flush=True)
        app.run(debug=True, host=host, port=port)
    else:
        threads = int(os.environ.get("THREADS", 32))
        connection_limit = int(os.environ.get("CONNECTION_LIMIT", 250))
        channel_timeout = int(os.environ.get("CHANNEL_TIMEOUT", 30))

        if _has_waitress:
            print(f"Starting Production WSGI Server (Waitress) on http://{host}:{port} with {threads} threads (max {connection_limit} connections)...", flush=True)
            serve(
                app,
                host=host,
                port=port,
                threads=threads,
                connection_limit=connection_limit,
                channel_timeout=channel_timeout
            )
        else:
            print(f"Waitress not found. Starting Flask Built-in Server on http://{host}:{port} ...", flush=True)
            app.run(host=host, port=port)