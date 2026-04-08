<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api'
import { ChevronLeftIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/vue/24/outline'

const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitted = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

/* ── Validation ── */

const emailError = computed(() => {
  if (!submitted.value && !email.value) return ''
  const v = email.value.trim()
  if (!v) return 'Email er påkrævet'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ugyldig email-adresse'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value && !password.value) return ''
  const v = password.value
  if (!v) return 'Password er påkrævet'
  if (v.length < 8) return 'Mindst 8 tegn'
  return ''
})

const confirmError = computed(() => {
  if (!submitted.value && !confirmPassword.value) return ''
  if (!confirmPassword.value) return 'Bekræft dit password'
  if (confirmPassword.value !== password.value) return 'Passwords matcher ikke'
  return ''
})

const isValid = computed(
  () =>
    !emailError.value &&
    !passwordError.value &&
    !confirmError.value &&
    email.value &&
    password.value &&
    confirmPassword.value,
)

/* ── Password requirements (matches server validation) ── */

const requirements = computed(() => [
  { label: 'Mindst 8 tegn', met: password.value.length >= 8 },
  { label: 'Små bogstaver (a-z)', met: /[a-z]/.test(password.value) },
  { label: 'Store bogstaver (A-Z)', met: /[A-Z]/.test(password.value) },
  { label: 'Tal (0-9)', met: /\d/.test(password.value) },
  { label: 'Specialtegn (!@#$...)', met: /[^A-Za-z0-9]/.test(password.value) },
])

const metCount = computed(() => requirements.value.filter((r) => r.met).length)

const strength = computed(() => {
  if (!password.value) return { percent: 0, label: '', cls: '' }
  const pct = (metCount.value / requirements.value.length) * 100
  if (pct <= 20) return { percent: pct, label: 'Meget svag', cls: 'progress-error' }
  if (pct <= 40) return { percent: pct, label: 'Svag', cls: 'progress-error' }
  if (pct <= 60) return { percent: pct, label: 'Middel', cls: 'progress-warning' }
  if (pct <= 80) return { percent: pct, label: 'Stærk', cls: 'progress-success' }
  return { percent: 100, label: 'Meget stærk', cls: 'progress-success' }
})

/* ── Submit ── */

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
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Back link -->
      <router-link to="/" class="btn btn-ghost btn-sm gap-1 mb-4 -ml-2">
        <ChevronLeftIcon class="w-4 h-4" />
        Tilbage
      </router-link>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <!-- Header -->
          <div class="text-center mb-2">
            <h2 class="text-2xl font-bold">Opret din konto</h2>
            <p class="text-sm text-base-content/60 mt-1">
              Udfyld felterne for at komme i gang
            </p>
          </div>

          <!-- Error banner -->
          <div v-if="errorMessage" class="alert alert-error text-sm py-2">
            <ExclamationTriangleIcon class="w-5 h-5 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="onSubmit" class="flex flex-col gap-5 mt-2">
            <!-- Email -->
            <div class="form-control">
              <label class="label" for="reg-email">
                <span class="label-text font-medium">Email</span>
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
              <label v-if="emailError" class="label pb-0">
                <span class="label-text-alt text-error">{{ emailError }}</span>
              </label>
            </div>

            <!-- Password -->
            <div class="form-control">
              <label class="label" for="reg-password">
                <span class="label-text font-medium">Password</span>
              </label>
              <div class="relative">
                <input
                  id="reg-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Vælg et stærkt password"
                  class="input input-bordered w-full pr-12"
                  :class="{ 'input-error': passwordError }"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Skjul password' : 'Vis password'"
                >
                  <EyeIcon v-if="!showPassword" class="w-4 h-4" />
                  <EyeSlashIcon v-else class="w-4 h-4" />
                </button>
              </div>

              <!-- Strength bar -->
              <div
                class="mt-2 transition-opacity duration-200"
                :class="password ? 'opacity-100' : 'opacity-0 pointer-events-none'"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs text-base-content/50">Styrke</span>
                  <span class="text-xs font-medium" :class="strength.cls?.replace('progress-', 'text-')">
                    {{ strength.label }}
                  </span>
                </div>
                <progress
                  class="progress h-1.5 w-full"
                  :class="strength.cls"
                  :value="strength.percent"
                  max="100"
                />
              </div>

              <!-- Requirements checklist -->
              <ul class="mt-2 space-y-1">
                <li
                  v-for="req in requirements"
                  :key="req.label"
                  class="flex items-center gap-2 text-xs transition-colors duration-150"
                  :class="req.met ? 'text-success' : 'text-base-content/40'"
                >
                  <CheckIcon v-if="req.met" class="w-3.5 h-3.5" stroke-width="3" />
                  <span v-else class="w-3.5 h-3.5 rounded-full border border-base-content/20" />
                  {{ req.label }}
                </li>
              </ul>
            </div>

            <!-- Confirm password -->
            <div class="form-control">
              <label class="label" for="reg-confirm">
                <span class="label-text font-medium">Bekræft password</span>
              </label>
              <input
                id="reg-confirm"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="Gentag dit password"
                class="input input-bordered w-full"
                :class="{ 'input-error': confirmError }"
              />
              <label v-if="confirmError" class="label pb-0">
                <span class="label-text-alt text-error">{{ confirmError }}</span>
              </label>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="btn btn-primary w-full mt-1"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner loading-sm" />
              {{ loading ? 'Opretter konto...' : 'Opret konto' }}
            </button>

            <!-- Link to login -->
            <p class="text-sm text-center text-base-content/60">
              Har du allerede en konto?
              <router-link to="/login" class="link link-primary font-medium">
                Log ind her
              </router-link>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
