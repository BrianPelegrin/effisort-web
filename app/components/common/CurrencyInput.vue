<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: number | null
}>(), {
  modelValue: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  change: [value: number | null]
}>()

const displayValue = ref('')
const isFocused = ref(false)

function sanitize(value: string) {
  const withoutSeparators = value.replace(/,/g, '').replace(/[^0-9.]/g, '')
  const [integer = '', ...decimals] = withoutSeparators.split('.')
  return `${integer}.${decimals.join('')}`
}

function toNumber(value: string) {
  const normalized = sanitize(value)
  if (!normalized || normalized === '.') return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function formatInput(value: string) {
  const normalized = sanitize(value)
  if (!normalized || normalized === '.') return ''

  const [integerPart = '', decimalPart = ''] = normalized.split('.')
  const integer = integerPart.replace(/^0+(?=\d)/, '') || '0'
  const groupedInteger = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(integer))

  return `${groupedInteger}.${decimalPart.slice(0, 2).padEnd(2, '0')}`
}

function format(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value))) return ''

  return formatInput(String(value))
}

function updateValue(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const cursor = input.selectionStart ?? value.length
  const decimalPosition = value.indexOf('.')
  const integerDigitsBeforeCursor = value.slice(0, decimalPosition === -1 ? cursor : Math.min(cursor, decimalPosition)).replace(/\D/g, '').length
  const decimalsBeforeCursor = decimalPosition !== -1 && cursor > decimalPosition
    ? Math.min(2, value.slice(decimalPosition + 1, cursor).replace(/\D/g, '').length)
    : 0

  displayValue.value = formatInput(value)
  emit('update:modelValue', toNumber(displayValue.value))

  nextTick(() => {
    const formattedDecimalPosition = displayValue.value.indexOf('.')
    let nextCursor = formattedDecimalPosition

    if (decimalPosition !== -1 && cursor > decimalPosition) {
      nextCursor = formattedDecimalPosition + 1 + decimalsBeforeCursor
    } else {
      let seenDigits = 0
      for (let index = 0; index < formattedDecimalPosition; index += 1) {
        if (/\d/.test(displayValue.value[index] ?? '')) seenDigits += 1
        if (seenDigits === integerDigitsBeforeCursor) {
          nextCursor = index + 1
          break
        }
      }
      if (integerDigitsBeforeCursor === 0) nextCursor = 0
    }

    input.setSelectionRange(nextCursor, nextCursor)
  })
}

function focus(event: FocusEvent) {
  isFocused.value = true
  const input = event.target as HTMLInputElement
  input.select()
}

function blur() {
  isFocused.value = false
  const value = toNumber(displayValue.value)
  emit('update:modelValue', value)
  emit('change', value)
  displayValue.value = format(value)
}

watch(() => props.modelValue, (value) => {
  if (!isFocused.value) displayValue.value = format(value)
}, { immediate: true })
</script>

<template>
  <input
    v-bind="$attrs"
    :value="displayValue"
    type="text"
    inputmode="decimal"
    autocomplete="off"
    @input="updateValue"
    @focus="focus"
    @blur="blur"
  >
</template>
