import { ref, watch, type Ref } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay: number = 500) {
  const debouncedValue = ref<T>(value.value) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  watch(value, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}
