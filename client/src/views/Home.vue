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
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-base-200 p-4">
    <div class="max-w-2xl mx-auto">
      <header class="navbar bg-base-100 rounded-lg shadow mb-4 px-4">
        <div class="flex-1">
          <span class="text-xl font-semibold">Forside</span>
        </div>
        <div class="flex gap-2">
          <template v-if="isLoggedIn && user">
            <span class="text-sm text-base-content/70 self-center">{{ user.email }}</span>
            <button type="button" class="btn btn-ghost btn-sm" @click="onLogout">
              Log ud
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-ghost btn-sm">Log ind</router-link>
            <router-link to="/register" class="btn btn-primary btn-sm">Opret bruger</router-link>
          </template>
        </div>
      </header>
      <main class="bg-base-100 rounded-lg shadow p-6">
        <p v-if="isLoggedIn && user" class="text-base-content/80">
          Hej {{ user.email }}, du er logget ind.
        </p>
        <p v-else class="text-base-content/80">
          Log ind for at fortsætte.
        </p>
      </main>
    </div>
  </div>
</template>
