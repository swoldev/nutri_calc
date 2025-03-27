<script setup lang="ts">
import type { NutritionDetails } from './components/NutritionCalculator/models';
import NutritionCalculator from './components/NutritionCalculator/NutritionCalculator.vue';
import NutritionResults from './components/NutritionResults/NutritionResults.vue';

let nutritonDetails: NutritionDetails
const setNutritionDetails = (eventData: NutritionDetails) => {
  nutritonDetails = eventData
}
</script>

<template>
  <div>
    <NutritionCalculator @nutrition-details="setNutritionDetails" />
    <NutritionResults :nutrition-details="nutritonDetails" />
  </div>
</template>
