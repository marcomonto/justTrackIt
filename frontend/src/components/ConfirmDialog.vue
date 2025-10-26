<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick"
      >
        <Transition name="scale">
          <div
            v-if="isOpen"
            class="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
            @click.stop
          >
            <!-- Icon -->
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              :class="{
                'bg-red-100': variant === 'danger',
                'bg-yellow-100': variant === 'warning',
                'bg-blue-100': variant === 'info'
              }"
            >
              <svg
                v-if="variant === 'danger'"
                class="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <svg
                v-else-if="variant === 'warning'"
                class="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <svg
                v-else
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- Title -->
            <h3 class="text-xl font-bold text-gray-900 mb-2">
              {{ title }}
            </h3>

            <!-- Custom Content Slot -->
            <div v-if="$slots.default" class="mb-4">
              <slot />
            </div>

            <!-- Message -->
            <p class="text-gray-600 mb-6">
              {{ message }}
            </p>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="handleCancel"
                class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="flex-1 px-4 py-3 rounded-lg font-medium transition"
                :class="{
                  'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
                  'bg-yellow-600 text-white hover:bg-yellow-700': variant === 'warning',
                  'bg-blue-600 text-white hover:bg-blue-700': variant === 'info'
                }"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Conferma azione',
  message: 'Sei sicuro di voler procedere?',
  confirmText: 'Conferma',
  cancelText: 'Annulla',
  variant: 'danger'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const isOpen = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
  }
)

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const handleBackdropClick = () => {
  handleCancel()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>