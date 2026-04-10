<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { createQuiz, uploadQuizFile, type CreateQuizRequest } from '@/api'
import { ChevronLeftIcon, DocumentArrowUpIcon } from '@heroicons/vue/24/outline'

const router = useRouter()

// holds what the admin types into the form
const title = ref('')
const description = ref('')
const category = ref('')
const difficulty = ref('medium')

type AdminQuestionType = 'single_choice' | 'multiple_choice' | 'cloze'

interface AdminQuestionForm {
  type: AdminQuestionType
  questionText: string
  options: string[]
  correctAnswers: number[]
  acceptedAnswers: string[]
  caseSensitive: boolean
  trimWhitespace: boolean
}

function createEmptyQuestion(): AdminQuestionForm {
  return {
    type: 'single_choice',
    questionText: '',
    options: ['', ''],
    correctAnswers: [0],
    acceptedAnswers: [''],
    caseSensitive: false,
    trimWhitespace: true,
  }
}

const questions = ref<AdminQuestionForm[]>([createEmptyQuestion()])

function addQuestion() {
  questions.value.push(createEmptyQuestion())
}

function removeQuestion(index: number) {
  if (questions.value.length === 1) return
  questions.value.splice(index, 1)
}

function addOption(question: AdminQuestionForm) {
  question.options.push('')
}

function removeOption(question: AdminQuestionForm, optionIndex: number) {
  if (question.options.length <= 2) return
  question.options.splice(optionIndex, 1)

  question.correctAnswers = question.correctAnswers
    .filter((i) => i !== optionIndex)
    .map((i) => (i > optionIndex ? i - 1 : i))

  if (question.type === 'single_choice' && question.correctAnswers.length === 0) {
    question.correctAnswers = [0]
  }
}

function addAcceptedAnswer(question: AdminQuestionForm) {
  question.acceptedAnswers.push('')
}

function removeAcceptedAnswer(question: AdminQuestionForm, index: number) {
  if (question.acceptedAnswers.length <= 1) return
  question.acceptedAnswers.splice(index, 1)
}

// File upload state
const selectedFile = ref<File | null>(null)
const uploadLoading = ref(false)
const uploadSuccess = ref('')
const uploadError = ref('')

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.item(0)
  if (file) {
    selectedFile.value = file
  }
}

