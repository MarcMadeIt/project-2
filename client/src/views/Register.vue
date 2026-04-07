<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const submitted = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const emailError = computed(() => {
  if (!submitted.value && !email.value) return ''
  const v = email.value.trim()
  if (!v) return 'Email er påkrævet'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(v)) return 'Ugyldig email-adresse'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value && !password.value) return ''
  const v = password.value
  if (!v) return 'Password er påkrævet'
  if (v.length < 8) return 'Password skal være mindst 8 tegn'
  if (!/\d/.test(v)) return 'Password skal indeholde mindst ét tal'
  if (!/[A-Za-z]/.test(v)) return 'Password skal indeholde mindst ét bogstav'
  return ''
})

const isValid = computed(
  () => !emailError.value && !passwordError.value && email.value && password.value,
)

const passwordRequirements = computed(() => [
  { label: 'Mindst 8 tegn', met: password.value.length >= 8 },
  { label: 'Indeholder tal', met: /\d/.test(password.value) },
  { label: 'Specialtegn (fx !@#)', met: /[^A-Za-z0-9]/.test(password.value) },
])

const passwordStrength = computed(() => {
  const v = password.value
  if (!v) return { percent: 0, label: '', progressClass: 'progress-primary' }
  let score = 0
  if (v.length >= 8) score += 25
  if (v.length >= 12) score += 15
  if (/\d/.test(v)) score += 20
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score += 20
  if (/[^A-Za-z0-9]/.test(v)) score += 20
  // Mindst 15% når der er indhold, så "Svag" altid viser en synlig progressbar
  const percent = Math.min(Math.max(score, 15), 100)
  if (percent < 25) return { percent, label: 'Svag', progressClass: 'progress-error' }
  if (percent < 50) return { percent, label: 'Middel', progressClass: 'progress-warning' }
  if (percent < 75) return { percent, label: 'Stærk', progressClass: 'progress-success' }
  return { percent: 100, label: 'Meget stærk', progressClass: 'progress-success' }
})

async function onSubmit() {
  submitted.value = true
  errorMessage.value = ''
  if (!isValid.value) return
  loading.value = true
  try {
    await register(email.value, password.value)
    await router.replace({ name: 'home' })
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Registrering fejlede'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Opret bruger</h2>
        <form @submit.prevent="onSubmit" class="flex flex-col gap-6">
          <p v-if="errorMessage" class="text-error text-sm">{{ errorMessage }}</p>
          <div class="form-control">
            <label class="label" for="reg-email">
              <span class="label-text">Email</span>
            </label>
            <input
              id="reg-email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="din@email.dk"
              class="input input-bordered w-full"
              :class="{ 'input-error': emailError }"
            />
            <label v-if="emailError" class="label">
              <span class="label-text-alt text-error">{{ emailError }}</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label" for="reg-password">
              <span class="label-text">Password</span>
            </label>
            <input
              id="reg-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="input input-bordered w-full"
              :class="{ 'input-error': passwordError }"
            />
            <label v-if="passwordError" class="label">
              <span class="label-text-alt text-error">{{ passwordError }}</span>
            </label>
            <div
              class="mt-1 min-h-6 space-y-0.5 transition-opacity duration-150"
              :class="password ? 'opacity-100' : 'opacity-0 pointer-events-none'"
              aria-hidden="true"
            >
              <progress
                class="progress h-1 w-54 max-w-full"
                :class="passwordStrength.progressClass"
                :value="passwordStrength.percent"
                max="100"
              />
              <p class="text-xs text-base-content/70 min-h-4 leading-tight">
                {{ passwordStrength.label }}
              </p>
            </div>
            <ul class="text-xs text-base-content/70 space-y-0.5 list-none p-0 mt-1">
              <li
                v-for="req in passwordRequirements"
                :key="req.label"
                class="flex items-center gap-1.5"
                :class="req.met ? 'opacity-100' : 'opacity-60'"
              >
                <span v-if="req.met" class="text-success">✓</span>
                <span v-else class="opacity-60">○</span>
                {{ req.label }}
              </li>
            </ul>
          </div>
          <div class="card-actions flex-col gap-2 pt-2">
            <button type="submit" class="btn btn-primary w-full" :disabled="loading">
              {{ loading ? 'Opretter…' : 'Opret bruger' }}
            </button>
            <p class="text-sm text-base-content/70 w-full text-center">
              Har du allerede en konto?
              <router-link to="/login" class="link link-primary">Log ind</router-link>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
