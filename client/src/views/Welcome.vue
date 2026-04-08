<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col">
    <!-- Hero -->
    <div class="hero flex-1">
      <div class="hero-content text-center gap-8 max-w-2xl" style="flex-direction: column;">
        <!-- Logo / Icon -->
        <div class="flex items-center gap-4" style="flex-direction: row;">
          <div
            class="w-20 h-20 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-10 h-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h1 class="text-5xl font-bold tracking-tight">Quiz</h1>
        </div>

        <p class="text-lg text-base-content/70 max-w-md">
          Test din viden om datastrukturer. Tag quizzer, se dine resultater og
          bliv skarpere for hver gang.
        </p>

        <!-- Feature cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body items-center text-center p-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-8 h-8 text-primary mb-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <p class="text-sm font-medium">Multiple-choice quizzer</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body items-center text-center p-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-8 h-8 text-secondary mb-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p class="text-sm font-medium">Se dine resultater</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body items-center text-center p-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-8 h-8 text-accent mb-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p class="text-sm font-medium">Sikker login</p>
            </div>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
          <button
            class="btn btn-primary btn-lg sm:btn-wide"
            @click="router.push({ name: 'register' })"
          >
            Kom i gang
          </button>
          <button
            class="btn btn-ghost btn-lg sm:btn-wide"
            @click="router.push({ name: 'login' })"
          >
            Jeg har allerede en konto
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer footer-center p-4 text-base-content/50 text-sm">
      <p>Quiz &middot; 2. Semester &middot; Datastrukturer</p>
    </footer>
  </div>
</template>
