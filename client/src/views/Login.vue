<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api'
import { ChevronLeftIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const router = useRouter()

const email = ref('')
const password = ref('')
const submitted = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

/* ── Validation ── */

const emailError = computed(() => {
  if (!submitted.value && !email.value) return ''
  const v = email.value.trim()
  if (!v) return 'Email er påkrævet'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ugyldig email'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value && !password.value) return ''
  if (!password.value) return 'Password er påkrævet'
  return ''
})

const isValid = computed(
  () => !emailError.value && !passwordError.value && email.value && password.value,
)

/* ── Submit ── */

async function onSubmit() {
  submitted.value = true
  errorMessage.value = ''
  if (!isValid.value) return

  loading.value = true
  try {
    await login(email.value, password.value)
    await router.replace({ name: 'home' })
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Login fejlede'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full">
      <!-- Back link -->
      <router-link to="/" class="btn btn-ghost btn-sm gap-1 mb-4 -ml-2">
        <ChevronLeftIcon class="w-4 h-4" />
        Tilbage
      </router-link>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <!-- Header -->
          <div class="text-center mb-2">
            <h2 class="text-2xl font-bold">Velkommen tilbage</h2>
            <p class="text-sm text-base-content/60 mt-1">
              Log ind for at fortsætte til din quiz
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
              <label class="label" for="login-email">
                <span class="label-text font-medium">Email</span>
              </label>
              <input
                id="login-email"
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
              <label class="label" for="login-password">
                <span class="label-text font-medium">Password</span>
              </label>
              <div class="relative">
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Dit password"
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
              <label v-if="passwordError" class="label pb-0">
                <span class="label-text-alt text-error">{{ passwordError }}</span>
              </label>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="btn btn-primary w-full mt-1"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner loading-sm" />
              {{ loading ? 'Logger ind...' : 'Log ind' }}
            </button>

            <!-- Link to register -->
            <p class="text-sm text-center text-base-content/60">
              Har du ikke en konto?
              <router-link to="/register" class="link link-primary font-medium">
                Opret konto
              </router-link>
            </p>
          </form>
        </div>
      </div>

      <!-- Test credentials hint -->
      <div class="mt-4 p-3 rounded-lg bg-base-100/50 border border-base-content/5">
        <p class="text-xs text-base-content/40 text-center">
          Test: <code class="text-base-content/60">admin@quiz.dk</code> /
          <code class="text-base-content/60">Admin123!</code>
          &nbsp;&middot;&nbsp;
          <code class="text-base-content/60">user@quiz.dk</code> /
          <code class="text-base-content/60">User1234!</code>
        </p>
      </div>
    </div>
  </div>
</template>