async function onUploadFile() {
  uploadSuccess.value = ''
  uploadError.value = ''

  const file = selectedFile.value
  if (!file) {
    uploadError.value = 'Vælg en fil først.'
    return
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'json' && ext !== 'xml') {
    uploadError.value = 'Kun .json og .xml filer er tilladt.'
    return
  }

  uploadLoading.value = true
  try {
    await uploadQuizFile(file)
    router.push('/home')
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : 'Kunne ikke uploade fil.'
  } finally {
    uploadLoading.value = false
  }
}

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
    questions.value.some(
      (q) => !q.questionText.trim() || (q.type !== 'cloze' && q.options.some((opt) => !opt.trim())),
    )
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
    questions: questions.value.map((q) => {
      if (q.type === 'cloze') {
        return {
          type: 'cloze' as const,
          questionText: q.questionText,
          acceptedAnswers: q.acceptedAnswers.filter((a) => a.trim() !== ''),
          caseSensitive: q.caseSensitive,
          trimWhitespace: q.trimWhitespace,
        }
      }

      if (q.type === 'multiple_choice') {
        return {
          type: 'multiple_choice' as const,
          questionText: q.questionText,
          options: q.options.map((o) => ({ text: o })),
          correctAnswers: q.correctAnswers,
        }
      }

      return {
        type: 'single_choice' as const,
        questionText: q.questionText,
        options: q.options.map((o) => ({ text: o })),
        correctAnswers: q.correctAnswers.slice(0, 1),
      }
    }),
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
    questions.value = [createEmptyQuestion()]
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

        <h1 class="text-2xl font-bold">Opret quiz</h1>
      </div>

      <!-- File upload section -->
      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body space-y-4">
          <div class="flex items-center gap-2">
            <DocumentArrowUpIcon class="w-5 h-5 text-accent" />
            <h2 class="text-lg font-semibold">Upload quizfil</h2>
          </div>

          <p class="text-sm text-base-content/70">
            Upload en <strong>.json</strong> eller <strong>.xml</strong> quizfil direkte.
          </p>

          <div v-if="uploadSuccess" class="alert alert-success">
            {{ uploadSuccess }}
          </div>
          <div v-if="uploadError" class="alert alert-error">
            {{ uploadError }}
          </div>

          <div class="flex gap-3 items-end">
            <label class="form-control w-full">
              <span class="label-text mb-1">Vælg fil</span>
              <input
                id="quiz-file-input"
                type="file"
                accept=".json,.xml"
                class="file-input file-input-bordered w-full"
                @change="onFileSelected"
              />
            </label>
            <button
              class="btn btn-accent"
              :disabled="uploadLoading || !selectedFile"
              @click="onUploadFile"
            >
              {{ uploadLoading ? 'Uploader...' : 'Upload' }}
            </button>
          </div>
        </div>
      </div>

      <div class="divider">ELLER opret manuelt</div>

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
              <textarea v-model="description" class="textarea textarea-bordered w-full"></textarea>
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
          <div class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold">Spørgsmål</h2>
              <button class="btn btn-sm btn-outline" @click="addQuestion">
                + Tilføj spørgsmål
              </button>
            </div>

            <div
              v-for="(question, qIndex) in questions"
              :key="qIndex"
              class="card bg-base-200 p-4 space-y-4"
            >
              <div class="flex justify-between items-center">
                <h3 class="font-semibold">Spørgsmål {{ qIndex + 1 }}</h3>
                <button class="btn btn-xs btn-error" @click="removeQuestion(qIndex)">Fjern</button>
              </div>

              <!-- Question type -->
              <label class="form-control w-full">
                <span class="label-text mb-1">Type</span>
                <select v-model="question.type" class="select select-bordered w-full">
                  <option value="single_choice">Single choice</option>
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="cloze">Cloze</option>
                </select>
              </label>

              <!-- Question text -->
              <label class="form-control w-full">
                <span class="label-text mb-1">Spørgsmålstekst</span>
                <textarea
                  v-model="question.questionText"
                  class="textarea textarea-bordered w-full"
                ></textarea>
              </label>

              <!-- CHOICE QUESTIONS -->
              <div v-if="question.type !== 'cloze'" class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="label-text">Svarmuligheder</span>
                  <button class="btn btn-xs btn-outline" @click="addOption(question)">
                    + Tilføj svar
                  </button>
                </div>

                <div
                  v-for="(option, oIndex) in question.options"
                  :key="oIndex"
                  class="flex gap-2 items-center"
                >
                  <input v-model="question.options[oIndex]" class="input input-bordered w-full" />

                  <button class="btn btn-xs btn-error" @click="removeOption(question, oIndex)">
                    ✕
                  </button>

                  <!-- SINGLE CHOICE -->
                  <input
                    v-if="question.type === 'single_choice'"
                    type="radio"
                    :checked="question.correctAnswers[0] === oIndex"
                    @change="question.correctAnswers = [oIndex]"
                  />

                  <!-- MULTIPLE CHOICE -->
                  <input
                    v-if="question.type === 'multiple_choice'"
                    type="checkbox"
                    :checked="question.correctAnswers.includes(oIndex)"
                    @change="
                      question.correctAnswers.includes(oIndex)
                        ? (question.correctAnswers = question.correctAnswers.filter(
                            (i) => i !== oIndex,
                          ))
                        : question.correctAnswers.push(oIndex)
                    "
                  />
                </div>
              </div>

              <!-- CLOZE -->
              <div v-if="question.type === 'cloze'" class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="label-text">Accepted answers</span>
                  <button class="btn btn-xs btn-outline" @click="addAcceptedAnswer(question)">
                    + Tilføj svar
                  </button>
                </div>

                <div
                  v-for="(ans, aIndex) in question.acceptedAnswers"
                  :key="aIndex"
                  class="flex gap-2"
                >
                  <input
                    v-model="question.acceptedAnswers[aIndex]"
                    class="input input-bordered w-full"
                  />
                  <button
                    class="btn btn-xs btn-error"
                    @click="removeAcceptedAnswer(question, aIndex)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
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
