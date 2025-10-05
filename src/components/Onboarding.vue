<script setup lang="ts">
/**
 * Onboarding - Velkomst flow for nye brugere
 * Vises ved første åbning eller efter total reset
 */

import { ref } from 'vue';
import UiIcon from './UiIcon.vue';
import { completeOnboarding } from '../utils/storage';

interface Emits {
  (e: 'complete'): void;
}

const emit = defineEmits<Emits>();

const step = ref(0);

const steps = [
  {
    icon: 'money-bag-01',
    title: 'Velkommen til Budgeto',
    description: 'Hold styr på din økonomi på den nemme måde. Alt gemmes lokalt på din enhed.',
  },
  {
    icon: 'restaurant',
    title: 'Tilføj dine udgifter',
    description: 'Registrer variable udgifter som mad, transport og shopping løbende gennem måneden.',
  },
  {
    icon: 'home-01',
    title: 'Faste posteringer',
    description: 'Tilføj faste indtægter (løn) og udgifter (husleje, el) som kommer hver måned d. 1.',
  },
  {
    icon: 'lightning-01',
    title: 'Auto-reset hver måned',
    description: 'Variable posteringer nulstilles automatisk når en ny måned starter.',
  },
];

const handleNext = () => {
  if (step.value < steps.length - 1) {
    step.value++;
  } else {
    completeOnboarding();
    emit('complete');
  }
};

const handleSkip = () => {
  completeOnboarding();
  emit('complete');
};
</script>

<template>
  <div class="onboarding-overlay">
    <div class="onboarding-container">
      <!-- Logo -->
      <div class="logo-container">
        <div class="logo-circle">
          <UiIcon :name="steps[step]?.icon || 'menu-circle'" :size="48" class="text-white" />
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <h1 class="title">{{ steps[step]?.title || '' }}</h1>
        <p class="description">{{ steps[step]?.description || '' }}</p>
      </div>

      <!-- Progress dots -->
      <div class="dots">
        <div
          v-for="(_, idx) in steps"
          :key="idx"
          :class="['dot', idx === step && 'dot-active']"
        ></div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button v-if="step < steps.length - 1" class="btn-secondary" @click="handleSkip">
          Spring over
        </button>
        <button class="btn-primary" @click="handleNext">
          {{ step < steps.length - 1 ? 'Næste' : 'Kom i gang' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1e5a40 100%);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

@media (prefers-color-scheme: dark) {
  .onboarding-overlay {
    background: linear-gradient(135deg, var(--color-primary-dark) 0%, #2a7d5a 100%);
  }
}

.onboarding-container {
  width: 100%;
  max-width: 480px;
  text-align: center;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  margin-bottom: 3rem;
}

.logo-circle {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.content {
  margin-bottom: 3rem;
  padding: 0 1rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.description {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
}

.dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.dot-active {
  width: 24px;
  border-radius: 4px;
  background-color: white;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  min-width: 140px;
}

.btn-primary {
  background-color: white;
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
}

@media (prefers-color-scheme: dark) {
  .btn-primary {
    color: var(--color-primary-dark);
  }
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 480px) {
  .title {
    font-size: 1.75rem;
  }

  .description {
    font-size: 1rem;
  }

  .logo-circle {
    width: 100px;
    height: 100px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-container {
    animation: none;
  }

  .btn-primary:hover,
  .btn-secondary:hover {
    transform: none;
  }

  .dot {
    transition: none;
  }
}
</style>
