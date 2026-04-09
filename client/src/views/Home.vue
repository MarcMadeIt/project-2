<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE, currentUser, getAuthHeaders, isLoggedIn, loadUser, logout, deleteQuiz,} from '@/api'
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

const deleteTarget = ref<QuizData | null>(null)
const deleteLoading = ref(false)

function openDeleteModal(quiz: QuizData) {
  deleteTarget.value = quiz
  ;(document.getElementById('delete-modal') as HTMLDialogElement)?.showModal()
}

async function confirmDelete() {
  if (!deleteTarget.value) return

  deleteLoading.value = true
  try {
    await deleteQuiz(deleteTarget.value.id)
    ;(document.getElementById('delete-modal') as HTMLDialogElement)?.close()
    deleteTarget.value = null
    await fetchQuizes()
  } catch (e: any) {
    error.value = e.message || 'Kunne ikke slette quizzen.'
  } finally {
    deleteLoading.value = false
  }
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

      <!-- Quizzer -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Quizzer</h2>

        <template v-if="loading">
          <div class="flex items-center justify-center py-8">
            <span class="loading loading-spinner"></span>
          </div>
        </template>

        <template v-else-if="error">
          <div class="alert alert-error">
            <span>{{ error }}</span>
          </div>
        </template>

        <template v-else-if="quizzes && quizzes.length">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="quiz in quizzes"
              :key="quiz.id"
              class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="card-body">
                <div class="flex items-center justify-between gap-4">

                  <router-link
                    :to="{ name: 'quiz', params: { id: quiz.id } }"
                    class="flex items-center gap-3 flex-1"
                  >
                    <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ClipboardDocumentCheckIcon class="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 class="font-semibold">{{ quiz.title }}</h2>
                      <p class="text-sm text-base-content/50">Quiz</p>
                    </div>
                  </router-link>

                  <button
                    v-if="user?.role === 'admin'"
                    class="btn btn-sm btn-error btn-outline"
                    @click="openDeleteModal(quiz)"
                  >
                    Fjern
                  </button>

                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <p class="text-base-content/50">Ingen quizzer tilgængelige.</p>
        </template>
      </div>

      <div class="divider"></div>

      <!-- Action buttons -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <router-link
          :to="{ name: 'results' }"
          class="btn btn-soft h-auto py-4 flex items-center gap-3 justify-start"
        >
          <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
            <ChartBarIcon class="w-5 h-5 text-secondary" />
          </div>
          <div class="text-left">
            <div class="font-semibold">Mine resultater</div>
            <div class="text-xs text-base-content/50 font-normal">Historik & statistik</div>
          </div>
        </router-link>

        <template v-if="user?.role === 'admin'">
          <router-link
            :to="{ name: 'admin-results' }"
            class="btn btn-soft h-auto py-4 flex items-center gap-3 justify-start"
          >
            <div class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <UsersIcon class="w-5 h-5 text-warning" />
            </div>
            <div class="text-left">
              <div class="font-semibold">Brugeroversigt</div>
              <div class="text-xs text-base-content/50 font-normal">Alle brugere & resultater</div>
            </div>
          </router-link>

          <router-link
            :to="{ name: 'admin-create-quiz' }"
            class="btn btn-soft h-auto py-4 flex items-center gap-3 justify-start"
          >
            <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <ArrowUpTrayIcon class="w-5 h-5 text-accent" />
            </div>
            <div class="text-left">
              <div class="font-semibold">Opret quiz</div>
              <div class="text-xs text-base-content/50 font-normal">Multichoice quizzer</div>
            </div>
          </router-link>
        </template>
      </div>
    </main>

    <!-- Delete confirmation modal -->
    <dialog id="delete-modal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Slet quiz</h3>
        <p class="py-4">
          Er du sikker på, at du vil slette
          <strong>{{ deleteTarget?.title }}</strong
          >?
        </p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Annuller</button>
          </form>
          <button
            class="btn btn-error"
            :disabled="deleteLoading"
            @click="confirmDelete"
          >
            {{ deleteLoading ? 'Sletter...' : 'Slet' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
