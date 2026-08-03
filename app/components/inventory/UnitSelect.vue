<script setup lang="ts">
import type { MeasurementUnit } from '~/types/article'

const props = withDefaults(defineProps<{
  id: string
  modelValue: number | null
  units: MeasurementUnit[]
  placeholder?: string
  required?: boolean
  allowEmpty?: boolean
}>(), {
  placeholder: 'Seleccione una unidad',
  required: false,
  allowEmpty: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const selectedUnitIsMissing = computed(() => Boolean(
  props.modelValue
  && !props.units.some(unit => Number(unit.codigo) === Number(props.modelValue)),
))

function updateValue(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value === '' ? null : Number(value))
}
</script>

<template>
  <select
    :id="id"
    class="form-select"
    :value="modelValue ?? ''"
    :required="required"
    @change="updateValue"
  >
    <option v-if="allowEmpty" value="">No aplica</option>
    <option v-else :value="0" disabled>{{ placeholder }}</option>
    <option v-if="selectedUnitIsMissing" :value="modelValue">
      {{ modelValue }} — Unidad no disponible en el catálogo
    </option>
    <option v-for="unit in units" :key="unit.id" :value="Number(unit.codigo)">
      {{ unit.codigo }} — {{ unit.medidaNombre }} ({{ unit.abreviatura }})
    </option>
  </select>
</template>

<style scoped>
.form-select {
  width: 100%;
  min-height: 42px;
  border-color: #d9e1ec;
  border-radius: 9px;
  background-color: #fff;
  color: #344054;
}
</style>
