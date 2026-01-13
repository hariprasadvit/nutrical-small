# NutriCal - Nutrition Label Generator

GCC's first food nutrition labels generator & calorie analysis software.

## Features

- **Label Template Builder** - Visual drag-and-drop editor for creating custom nutrition label layouts
- **Product/Recipe Management** - Add products with ingredients, auto-calculate nutrition
- **Multi-format Labels** - Support for Vertical, Tabular, Dual Column, Linear, Aggregate displays
- **Saudi FDA Compliance** - Built-in compliance with GCC food labeling regulations
- **Export** - Generate labels as PNG/PDF/SVG

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS |
| State Management | Zustand |
| Backend | Python FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 |

## Quick Start

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations (after setting up PostgreSQL)
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start dev server
npm run dev
```

App available at: http://localhost:5173

## Project Structure

```
nutrical/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # API routes
│   │   ├── core/               # Config, security, database
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client
│   │   ├── store/              # Zustand stores
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── .env.example
├── VIBE_CODING_PROMPT.md       # Development guide
└── README.md
```

## Development Guide

See [VIBE_CODING_PROMPT.md](./VIBE_CODING_PROMPT.md) for detailed development instructions and implementation phases.

## License

MIT
