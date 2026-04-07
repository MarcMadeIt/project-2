# Quiz Platform — Projekt 2, 2. Semester

> Vue + Express · 3 arbejdsdage · Emne: Datastrukturer

Et fullstack quiz-system med rollebaseret adgang (admin/bruger), XML-baserede quizzer og aktivitetslog.

---

## Tech Stack

| Lag       | Teknologi                            |
|-----------|--------------------------------------|
| Frontend  | Vue 3 + Vite + Tailwind + DaisyUI   |
| Backend   | Express + TypeScript                 |
| Database  | SQLite eller PostgreSQL              |
| Auth      | JWT med roller (admin/user)          |
| Sikkerhed | bcrypt, rate limiting, HTML-sanitering |

---

## Krav

- Node.js `>=20.19.0` eller `>=22.12.0`
- npm

---

## Opsætning og kørsel

### 1. Server (Express — port 3000)

```bash
cd server
npm install
npm run dev
```

### 2. Klient (Vue 3 / Vite — port 5173)

```bash
cd client
npm install
npm run dev
```

Åbn `http://localhost:5173` i browseren.

### Test-bruger

| Email          | Password      |
|----------------|---------------|
| user@test.dk   | password123   |

---

## Backlog

### Dag 1 — Fundament & Auth (~7.5t)

| Type | Opgave | Beskrivelse | Tid |
|------|--------|-------------|-----|
| AUTH | Projektopsætning | Turborepo/monorepo, Vue Vite frontend, Express backend, mappestruktur | 1t |
| DATA | Database schema | Tabeller: users, roles, quizzes, sessions, logs — SQLite eller PostgreSQL | 1t |
| SEC  | Brugerregistrering med stærkt password | bcrypt hash+salt, passwordvalidering (min 8 tegn, tal, special), gem sikkert | 1.5t |
| AUTH | Login + session / JWT | JWT med rolle (admin/user) i payload, beskyttede routes via middleware | 1.5t |
| UI   | Login & registrering UI | Vue-formularer med validering, redirect baseret på rolle efter login | 1.5t |
| API  | Rollebaseret routing | Vue Router guards: /admin/* kun for admins, /quiz/* kun for brugere (og admins) | 1t |

### Dag 2 — Quiz-motor & Admin (~10t)

| Type | Opgave | Beskrivelse | Tid |
|------|--------|-------------|-----|
| DATA | XML-parser til quizfiler | Parser Operatorer.xml, understøtter multiple-choice (en/flere svar) + cloze | 2t |
| SEC  | Sanitering af quiz-HTML | Kun `<strong>`, `<br>`, `<span>` + italic/underline tilladt — fjern `<script>` og al anden HTML | 1t |
| API  | Quiz-session API | Server sender ét spørgsmål ad gangen (shufflet), korrekte svar aldrig til client før svar er afgivet | 2t |
| API  | Pointberegning backend | Fuld point, delvise point (færre rigtige), fradrag ved forkerte svar — logik på server | 1.5t |
| UI   | Quiz-spiller UI | Ét spørgsmål ad gangen, progress-indikator, radio/checkbox, submit → feedback → næste | 2t |
| UI   | Admin: upload & slet quizfiler | Filupload til server, liste over uploadede quizzer, slet-funktion | 1.5t |

### Dag 3 — Statistik, Log & Quizindhold (~8-9t)

| Type | Opgave | Beskrivelse | Tid |
|------|--------|-------------|-----|
| API  | Aktivitetslog | Log: hvem, hvilken quiz, hvornår, varighed, resultat — admin kan se alle brugeres log | 1.5t |
| UI   | Admin: brugeroversigt & log UI | Tabel med alle brugere og deres quiz-historik + resultater | 1.5t |
| UI   | Bruger: resultater & historik | Nuværende og tidligere resultater, quizresultat-opsummering med alle spørgsmål/svar | 1.5t |
| DATA | Datastruktur-quiz (10+ spørgsmål) | Arrays, linked lists, stacks, queues, trees, hash maps — XML/JSON-format, mix af typer | 2t |
| UI   | Quiz-afslutning & statistik UI | Samlet score, procentvis resultat, gennemgang af alle spørgsmål og svar | 1t |
| API  | Shuffle-logik + tilfældig rækkefølge *(nice to have)* | Fisher-Yates shuffle på spørgsmål og svarmuligheder server-side per session | 0.5t |
| AUTH | Hold-system *(bonus)* | Opret hold, tildel brugere og quizzer til hold — admin UI | 2-3t |

---

## Projektstruktur

```
project-2/
├── client/          # Vue 3 + Vite + Tailwind + DaisyUI
│   └── src/
│       ├── views/   # Login, Register, Home, Quiz, Admin
│       ├── router/  # Rollebaserede route guards
│       └── api.ts   # API-klient & auth state
├── server/          # Express + TypeScript
│   └── src/
│       ├── routes/  # auth, quiz, admin endpoints
│       ├── db/      # Database-lag
│       └── middleware/  # Auth, rate limiting
└── README.md
```

---

(Bemærk: .env-filen er inkluderet udelukkende til undervisningsbrug. Den indeholder ingen følsomme oplysninger.)
