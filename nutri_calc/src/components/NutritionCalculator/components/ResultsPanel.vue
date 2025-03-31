<script setup lang="ts">
import { computed } from 'vue';
import Panel from 'primevue/panel';
import { Doughnut } from 'vue-chartjs'; // Import the Doughnut chart component
import {
  Chart as ChartJS, // Rename Chart to ChartJS to avoid naming conflicts if necessary
  Title,
  Tooltip,
  Legend,
  ArcElement, // ArcElement is needed for doughnut/pie charts
  type TooltipItem
} from 'chart.js';
import type { NutritionDetails } from '../models'; // Import the type definition

// Register the necessary Chart.js components globally for vue-chartjs
// These are the features the chart will use.
ChartJS.register(Title, Tooltip, Legend, ArcElement);

// Define the props this component accepts
const props = defineProps<{
  results?: NutritionDetails | null
}>();

// --- Computed properties for chart data and options ---

// Computed property for the chart data object
const chartData = computed(() => {
  // Ensure results and macronutrients exist before creating data
  if (!props.results?.macronutrients) {
    // Return an empty structure if data is not available
    // This prevents errors when props.results is initially null/undefined
    return { labels: [], datasets: [] };
  }

  const macros = props.results.macronutrients;

  return {
    labels: ['Carbohydrates (g)', 'Protein (g)', 'Fat (g)'],
    datasets: [
      {
        label: 'Macronutrients (grams/day)', // Dataset label (can be used in tooltips/legends)
        backgroundColor: [
          'rgb(255, 99, 132)',  // Example color for Carbs
          'rgb(54, 162, 235)',  // Example color for Protein
          'rgb(255, 205, 86)'   // Example color for Fat
        ],
        hoverOffset: 4,
        data: [
          // Use toFixed(0) to ensure whole numbers as strings or numbers
          Number(macros.carbohydrates.toFixed(0)),
          Number(macros.protein.toFixed(0)),
          Number(macros.fat.toFixed(0))
        ],
      },
    ],
  };
});

// Computed property for the chart options object
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false, // Important for fitting chart in a sized container
  plugins: {
    legend: {
      position: 'top' as const, // Use 'as const' for type safety with literal types
    },
    tooltip: {
      callbacks: {
        label: function (context: TooltipItem<'doughnut'>) {
          let label = context.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed !== null) {
            label += `${context.parsed} g`;
          }
          return label;
        }
      }
    },
    // Optional: Add a title if desired
    // title: {
    //   display: true,
    //   text: 'Macronutrient Distribution'
    // }
  }
}));

// Unique IDs for accessibility and potential multiple charts on a page
const chartId = 'macro-doughnut-chart';
const datasetIdKey = 'macronutrient-dataset'; // Key used to identify the dataset

</script>

<template>
  <Panel v-if="props.results" toggleable>
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-chart-bar"></i>
        <span class="font-bold">Nutrition Calculation Results</span>
      </div>
    </template>

    <div class="results-grid">
      <!-- Other result items remain the same -->
      <div class="result-item">
        <strong>BMI:</strong>
        <span>{{ props.results.bmi.toFixed(1) }} kg/m²</span>
      </div>
      <div class="result-item">
        <strong>Ideal Body Weight (IBW):</strong>
        <span>{{ props.results.ibw.toFixed(1) }} kg</span>
      </div>
      <div class="result-item">
        <strong>Calculation Weight:</strong>
        <span>{{ props.results.calculationWeightKg.toFixed(1) }} kg</span>
        <small class="block text-xs text-surface-500">(Actual or Adjusted based on BMI)</small>
      </div>
      <div class="result-item">
        <strong>Total Energy Expenditure (TEE):</strong>
        <span>{{ props.results.tee.toFixed(0) }} kcal/day</span>
      </div>
      <div class="result-item">
        <strong>Fluid Requirement:</strong>
        <span>{{ props.results.fluids.toFixed(0) }} mL/day</span>
      </div>

      <!-- Macronutrient Chart Section using vue-chartjs -->
      <div class="result-item col-span-full">
        <strong>Estimated Macronutrients (grams/day):</strong>
        <!-- Container div to control chart size -->
        <div class="macro-layout-container mt-2">
          <div class="macro-text-area">
            <div v-if="props.results?.macronutrients" class="macro-text-list">
              <div class="macro-text-item">
                <span class="font-medium">Carbohydrates:</span>
                <span class="ml-2 text-primary-color">{{ props.results.macronutrients.carbohydrates.toFixed(0) }}
                  g</span>
              </div>
              <div class="macro-text-item mt-1">
                <span class="font-medium">Protein:</span>
                <span class="ml-2 text-primary-color">{{ props.results.macronutrients.protein.toFixed(0) }} g</span>
              </div>
              <div class="macro-text-item mt-1">
                <span class="font-medium">Fat:</span>
                <span class="ml-2 text-primary-color">{{ props.results.macronutrients.fat.toFixed(0) }} g</span>
              </div>
            </div>
            <div v-else class="text-center text-surface-500 text-sm py-4">
              Details not available.
            </div>
          </div>

          <!-- Use the Doughnut component from vue-chartjs -->
          <!-- Only render chart if data is valid -->
          <div class="macro-chart-area">
            <div class="chart-container" style="position: relative; height:200px; max-width: 250px;">
              <Doughnut v-if="props.results?.macronutrients && chartData.datasets.length > 0" :data="chartData"
                :options="chartOptions" :id="chartId" :dataset-id-key="datasetIdKey" :width="400" :height="250"
                :css-classes="'my-doughnut-chart-canvas'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Panel>
  <!-- Optional: Show a message if there are no results at all -->
  <div v-else class="p-4 text-center text-surface-600">
    No nutrition results to display.
  </div>
