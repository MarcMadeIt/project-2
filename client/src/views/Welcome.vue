<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LightBulbIcon, ClipboardDocumentCheckIcon, ChartBarIcon, LockClosedIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Hero -->
    <div class="hero flex-1">
      <div class="hero-content text-center gap-8" style="flex-direction: column;">
        <!-- Logo / Icon -->
        <div class="flex items-center gap-4" style="flex-direction: row;">
          <div
            class="w-20 h-20 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl"
          >
            <LightBulbIcon class="w-10 h-10 text-primary" />
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
              <ClipboardDocumentCheckIcon class="w-8 h-8 text-primary mb-1" />
              <p class="text-sm font-medium">Multiple-choice quizzer</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body items-center text-center p-5">
              <ChartBarIcon class="w-8 h-8 text-secondary mb-1" />
              <p class="text-sm font-medium">Se dine resultater</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body items-center text-center p-5">
              <LockClosedIcon class="w-8 h-8 text-accent mb-1" />
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
