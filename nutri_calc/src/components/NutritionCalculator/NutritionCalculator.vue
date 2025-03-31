<script setup lang="ts">
import Card from "primevue/card"
import InputNumber from 'primevue/inputnumber'
import FloatLabel from 'primevue/floatlabel'
import Select from 'primevue/select'
import Button from 'primevue/button'
// Removed Panel import
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { ref, type Ref, computed } from "vue"
import { NutritionService } from "./nutritionCalcService"
// Assuming models are now potentially split or shared
import { GenderType } from "./models" // Or from a shared models file
import type { NutritionDetails } from "./models" // Import type from ResultsPanel models
import ResultsPanel from './components/ResultsPanel.vue' // Import the new component

// --- Toast Service ---
const toast = useToast();

// --- Interfaces ---
interface GenderDdl {
  name: string,
  code: GenderType
}

// --- Refs for Input Fields ---
const age: Ref<number | undefined> = ref(undefined);
const gender: Ref<GenderType | undefined> = ref(undefined);
const weightKg: Ref<number | undefined> = ref(undefined);
const heightCm: Ref<number | undefined> = ref(undefined);
const wristCm: Ref<number | undefined> = ref(undefined);
const activityFactor: Ref<number | undefined> = ref(undefined);
const stressFactor: Ref<number | undefined> = ref(undefined);

// --- Ref for Storing Results ---
// This ref remains here, as the parent calculates and holds the results state
const nutritionResults: Ref<NutritionDetails | null> = ref(null);

// --- Static Data ---
const genderOptions: Array<GenderDdl> = [
  { name: "Male", code: GenderType.Male },
  { name: "Female", code: GenderType.Female }
]

// --- Computed Property for Button Disabled State ---
const isCalculationDisabled = computed(() => {
  return !age.value || gender.value === undefined || !weightKg.value || !heightCm.value || !activityFactor.value;
});

// --- Methods ---
const handleCalculate = (): void => {
  const currentWeightKg = weightKg.value;
  const currentHeightCm = heightCm.value;
  const currentGender = gender.value;
  const currentAge = age.value;
  const currentActivityFactor = activityFactor.value;

  if (currentWeightKg === undefined || currentHeightCm === undefined || currentGender === undefined || currentAge === undefined || currentActivityFactor === undefined) {
    toast.add({ severity: 'error', summary: 'Missing Information', detail: 'Please fill in all required fields (Age, Gender, Weight, Height, Activity Factor).', life: 3000 });
    nutritionResults.value = null; // Clear previous results
    return;
  }

  const nutritionService = new NutritionService(
    currentWeightKg,
    currentHeightCm,
    currentGender,
    currentAge,
    currentActivityFactor,
    wristCm.value,
    stressFactor.value
  );

  try {
    const bmi = nutritionService.calculateBMI();
    const ibw = nutritionService.calculateIBW();
    const calculationWeightKg = nutritionService.calculateAdjustedBW();
    //const bmr = nutritionService.calculateBMR();
    const tee = nutritionService.calculateTEE();
    const macros = nutritionService.calculateMacronutrientDistribution(tee);
    const fluidRequirement = nutritionService.calculateFluidRequirement();

    // Update local state
    nutritionResults.value = {
      bmi: bmi,
      ibw: ibw,
      calculationWeightKg: calculationWeightKg,
      tee: tee,
      macronutrients: {
        carbohydrates: macros.carbs,
        protein: macros.protein,
        fat: macros.fat
      },
      fluids: fluidRequirement
    };

  } catch (error) {
      console.error("Calculation Error:", error);
      nutritionResults.value = null;
      toast.add({ severity: 'error', summary: 'Calculation Failed', detail: 'An unexpected error occurred.', life: 3000 });
  }
}
</script>

<template>
  <div>
    <Toast />

    <!-- Input Card -->
    <Card class="card-container">
      <template #title>
        <h3 class="title">
          Nutritional Information Input
        </h3>
      </template>
      <template #content>
        <div class="flex-container">
          <!-- Input fields remain the same... -->
          <FloatLabel>
            <InputNumber inputId="userAge" v-model="age" :min="0" />
            <label for="userAge">Age (Years)</label>
          </FloatLabel>
          <FloatLabel>
            <Select v-model="gender" inputId="userGender" :options="genderOptions" optionLabel="name" optionValue="code" class="w-full" />
            <label for="userGender">Gender</label>
          </FloatLabel>
          <FloatLabel>
            <InputNumber inputId="userWeight" v-model="weightKg" :min="0" mode="decimal" :minFractionDigits="1" :maxFractionDigits="2" suffix=" kg"/>
            <label for="userWeight">Weight (kg)</label>
          </FloatLabel>
          <FloatLabel>
            <InputNumber inputId="userHeight" v-model="heightCm" :min="0" suffix=" cm"/>
            <label for="userHeight">Height (cm)</label>
          </FloatLabel>
          <FloatLabel>
            <InputNumber inputId="userWrist" v-model="wristCm" :min="0" mode="decimal" :minFractionDigits="1" :maxFractionDigits="1" suffix=" cm"/>
            <label for="userWrist">Wrist Circumference (cm, Optional)</label>
          </FloatLabel>
          <FloatLabel>
            <InputNumber inputId="userActivityFactor" v-model="activityFactor" :min="1" mode="decimal" :minFractionDigits="1" :maxFractionDigits="2" />
            <label for="userActivityFactor">Activity Factor (e.g., 1.2-1.9)</label>
          </FloatLabel>
          <FloatLabel>
            <InputNumber inputId="userStressFactor" v-model="stressFactor" :min="0" mode="decimal" :minFractionDigits="1" :maxFractionDigits="2" />
            <label for="userStressFactor">Stress Factor (Optional, e.g., 1.0-1.5)</label>
          </FloatLabel>
          <Button label="Calculate" class="calculate-button" icon="pi pi-calculator" raised @click="handleCalculate" :disabled="isCalculationDisabled" />
        </div>
      </template>
    </Card>

    <ResultsPanel :results="nutritionResults" />
  </div>
</template>

<style scoped>
/* Styles specific to the form Card/Container */
.card-container {
  margin-bottom: 2rem;
  border-radius: 6px;
  border: 1px solid var(--p-content-border-color);
}

.title {
  margin-bottom: 1.5rem;
  text-align: center;
}

.flex-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 400px;
  margin: 0 auto;
}

.p-inputnumber, .p-select {
    width: 100%;
}

.calculate-button {
  margin-top: 1rem;
  width: 100%;
}

.p-floatlabel {
  margin-top: 1rem;
}

.mb-4 { margin-bottom: 1rem; }

/* Styles related to the results grid/panel were MOVED to ResultsPanel.vue */
</style>
