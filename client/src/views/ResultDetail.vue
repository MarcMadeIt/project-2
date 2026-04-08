<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="mb-6 flex items-center gap-3">
        <RouterLink to="/results" class="btn btn-ghost btn-sm">
          Tilbage
        </RouterLink>
        <h1 class="text-2xl font-bold">Resultatdetaljer</h1>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <p>Resultat-id: {{ route.params.id }}</p>
        </div>
      </div>
    </div>
  </div>
</template>