<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getResultById, type ResultDetail, type ResultAnswer } from '@/api'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()

const result = ref<ResultDetail | null>(null)
const loading = ref(true)
const errorMessage = ref('')

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('da-DK')
}

function formatDuration(seconds: number | undefined): string {
  if (seconds == null) return '–'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function formatUserAnswer(answer: ResultAnswer['userAnswer']) {
  if (Array.isArray(answer)) {
    return answer.length ? answer.join(', ') : 'Intet svar'
  }
  return answer || 'Intet svar'
}

function formatCorrectAnswer(answer: ResultAnswer['correctAnswer']) {
  if (Array.isArray(answer)) {
    if (answer.length === 0) return 'Ingen'

    if (typeof answer[0] === 'string') {
      return (answer as string[]).join(', ')
    }

    return (answer as { id: string; text: string }[])
      .map((item) => item.text)
      .join(', ')
  }

  return String(answer)
}

const answerCount = computed(() => result.value?.answers.length ?? 0)

onMounted(async () => {
  try {
    result.value = await getResultById(String(route.params.id))
  } catch (e) {
    errorMessage.value =
      e instanceof Error ? e.message : 'Kunne ikke hente resultat'
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
        <RouterLink to="/results" class="btn btn-ghost btn-sm">
          <ChevronLeftIcon class="w-4 h-4" />
          Tilbage
        </RouterLink>
        <h1 class="text-2xl font-bold">Resultatdetaljer</h1>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-base-content/70">
        Henter resultat...
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- Content -->
      <div v-else-if="result" class="space-y-6">
        <!-- Summary card -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">{{ result.quizTitle }}</h2>
            <p class="text-sm text-base-content/50">
              Gennemført: {{ formatDate(result.submittedAt) }}
            </p>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="stat bg-base-200 rounded-box">
                <div class="stat-title">Score</div>
                <div class="stat-value text-primary text-2xl">
                  {{ result.totalPoints }} / {{ result.maxPoints }}
                </div>
              </div>

              <div class="stat bg-base-200 rounded-box">
                <div class="stat-title">Procent</div>
                <div class="stat-value text-secondary text-2xl">
                  {{ result.percentage }}%
                </div>
              </div>

              <div class="stat bg-base-200 rounded-box">
                <div class="stat-title">Spørgsmål</div>
                <div class="stat-value text-2xl">
                  {{ answerCount }}
                </div>
              </div>

              <div class="stat bg-base-200 rounded-box">
                <div class="stat-title">Tid brugt</div>
                <div class="stat-value text-2xl">
                  {{ formatDuration(result.timeTakenSeconds) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Answers -->
        <div class="space-y-4">
          <div
            v-for="(answer, index) in result.answers"
            :key="answer.questionId"
            class="card bg-base-100 shadow-sm"
          >
            <div class="card-body">
              <div class="flex items-center justify-between gap-4">
                <h3 class="font-semibold">Spørgsmål {{ index + 1 }}</h3>

                <div
                  class="badge"
                  :class="answer.correct ? 'badge-success' : 'badge-error'"
                >
                  {{ answer.correct ? 'Korrekt' : 'Forkert' }}
                </div>
              </div>

              <div class="text-sm text-base-content/70 space-y-2">
                <p>
                <strong>Spørgsmål:</strong>
                {{ answer.questionText || `Spørgsmål ${index + 1}` }}
                </p>

                <p>
                <strong>Dit svar:</strong>
                {{ formatUserAnswer(answer.userAnswerText ?? answer.userAnswer) }}
                </p>

                <p v-if="!answer.correct">
                <strong>Korrekt svar:</strong>
                {{ formatCorrectAnswer(answer.correctAnswer) }}
                </p>

                <p>
                  <strong>Point:</strong>
                  {{ answer.points }} / {{ answer.maxPoints }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Safety fallback -->
      <div v-else class="alert">
        Resultatet kunne ikke vises.
      </div>
    </div>
  </div>
</template>