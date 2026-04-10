# Quiz Platform — Projekt 2, 2. Semester

> Vue 3 + Express + TypeScript

Et fullstack quiz-system med rollebaseret adgang (admin/bruger), JSON-baserede quizzer og aktivitetslog.

---

## Tech Stack

| Lag      | Teknologi                          |
| -------- | ---------------------------------- |
| Frontend | Vue 3 + Vite + Tailwind + DaisyUI |
| Backend  | Express + TypeScript               |
| Auth     | JWT med roller (admin/user)        |

---

## Krav

- Node.js `>=20.19.0` eller `>=22.12.0`
- npm

---

## Installation

```bash
# Installer root dependencies (concurrently)
npm install

# Installer client og server dependencies
npm --prefix client install
npm --prefix server install
```

---

## Kørsel

Projektet bruger **concurrently** til at starte både server og client fra hovedmappen:

```bash
npm run dev
```

Dette starter:

- **Server** (Express) — `http://localhost:3000`
- **Client** (Vite) — `http://localhost:5173`

### Andre scripts

```bash
npm run build   # Bygger client og server
npm run start   # Starter server i produktion
```

---

## Projektstruktur

```
project-2/
├── client/            # Vue 3 + Vite + Tailwind + DaisyUI
│   └── src/
├── server/            # Express + TypeScript
│   └── src/
├── package.json       # Root — concurrently, dev/build/start scripts
└── README.md
```
