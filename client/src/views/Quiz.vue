<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE, getAuthHeaders } from '@/api'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()

interface Option {
  id: string
  text: string
}

interface QuestionBase {
  id: string
  questionText: string
}

interface ChoiceQuestion extends QuestionBase {
  type: 'single_choice' | 'multiple_choice'
  options: Option[]
}

interface ClozeQuestion extends QuestionBase {
  type: 'cloze'
  caseSensitive: boolean
  trimWhitespace: boolean
}

type Question = ChoiceQuestion | ClozeQuestion

interface QuizData {
  id: string
  title: string
  description: string
  questions: Question[]
}

interface QuestionResult {
  questionId: string
  correct: boolean
  points: number
  maxPoints: number
  userAnswer: string[] | string
  correctAnswer: string[]
}

interface ValidationResult {
  quizId: string
  title: string
  totalPoints: number
  maxPoints: number
  percentage: number
  results: QuestionResult[]
}

const quiz = ref<QuizData | null>(null)
const loading = ref(true)
const error = ref('')
const currentIndex = ref(0)
const answers = ref<Map<string, string[] | string>>(new Map())
const submitting = ref(false)
const result = ref<ValidationResult | null>(null)
const startTime = ref<number | null>(null)
const timeTakenSeconds = ref<number | null>(null)

const quizId = computed(() => (route.params.id as string) || 'quiz_datastructures_001')

const currentQuestion = computed(() => quiz.value?.questions[currentIndex.value] ?? null)
const totalQuestions = computed(() => quiz.value?.questions.length ?? 0)
const isFirst = computed(() => currentIndex.value === 0)
const isLast = computed(() => currentIndex.value === totalQuestions.value - 1)
const progress = computed(() =>
  totalQuestions.value > 0 ? ((currentIndex.value + 1) / totalQuestions.value) * 100 : 0,
)

const currentAnswered = computed(() => {
  if (!currentQuestion.value) return false
  const a = answers.value.get(currentQuestion.value.id)
  if (!a) return false
  if (Array.isArray(a)) return a.length > 0
  return a.trim().length > 0
})

const allAnswered = computed(() => {
  if (!quiz.value) return false
  return quiz.value.questions.every((q) => {
    const a = answers.value.get(q.id)
    if (!a) return false
    if (Array.isArray(a)) return a.length > 0
    return a.trim().length > 0
  })
})

async function fetchQuiz() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/quizzes/${quizId.value}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Kunne ikke hente quizzen.')
    quiz.value = await res.json()
    startTime.value = Date.now()
  } catch (e: any) {
    error.value = e.message || 'Noget gik galt.'
  } finally {
    loading.value = false
  }
}

function getSelectedOptions(questionId: string): string[] {
  const a = answers.value.get(questionId)
  if (Array.isArray(a)) return a
  return []
}

function getClozeAnswer(questionId: string): string {
  const a = answers.value.get(questionId)
  if (typeof a === 'string') return a
  return ''
}

function toggleOption(
  questionId: string,
  optionId: string,
  type: 'single_choice' | 'multiple_choice',
) {
  const updated = new Map(answers.value)

  if (type === 'single_choice') {
    updated.set(questionId, [optionId])
  } else {
    const current = getSelectedOptions(questionId)
    if (current.includes(optionId)) {
      updated.set(
        questionId,
        current.filter((id) => id !== optionId),
      )
    } else {
      updated.set(questionId, [...current, optionId])
    }
  }

  answers.value = updated
}

function setClozeAnswer(questionId: string, value: string) {
  const updated = new Map(answers.value)
  updated.set(questionId, value)
  answers.value = updated
}

function next() {
  if (!isLast.value) currentIndex.value++
}

function prev() {
  if (!isFirst.value) currentIndex.value--
}

