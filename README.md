# NEC AlgoViz - Algorithm Visualization Platform

This project is organized into two main folders: **`backend/`** (Flask API, routes, and server templates) and **`frontend/`** (React + Vite single-page application).

---

## Project Structure

```text
NEC-ALGOVIZ/
├── backend/
│   ├── app/                # Flask application logic (routes, algorithms, services)
│   ├── templates/          # Jinja2 templates (Huffman, MST, Graph Coloring, etc.)
│   ├── static/             # Static CSS, JavaScript, and media
│   ├── image/              # Algorithm illustrations served at /image/<filename>
│   ├── videos/             # Animation and demo videos
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Flask server entry point (port 5000)
│
├── frontend/
│   ├── src/                # React TypeScript components, pages, hooks, and types
│   ├── index.html          # Vite HTML entry point
│   ├── package.json        # Frontend dependencies and scripts
│   ├── vite.config.ts      # Vite configuration (proxies /api and /image to backend)
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── tsconfig.json       # TypeScript configuration
│
└── README.md
```

---

## Getting Started

### 1. Running the Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python run.py --dev
```

The Flask server will start at:
- **Web App / Visualizers:** http://127.0.0.1:5000
- **Huffman Visualizer:** http://127.0.0.1:5000/huffman
- **React SPA (served via Flask):** http://127.0.0.1:5000/react

---

### 2. Running the Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will start at:
- **Vite Local Dev:** http://localhost:5173

Requests to `/api` and `/image` are automatically proxied to the Flask server running on port `5000`.

To build the frontend for production:
```bash
cd frontend
npm run build
```
*(The production build in `frontend/dist/` will automatically be served by Flask at `/react`)*
