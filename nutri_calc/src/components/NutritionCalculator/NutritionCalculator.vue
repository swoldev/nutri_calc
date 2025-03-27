<script setup lang="ts">
import Card from "primevue/card"
import InputNumber from 'primevue/inputnumber'
import FloatLabel from 'primevue/floatlabel'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { ref, type Ref } from "vue"
import { NutritionService } from "./nutritionCalcService"
import { GenderType, type NutritionDetails } from "./models"

const emit = defineEmits<{
  (e: 'nutritionDetails', data: NutritionDetails): NutritionDetails
}>()

interface GenderDdl {
  name: string,
  code: GenderType
}

const age: Ref<number | undefined> = ref(undefined);
const gender: Ref<GenderType | undefined> = ref(undefined);
const weightKg: Ref<number | undefined> = ref(undefined);
const heightCm: Ref<number | undefined> = ref(undefined);
const wristCm: Ref<number | undefined> = ref(undefined);
const pal: Ref<number | undefined> = ref(undefined);
const stressFactor: Ref<number | undefined> = ref(undefined);
const activityFactor: Ref<number | undefined> = ref(undefined);

const genderOptions: Array<GenderDdl> = [
  { name: "Male", code: GenderType.Male },
  { name: "Female", code: GenderType.Female }
]

const handleCalculate = (): void => {
  console.log("calcing");
  const nutritionService = new NutritionService(
    weightKg.value!,    // weightKg
    heightCm.value!,   // heightCm
    gender.value!,// gender
    age.value!,     // age
    activityFactor.value!,
    wristCm.value!,    // wristCm (currently unused in calculations)
    stressFactor.value!,
  );

  // const nutritionService = new NutritionService(
  //   77,    // weightKg
  //   183,   // heightCm
  //   GenderType.Male,
  //   28,
  //   wristCm.value!,    // wristCm (currently unused in calculations)
  // );

  //const activityFactor = 1.55; // Moderate activity

  const bmi = nutritionService.calculateBMI();
  const ibw = nutritionService.calculateIBW();
  let adjBW = 0;
  if (bmi > 30 || bmi > 40) {
    adjBW = nutritionService.calculateAdjustedBW();
  }
  const bmr = nutritionService.calculateBMR();
  const tee = nutritionService.calculateTEE();
  const macros = nutritionService.calculateMacronutrientDistribution(tee);
  const fluidRequirement = nutritionService.calculateFluidRequirement();

  const eventData: NutritionDetails = {
    bmi: bmi,
    ibw: adjBW > 0 ? adjBW : ibw,
    tee: tee,
    macronutrients: {
      carbohydrates: macros.carbs,
      protein: macros.protein,
      fat: macros.fat
    },
    fluids: fluidRequirement
  };

  emit('nutritionDetails', eventData)

  console.log(JSON.stringify({
    'Body Mass Index (BMI)': `${bmi} kg/m²`,
    'Ideal Body Weight (kg)': `${ibw} kg`,
    'Adjusted Body Weight (kg)': `${adjBW} kg`,
    'Basal Metabolic Rate (BMR)': `${bmr} kcal/day`,
    'Total Energy Expenditure (TEE)': `${tee} kcal/day (Activity Factor: ${activityFactor.value})`,
    'Daily Macronutrients (grams)': {
      'Carbohydrates (50% total)': `${macros.carbs.toFixed(0)} g`,
      'Protein (20% total)': `${macros.protein.toFixed(0)} g`,
      'Fat (30% total)': `${macros.fat.toFixed(0)} g`
    },
    'Daily Fluid Requirement': `${fluidRequirement.toFixed(0)} mL/day (${weightKg.value}kg × 30mL/kg)`
  }));
}
</script>

<template>
  <div>
    <Card>
      <template #title>
        <h3 class="title">
          Nutritional Information
        </h3>
      </template>
      <template #content>
        <div class="flex-container">
          <FloatLabel variant="on">
            <InputNumber inputId="userAge" v-model="age" />
            <label for="userAge">Age</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <Select v-model="gender" inputId="userGender" :options="genderOptions" optionLabel="name"
              class="gender-ddl" />
            <label for="userGender">Gender</label>
          </FloatLabel>

          <div class="inner-flex-container">
            <div>
              <FloatLabel variant="on">
                <InputNumber inputId="userWeight" v-model="weightKg" />
                <label for="userWeight">Weight</label>
              </FloatLabel>
            </div>
          </div>

          <FloatLabel variant="on">
            <InputNumber inputId="userHeight" v-model="heightCm" />
            <label for="userHeight">Height</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputNumber inputId="userWrist" v-model="wristCm" />
            <label for="userWrist">Wrist size (optional)</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputNumber inputId="userPal" v-model="pal" />
            <label for="userPal">PAL</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputNumber inputId="userSf" v-model="stressFactor" />
            <label for="userSf">Stress factor (optional)</label>
          </FloatLabel>

          <Button label="Calculate" class="calculate-button" raised @click="handleCalculate" />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.title {
  margin-bottom: 1rem;
}

.flex-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.inner-flex-container {
  display: flex;
  gap: 10px;
}

.gender-ddl {
  width: 20%;
}

.calculate-button {
  margin-top: .5rem;
  width: 25%;
}
</style>
