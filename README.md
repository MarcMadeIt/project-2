
<img width="384" height="192" alt="image" src="https://github.com/user-attachments/assets/81a8f570-3da4-4dfa-8754-7cb3f24eb080" />


# Projekt A, 2. Semester - PB Webudvikling

Et fullstack-projekt med en **Vue 3**-klient og en **Express**-server.

## Funktioner
- Opret bruger (register)
- Login / logout
- Validering af formularer
- Password hashing
- Rate limiting på login/register
- Simpel lagring af brugere


## Krav

- Node.js `>=20.19.0` eller `>=22.12.0`
- npm

---

## Opsætning og kørsel

### 1. Server (Express – port 3000)

```bash
cd server
npm install
npm run dev
```

Serveren starter på `http://localhost:3000`.

### 2. Klient (Vue 3 / Vite – port 5173)

Åbn en ny terminal:

```bash
cd client
npm install
npm run dev
```

Klienten starter på `http://localhost:5173`.

---

(Bemærk: .env-filen er inkluderet i projektet udelukkende til undervisningsbrug. Den indeholder ingen følsomme eller produktionskritiske oplysninger.)

## Test af projektet

1. Start **serveren** i én terminal (`cd server && npm run dev`)
2. Start **klienten** i en anden terminal (`cd client && npm run dev`)
3. Åbn browseren på `http://localhost:5173`
4. Opret en bruger via **Register**-siden
5. Log ind via **Login**-siden
6. Du lander på **Home**-siden, som bekræfter at auth-flowet virker

Du kan også teste API'et direkte:

```bash
# Tjek at serveren kører
curl http://localhost:3000

# Registrer en bruger
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Log ind
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

---

## Projektstruktur

```
s2-project-a/
├── client/   # Vue 3 + Vite + Tailwind + DaisyUI
└── server/   # Express + TypeScript
```
