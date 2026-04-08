import { computed, ref } from 'vue'

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface User {
  id: string
  email: string
  role: "admin" | "user"
  createdAt: string
}

const tokenKey = 'auth_token'
const userKey = 'auth_user'

function parseStoredUser(): User | null {
  const raw = localStorage.getItem(userKey)
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const currentUser = ref<User | null>(parseStoredUser())
export const isLoggedIn = computed(() => !!currentUser.value)

export function getStoredToken(): string | null {
  return localStorage.getItem(tokenKey)
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(tokenKey, token)
  else localStorage.removeItem(tokenKey)
}

export function setStoredUser(user: User | null) {
  if (user) localStorage.setItem(userKey, JSON.stringify(user))
  else localStorage.removeItem(userKey)
}

export function loadUser() {
  currentUser.value = parseStoredUser()
  return currentUser.value
}

function setAuth(user: User | null, token: string | null = null) {
  currentUser.value = user
  setStoredToken(token)
  setStoredUser(user)
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const normalisedEmail = normaliseEmail(email)
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalisedEmail, password }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      data?.error ?? (res.status === 401 ? 'Ugyldig email eller password.' : 'Login fejlede')
    throw new Error(msg)
  }
  return { user: data.user, token: data.token }
}

export async function registerRequest(email: string, password: string): Promise<{ user: User }> {
  const normalisedEmail = normaliseEmail(email)
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalisedEmail, password }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      data?.error ||
      (res.status === 429 ? 'For mange forsøg – prøv om et minut' : 'Registrering fejlede')
    throw new Error(msg)
  }
  return { user: data.user }
}

export async function login(email: string, password: string) {
  const { user, token } = await loginRequest(email, password)
  setAuth(user, token)
  return user
}

export async function register(email: string, password: string) {
  await registerRequest(email, password)
  const { user, token } = await loginRequest(email, password)
  setAuth(user, token)
  return user
}

export interface ResultSummary {
  id: string
  quizId: string
  quizTitle: string
  totalPoints: number
  maxPoints: number
  percentage: number
  submittedAt: string
}

export interface ResultAnswer {
  questionId: string
  userAnswer: string[] | string
  correct: boolean
  points: number
  maxPoints: number
  correctAnswer: { id: string; text: string }[] | string[]
}

export interface ResultDetail {
  id: string
  userId: string
  quizId: string
  quizTitle: string
  totalPoints: number
  maxPoints: number
  percentage: number
  submittedAt: string
  answers: ResultAnswer[]
}

export async function getMyResults(): Promise<ResultSummary[]> {
  const res = await fetch(`${API_BASE}/results`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.error ?? 'Kunne ikke hente resultater')
  }

  return data.results
}

export async function getResultById(resultId: string): Promise<ResultDetail> {
  const res = await fetch(`${API_BASE}/results/${resultId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.error ?? 'Kunne ikke hente resultat')
  }

  return data
}

export function logout() {
  setAuth(null, null)
}
