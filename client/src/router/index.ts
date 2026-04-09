import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/api'

import WelcomeView from '@/views/Welcome.vue'
import LoginView from '@/views/Login.vue'
import RegisterView from '@/views/Register.vue'
import HomeView from '@/views/Home.vue'
import QuizView from '@/views/Quiz.vue'
import ResultsView from '@/views/Results.vue'
import ResultDetailView from '@/views/ResultDetail.vue'
import AdminResultsView from '@/views/AdminResults.vue'
import AdminCreateQuizView from '@/views/AdminCreateQuiz.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomeView,
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/quiz/:id',
      name: 'quiz',
      component: QuizView,
      meta: { requiresAuth: true },
    },
    {
      path: '/results',
      name: 'results',
      component: ResultsView,
    },
    {
      path: '/results/:id',
      name: 'result-detail',
      component: ResultDetailView,
    },
    {
      path: '/admin/results',
      name: 'admin-results',
      component: AdminResultsView,
    },
    {
      path: '/admin/create-quiz',
      name: 'admin-create-quiz',
      component: AdminCreateQuizView,
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const loggedIn = isLoggedIn.value

  if (to.meta.requiresAuth && !loggedIn) {
    return next({ name: 'login' })
  }

  if (to.meta.guestOnly && loggedIn) {
    return next({ name: 'home' })
  }

  next()
})

export default router
