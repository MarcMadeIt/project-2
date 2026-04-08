<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getMyResults, type ResultSummary } from '@/api'
import { ChartBarIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'

const results = ref<ResultSummary[]>([])
const loading = ref(true)
const errorMessage = ref('')

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('da-DK')
}

onMounted(async () => {
  try {
    results.value = await getMyResults()
  } catch (e) {
    errorMessage.value =
      e instanceof Error ? e.message : 'Kunne ikke hente resultater'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="max-w-5xl mx-auto">
      
      <!-- Header -->
      <div class="mb-6 flex items-center gap-3">
        <RouterLink to="/" class="btn btn-ghost btn-sm">
          <ChevronLeftIcon class="w-4 h-4" />
          Tilbage
        </RouterLink>
        <h1 class="text-2xl font-bold">Mine resultater</h1>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-base-content/70">
        Henter resultater...
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- Empty -->
      <div v-else-if="results.length === 0" class="alert">
        Du har ikke gennemført nogen quizzer endnu.
      </div>

      <!-- Results list -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RouterLink
          v-for="result in results"
          :key="result.id"
          :to="{ name: 'result-detail', params: { id: result.id } }"
          class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="card-body">
            <div class="flex items-start justify-between gap-4">
              
              <!-- Left -->
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <ChartBarIcon class="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 class="font-semibold">{{ result.quizTitle }}</h2>
                  <p class="text-sm text-base-content/50">
                    {{ formatDate(result.submittedAt) }}
                  </p>
                </div>
              </div>

              <!-- Right -->
              <div class="badge badge-outline">
                {{ result.percentage }}%
              </div>
            </div>

            <!-- Score -->
            <div class="mt-3">
              <p class="text-sm text-base-content/70">
                Score: {{ result.totalPoints }} / {{ result.maxPoints }}
              </p>

              <progress
                class="progress progress-secondary w-full mt-2"
                :value="result.percentage"
                max="100"
              />
            </div>
          </div>
        </RouterLink>
      </div>

    </div>
  </div>
</template>