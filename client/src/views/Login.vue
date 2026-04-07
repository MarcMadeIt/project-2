<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api'

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
  <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Back link -->
      <router-link to="/" class="btn btn-ghost btn-sm gap-1 mb-4 -ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
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
                  <svg
                    v-if="!showPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
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