async function submit() {
  if (!quiz.value) return
  submitting.value = true

  const elapsed = startTime.value !== null ? Math.round((Date.now() - startTime.value) / 1000) : null
  timeTakenSeconds.value = elapsed

  const payload = quiz.value.questions.map((q) => ({
    questionId: q.id,
    answer: answers.value.get(q.id) ?? (q.type === 'cloze' ? '' : []),
  }))

  try {
    const res = await fetch(`${API_BASE}/quizzes/${quizId.value}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers: payload, timeTakenSeconds: elapsed }),
    })
    if (!res.ok) throw new Error('Kunne ikke validere svarene.')
    result.value = await res.json()
  } catch (e: any) {
    error.value = e.message || 'Noget gik galt.'
  } finally {
    submitting.value = false
  }
}

function restart() {
  answers.value = new Map()
  currentIndex.value = 0
  result.value = null
  startTime.value = Date.now()
  timeTakenSeconds.value = null
}

function getQuestionByResult(r: QuestionResult): Question | undefined {
  return quiz.value?.questions.find((q) => q.id === r.questionId)
}

onMounted(fetchQuiz)
</script>

<template>
  <div>
    <!-- Navbar -->
    <header class="navbar bg-base-100 shadow-sm p-6">
      <div class="flex-1 gap-2">
        <button class="btn btn-ghost btn-sm gap-2" @click="router.push({ name: 'home' })">
          <ChevronLeftIcon class="w-4 h-4" />
          Tilbage
        </button>
      </div>
      <div class="flex-none">
        <span class="text-sm font-medium text-base-content/70">{{ quiz?.title }}</span>
      </div>
    </header>

    <main class="py-6">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>

      <!-- Result screen -->
      <template v-else-if="result">
        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body text-center">
            <h2 class="text-2xl font-bold mb-2">Resultat</h2>
            <div class="text-5xl font-bold text-primary mb-1">{{ result.percentage }}%</div>
            <p class="text-base-content/60 mb-4">
              {{ result.totalPoints.toFixed(1) }} ud af {{ result.maxPoints }} point
            </p>
            <p v-if="timeTakenSeconds !== null" class="text-sm text-base-content/50 mb-4">
              Tid brugt: {{ Math.floor(timeTakenSeconds / 60) > 0 ? Math.floor(timeTakenSeconds / 60) + 'm ' : '' }}{{ timeTakenSeconds % 60 }}s
            </p>

            <div class="w-full bg-base-200 rounded-full h-3 mb-6">
              <div
                class="h-3 rounded-full transition-all"
                :class="
                  result.percentage >= 70
                    ? 'bg-success'
                    : result.percentage >= 40
                      ? 'bg-warning'
                      : 'bg-error'
                "
                :style="{ width: result.percentage + '%' }"
              ></div>
            </div>

            <div class="flex gap-3 justify-center">
              <button class="btn btn-primary" @click="restart">Prøv igen</button>
              <button class="btn btn-ghost" @click="router.push({ name: 'home' })">
                Tilbage til forsiden
              </button>
            </div>
          </div>
        </div>

        <!-- Per-question breakdown -->
        <div class="space-y-3">
          <div
            v-for="(r, i) in result.results"
            :key="r.questionId"
            class="card bg-base-100 shadow-sm"
          >
            <div class="card-body py-4 px-5">
              <div class="flex items-start gap-3">
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold"
                  :class="r.correct ? 'bg-success/15 text-success' : 'bg-error/15 text-error'"
                >
                  {{ r.correct ? '✓' : '✗' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium mb-1">Spørgsmål {{ i + 1 }}</p>
                  <p
                    class="text-sm text-base-content/70"
                    v-html="getQuestionByResult(r)?.questionText"
                  ></p>
                  <div class="mt-2 text-xs">
                    <span :class="r.correct ? 'text-success' : 'text-error'">Dit svar: </span>
                    <span class="text-base-content/60">
                      <template v-if="Array.isArray(r.userAnswer)">
                        <template v-if="r.userAnswer.length === 0">Intet svar</template>
                        <template v-else>
                          {{
                            r.userAnswer
                              .map((id) => {
                                const q = getQuestionByResult(r)
                                if (q && q.type !== 'cloze') {
                                  const opt = q.options.find((o) => o.id === id)
                                  return opt ? opt.text : id
                                }
                                return id
                              })
                              .join(', ')
                          }}
                        </template>
                      </template>
                      <template v-else>{{ r.userAnswer || 'Intet svar' }}</template>
                    </span>
                    <br />
                    <span v-if="!r.correct" class="text-success">Korrekt: </span>
                    <span v-if="!r.correct" class="text-base-content/60">
                      {{
                        r.correctAnswer
                          .map((entry) => {
                            if (typeof entry === 'object' && entry !== null && 'text' in entry) {
                              return (entry as { id: string; text: string }).text
                            }
                            const q = getQuestionByResult(r)
                            if (q && q.type !== 'cloze') {
                              const opt = q.options.find((o) => o.id === entry)
                              return opt ? opt.text : entry
                            }
                            return entry
                          })
                          .join(', ')
                      }}
                    </span>
                  </div>
                </div>
                <span class="text-sm font-mono text-base-content/50">
                  {{ r.points }}/{{ r.maxPoints }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Quiz flow -->
      <template v-else-if="quiz">
        <!-- Progress -->
        <div class="mb-6">
          <div class="flex justify-between text-sm text-base-content/60 mb-2">
            <span>Spørgsmål {{ currentIndex + 1 }} af {{ totalQuestions }}</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <progress class="progress progress-primary w-full" :value="progress" max="100"></progress>
        </div>

        <!-- Question card -->
        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body">
            <h2 class="text-lg font-semibold mb-4" v-html="currentQuestion?.questionText"></h2>

            <!-- Single choice -->
            <template v-if="currentQuestion?.type === 'single_choice'">
              <div class="space-y-2">
                <label
                  v-for="opt in (currentQuestion as ChoiceQuestion).options"
                  :key="opt.id"
                  class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  :class="
                    getSelectedOptions(currentQuestion.id).includes(opt.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-base-content/20'
                  "
                >
                  <input
                    type="radio"
                    class="radio radio-primary radio-sm"
                    :name="currentQuestion.id"
                    :checked="getSelectedOptions(currentQuestion.id).includes(opt.id)"
                    @change="toggleOption(currentQuestion!.id, opt.id, 'single_choice')"
                  />
                  <span class="text-sm">{{ opt.text }}</span>
                </label>
              </div>
            </template>

            <!-- Multiple choice -->
            <template v-else-if="currentQuestion?.type === 'multiple_choice'">
              <p class="text-xs text-base-content/50 mb-3">Vælg alle korrekte svar</p>
              <div class="space-y-2">
                <label
                  v-for="opt in (currentQuestion as ChoiceQuestion).options"
                  :key="opt.id"
                  class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  :class="
                    getSelectedOptions(currentQuestion.id).includes(opt.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-base-content/20'
                  "
                >
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary checkbox-sm"
                    :checked="getSelectedOptions(currentQuestion.id).includes(opt.id)"
                    @change="toggleOption(currentQuestion!.id, opt.id, 'multiple_choice')"
                  />
                  <span class="text-sm">{{ opt.text }}</span>
                </label>
              </div>
            </template>

            <!-- Cloze (fill in the blank) -->
            <template v-else-if="currentQuestion?.type === 'cloze'">
              <input
                type="text"
                class="input input-bordered w-full"
                placeholder="Skriv dit svar..."
                :value="getClozeAnswer(currentQuestion.id)"
                @input="
                  setClozeAnswer(currentQuestion!.id, ($event.target as HTMLInputElement).value)
                "
              />
            </template>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex justify-between items-center">
          <button class="btn btn-ghost" :disabled="isFirst" @click="prev">
            <ChevronLeftIcon class="w-4 h-4" />
            Forrige
          </button>

          <template v-if="isLast">
            <button class="btn btn-primary" :disabled="!allAnswered || submitting" @click="submit">
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              Aflever
            </button>
          </template>
          <template v-else>
            <button class="btn btn-primary" :disabled="!currentAnswered" @click="next">
              Næste
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </template>
        </div>

        <!-- Question dots -->
        <div class="flex justify-center gap-1.5 mt-6">
          <button
            v-for="(q, i) in quiz.questions"
            :key="q.id"
            class="w-2.5 h-2.5 rounded-full transition-colors"
            :class="[
              i === currentIndex
                ? 'bg-primary'
                : answers.get(q.id)
                  ? 'bg-primary/30'
                  : 'bg-base-300',
            ]"
            @click="currentIndex = i"
          ></button>
        </div>
      </template>
    </main>
  </div>
</template>
