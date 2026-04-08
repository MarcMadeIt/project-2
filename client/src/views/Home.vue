<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isLoggedIn, loadUser, logout } from '@/api'
import {
  LightBulbIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UsersIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/24/solid'

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
        <!-- Always shown: Quiz -->
        <router-link
          :to="{ name: 'quiz', params: { id: 'quiz_datastructures_001' } }"
          class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div class="card-body">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardDocumentCheckIcon class="w-5 h-5 text-primary" />
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
                <ChartBarIcon class="w-5 h-5 text-secondary" />
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
          <div
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
          </div>

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
