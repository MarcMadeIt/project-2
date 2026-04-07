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

const emailError = computed(() => {
  if (!submitted.value && !email.value) return ''
  const v = email.value.trim()
  if (!v) return 'Email er påkrævet'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(v)) return 'Ugyldig email'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value && !password.value) return ''
  const v = password.value
  if (!v) return 'Password er påkrævet'
  if (v.length < 8 || !/\d/.test(v) || !/[A-Za-z]/.test(v)) return 'For svagt password'
  return ''
})

const isValid = computed(
  () => !emailError.value && !passwordError.value && email.value && password.value,
)

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
  <div class="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Login</h2>
        <form @submit.prevent="onSubmit" class="flex flex-col gap-8">
          <p v-if="errorMessage" class="text-error text-sm">{{ errorMessage }}</p>
          <div class="form-control relative">
            <label class="label" for="login-email">
              <span class="label-text">Email</span>
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
            <label v-if="emailError" class="label absolute -bottom-5 left-0">
              <span class="label-text-alt text-error text-xs">{{ emailError }}</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label" for="login-password">
              <span class="label-text">Password</span>
            </label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="input input-bordered w-full"
              :class="{ 'input-error': passwordError }"
            />
            <label v-if="passwordError" class="label">
              <span class="label-text-alt text-error">{{ passwordError }}</span>
            </label>
          </div>
          <div class="card-actions justify-end pt-2">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Logger ind…' : 'Log ind' }}
            </button>
          </div>
          <p class="text-sm text-base-content/70">
            Har du ikke en konto?
            <router-link to="/register" class="link link-primary">Opret bruger</router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
