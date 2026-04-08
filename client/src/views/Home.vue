<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE, currentUser, getAuthHeaders, isLoggedIn, loadUser, logout } from '@/api'
import {
  LightBulbIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UsersIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/24/solid'

interface QuizData {
  id: string
  title: string
  link: string
}

onMounted(async () => {
  loadUser()
  fetchQuizes()
})

const router = useRouter()
const user = currentUser
const loading = ref(true)
const error = ref('')
const quizzes = ref<QuizData[] | null>(null)

onMounted(() => {
  loadUser()
})

function onLogout() {
  logout()
  router.push({ name: 'welcome' })
}

async function fetchQuizes() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/quizzes`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Kunne ikke hente quizzen.')
    quizzes.value = (await res.json())?.quizzes as QuizData[]
  } catch (e: any) {
    error.value = e.message || 'Noget gik galt.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Navbar -->
    <header class="navbar bg-base-100 shadow-sm p-6">
      <div class="flex-1 gap-2 flex items-center">
        <LightBulbIcon class="w-6 h-6 text-primary" />
        <span class="text-lg font-bold">Quiz</span>
      </div>
      <div class="flex-none flex items-center gap-3">
        <template v-if="isLoggedIn && user">
          <div class="flex items-center gap-2">
            <span v-if="user.role === 'admin'" class="badge badge-primary badge-sm"> Admin </span>
            <span class="text-sm text-base-content/70">{{ user.email }}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="onLogout">Log ud</button>
        </template>
      </div>
    </header>

    <!-- Content -->
    <main class="py-4">
      <!-- Welcome card -->
      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <h1 class="card-title text-2xl">Hej, {{ user?.email?.split('@')[0] }}</h1>
          <p class="text-base-content/60">
            <template v-if="user?.role === 'admin'">
              Du er logget ind som administrator. Du kan administrere quizzer og se alle brugeres
              resultater.
            </template>
            <template v-else>
              Klar til at teste din viden? Vælg en quiz herunder for at komme i gang.
            </template>
          </p>
        </div>
      </div>

      <!-- Role-based dashboard cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Quizzes from API -->
        <template v-if="!loading && quizzes">
          <router-link
            v-for="quiz in quizzes"
            :key="quiz.id"
            :to="{ name: 'quiz', params: { id: quiz.id } }"
            class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="card-body">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardDocumentCheckIcon class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 class="font-semibold">{{ quiz.title }}</h2>
                  <p class="text-sm text-base-content/50">Quiz</p>
                </div>
              </div>
            </div>
          </router-link>
        </template>

        <!-- Loading state -->
        <template v-if="loading">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body flex items-center justify-center">
              <span class="loading loading-spinner"></span>
            </div>
          </div>
        </template>

        <!-- Error state -->
        <template v-if="error">
          <div class="alert alert-error">
            <span>{{ error }}</span>
          </div>
        </template>

        <!-- Always shown: Results -->
        <router-link
          :to="{ name: 'results' }"
          class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="card-body">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <ChartBarIcon class="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 class="font-semibold">Mine resultater</h2>
                <p class="text-sm text-base-content/50">Historik & statistik</p>
              </div>
            </div>
          </div>
        </router-link>

        <!-- Admin only cards -->
        <template v-if="user?.role === 'admin'">
          <router-link
            v-if="user?.role === 'admin'"
            :to="{ name: 'admin-results' }"
            class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-primary/10"
          >
            <div class="card-body">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <UsersIcon class="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 class="font-semibold">Brugeroversigt</h2>
                  <p class="text-sm text-base-content/50">Alle brugere & resultater</p>
                </div>
              </div>
            </div>
          </router-link>

          <div
            class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-primary/10"
          >
            <div class="card-body">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ArrowUpTrayIcon class="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 class="font-semibold">Upload quiz</h2>
                  <p class="text-sm text-base-content/50">XML / JSON quizfiler</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