</template>

<style scoped>
/* --- Existing Styles --- */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.result-item {
  padding: 0.75rem;
  border-radius: 6px;
  background-color: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
}

.result-item strong {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--p-text-color);
  font-size: 0.9rem;
}

.result-item span {
  font-size: 1.1rem;
  color: var(--p-primary-color);
  font-weight: 500;
}

.col-span-full {
  grid-column: 1 / -1;
}

/* --- NEW Styles for Side-by-Side Layout --- */
.macro-layout-container {
  display: flex;
  flex-wrap: wrap;
  /* Allow wrapping on small screens */
  gap: 1.5rem;
  /* Adjust spacing between text and chart */
  align-items: center;
  /* Vertically align text and chart */
}

.macro-text-area {
  flex: 1 1 180px;
  /* Grow, Shrink, Basis width ~180px */
  min-width: 150px;
  /* Prevent excessive squishing */
}

.macro-chart-area {
  flex: 1.5 1 250px;
  /* Grow more, Shrink, Basis width ~250px */
  min-width: 200px;
  /* Min width for chart */
  display: flex;
  /* Help center the chart container */
  justify-content: center;
  /* Center chart horizontally if area is wider */
  align-items: center;
  /* Center chart vertically */
}

/* --- Adjusted Styles for Text List --- */
.macro-text-list {
  font-size: 0.9rem;
  color: var(--p-text-secondary-color);
  /* Remove properties that centered it before */
  /* max-width: none;
    margin-left: 0;
    margin-right: 0; */
}

.macro-text-item {
  display: flex;
  justify-content: space-between;
  padding: 0.1rem 0;
  /* Minimal vertical padding */
  /* Remove properties that centered it before */
  /* max-width: none;
    margin-left: 0;
    margin-right: 0; */
}

.macro-text-item .font-medium {
  font-weight: 500;
  color: var(--p-text-color);
  margin-right: 0.5rem;
  /* Add space between label and value */
}

.macro-text-item .text-primary-color {
  color: var(--p-primary-color);
  font-weight: 500;
  text-align: right;
  /* Align value to the right */
}

.macro-text-item.font-semibold span {
  color: var(--p-text-color);
  /* Use standard text color for total label/value */
}

/* --- Adjusted Styles for Chart Container --- */
.chart-container {
  position: relative;
  /* Removed margin: auto */
  width: 100%;
  /* Fill the flex item horizontally */
  /* Max-width and height are now set inline for this example,
       but could be controlled here */
  /* max-width: 250px; */
  /* height: 200px; */
}

.my-doughnut-chart-canvas {
  /* Canvas specific styles if needed */
}


/* --- Utility classes (ensure PrimeFlex or similar is available) --- */
.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.pt-1 {
  padding-top: 0.25rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.block {
  display: block;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: bold;
}

.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.gap-2 {
  gap: 0.5rem;
}

.border-t {
  border-top-width: 1px;
}

.border-surface-200 {
  border-color: var(--p-surface-200, #dee2e6);
}

/* Added fallback */
.dark\:border-surface-700 {
  border-color: var(--p-surface-700, #495057);
  /* Added fallback */
}

.text-surface-600 {
  color: var(--p-text-secondary-color, #495057);
}

.text-surface-500 {
  color: var(--p-text-muted-color, #6c757d);
}

.h-full {
  height: 100%;
}
</style>
