<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isLoggedIn, loadUser, logout } from '@/api'

const router = useRouter()
const user = currentUser

onMounted(() => {
  loadUser()
})

function onLogout() {
  logout()
  router.push({ name: 'welcome' })
}
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Navbar -->
    <header class="navbar bg-base-100 shadow-sm px-4 lg:px-8">
      <div class="flex-1 gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span class="text-lg font-bold">Quiz</span>
      </div>
      <div class="flex-none flex items-center gap-3">
        <template v-if="isLoggedIn && user">
          <div class="flex items-center gap-2">
            <span
              v-if="user.role === 'admin'"
              class="badge badge-primary badge-sm"
            >
              Admin
            </span>
            <span class="text-sm text-base-content/70">{{ user.email }}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="onLogout">
            Log ud
          </button>
        </template>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto p-4 lg:p-8">
      <!-- Welcome card -->
      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <h1 class="card-title text-2xl">
            Hej, {{ user?.email?.split('@')[0] }}
          </h1>
          <p class="text-base-content/60">
            <template v-if="user?.role === 'admin'">
              Du er logget ind som administrator. Du kan administrere quizzer og se alle brugeres resultater.
            </template>
            <template v-else>
              Klar til at teste din viden? Vælg en quiz herunder for at komme i gang.
            </template>
          </p>
        </div>
      </div>

      <!-- Role-based dashboard cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Always shown: Quiz -->
        <router-link :to="{ name: 'quiz', params: { id: 'quiz_datastructures_001' } }" class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div class="card-body">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h2 class="font-semibold">Tag en quiz</h2>
                <p class="text-sm text-base-content/50">Datastrukturer</p>
              </div>
            </div>
          </div>
        </router-link>

        <!-- Always shown: Results -->
        <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="card-body">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 class="font-semibold">Mine resultater</h2>
                <p class="text-sm text-base-content/50">Historik & statistik</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin only cards -->
        <template v-if="user?.role === 'admin'">
          <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-primary/10">
            <div class="card-body">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-warning"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="font-semibold">Brugeroversigt</h2>
                  <p class="text-sm text-base-content/50">Alle brugere & resultater</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-primary/10">
            <div class="card-body">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
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
