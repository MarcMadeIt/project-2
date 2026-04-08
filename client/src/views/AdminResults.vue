<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getAllResults } from '@/api'
import { ChevronLeftIcon, UsersIcon } from '@heroicons/vue/24/outline'

interface AdminResult {
  id: string
  userId: string
  quizTitle: string
  totalPoints: number
  maxPoints: number
  percentage: number
  submittedAt: string
}

const results = ref<AdminResult[]>([])
const loading = ref(true)
const errorMessage = ref('')

function formatDate(date: string) {
  return new Date(date).toLocaleString('da-DK')
}

onMounted(async () => {
  try {
    results.value = await getAllResults()
  } catch (e) {
    errorMessage.value =
      e instanceof Error ? e.message : 'Kunne ikke hente admin-data'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="max-w-6xl mx-auto">
      <div class="mb-6 flex items-center gap-3">
        <RouterLink to="/" class="btn btn-ghost btn-sm">
          <ChevronLeftIcon class="w-4 h-4" />
          Tilbage
        </RouterLink>
        <div class="flex items-center gap-2">
          <UsersIcon class="w-6 h-6 text-warning" />
          <h1 class="text-2xl font-bold">Brugeroversigt</h1>
        </div>
      </div>

      <div v-if="loading" class="text-base-content/70">
        Henter brugeraktivitet...
      </div>

      <div v-else-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div v-else-if="results.length === 0" class="alert">
        Der er ingen registrerede quiz-resultater endnu.
      </div>

      <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th>Bruger</th>
              <th>Quiz</th>
              <th>Score</th>
              <th>Procent</th>
              <th>Tidspunkt</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results" :key="result.id">
              <td>{{ result.userId }}</td>
              <td>{{ result.quizTitle }}</td>
              <td>{{ result.totalPoints }} / {{ result.maxPoints }}</td>
              <td>
                <span class="badge badge-outline">
                  {{ result.percentage }}%
                </span>
              </td>
              <td>{{ formatDate(result.submittedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>