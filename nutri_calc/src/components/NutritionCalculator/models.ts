export enum GenderType {
  Male,
  Female
}

export interface NutritionDetails {
  bmi: number
  ibw: number
  tee: number
  macronutrients: MacronutrientDetails
  fluids: number
}

interface MacronutrientDetails {
  carbohydrates: number
  protein: number
  fat: number
}
