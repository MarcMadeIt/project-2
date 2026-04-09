<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { createQuiz, type CreateQuizRequest } from '@/api'
import { ChevronLeftIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'

const router = useRouter()

// holds what the admin types into the form
const title = ref('')
const description = ref('')
const category = ref('')
const difficulty = ref('medium')

// question for now
const questionText = ref('')
const option1 = ref('')
const option2 = ref('')
const option3 = ref('')
const option4 = ref('')
const correctAnswerIndex = ref(0)

// UI state
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// runss when admin clicks submit
async function onSubmit() {
  successMessage.value = ''
  errorMessage.value = ''

  // frontend safety check
  if (
    !title.value.trim() ||
    !description.value.trim() ||
    !category.value.trim() ||
    !difficulty.value.trim() ||
    !questionText.value.trim() ||
    !option1.value.trim() ||
    !option2.value.trim() ||
    !option3.value.trim() ||
    !option4.value.trim()
  ) {
    errorMessage.value = 'Udfyld alle felter.'
    return
  }

  //  matching backend POST /quizzes format
  const payload: CreateQuizRequest = {
    title: title.value,
    description: description.value,
    category: category.value,
    difficulty: difficulty.value,
    questions: [
      {
        type: 'single_choice',
        questionText: questionText.value,
        options: [
          { text: option1.value },
          { text: option2.value },
          { text: option3.value },
          { text: option4.value },
        ],
        correctAnswers: [correctAnswerIndex.value],
      },
    ],
  }

  loading.value = true

  try {
    await createQuiz(payload)

    successMessage.value = 'Quiz oprettet.'

    // reset form 
    title.value = ''
    description.value = ''
    category.value = ''
    difficulty.value = 'medium'
    questionText.value = ''
    option1.value = ''
    option2.value = ''
    option3.value = ''
    option4.value = ''
    correctAnswerIndex.value = 0
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Kunne ikke oprette quiz.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Top bar -->
      <div class="mb-6 flex items-center gap-3">
        <RouterLink to="/home" class="btn btn-ghost btn-sm">
          <ChevronLeftIcon class="w-4 h-4" />
          Tilbage
        </RouterLink>

        <div class="flex items-center gap-2">
          <ArrowUpTrayIcon class="w-6 h-6 text-accent" />
          <h1 class="text-2xl font-bold">Opret quiz</h1>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body space-y-6">
          <!-- feedback -->
          <div v-if="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <div v-if="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <!-- quiz info -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Quizoplysninger</h2>

            <label class="form-control w-full">
              <span class="label-text mb-1">Titel</span>
              <input v-model="title" type="text" class="input input-bordered w-full" />
            </label>

            <label class="form-control w-full">
              <span class="label-text mb-1">Beskrivelse</span>
              <textarea
                v-model="description"
                class="textarea textarea-bordered w-full"
              ></textarea>
            </label>

            <label class="form-control w-full">
              <span class="label-text mb-1">Kategori</span>
              <input v-model="category" type="text" class="input input-bordered w-full" />
            </label>

            <label class="form-control w-full">
              <span class="label-text mb-1">Sværhedsgrad</span>
              <select v-model="difficulty" class="select select-bordered w-full">
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
          </div>

          <!-- one question -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Spørgsmål 1</h2>

            <label class="form-control w-full">
              <span class="label-text mb-1">Spørgsmålstekst</span>
              <textarea
                v-model="questionText"
                class="textarea textarea-bordered w-full"
              ></textarea>
            </label>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="form-control w-full">
                <span class="label-text mb-1">Svarmulighed 1</span>
                <input v-model="option1" type="text" class="input input-bordered w-full" />
              </label>

              <label class="form-control w-full">
                <span class="label-text mb-1">Svarmulighed 2</span>
                <input v-model="option2" type="text" class="input input-bordered w-full" />
              </label>

              <label class="form-control w-full">
                <span class="label-text mb-1">Svarmulighed 3</span>
                <input v-model="option3" type="text" class="input input-bordered w-full" />
              </label>

              <label class="form-control w-full">
                <span class="label-text mb-1">Svarmulighed 4</span>
                <input v-model="option4" type="text" class="input input-bordered w-full" />
              </label>
            </div>

            <label class="form-control w-full">
              <span class="label-text mb-1">Korrekt svar</span>
              <select v-model="correctAnswerIndex" class="select select-bordered w-full">
                <option :value="0">Svarmulighed 1</option>
                <option :value="1">Svarmulighed 2</option>
                <option :value="2">Svarmulighed 3</option>
                <option :value="3">Svarmulighed 4</option>
              </select>
            </label>
          </div>

          <!-- submit -->
          <div class="pt-2">
            <button class="btn btn-primary" :disabled="loading" @click="onSubmit">
              {{ loading ? 'Opretter...' : 'Opret quiz' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>