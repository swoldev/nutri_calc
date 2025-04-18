// Assuming GenderType is defined like: export enum GenderType { Male, Female }
import { GenderType } from "./models"; // Assuming path is correct

// --- Constants ---
// Conversion Factors
const CM_PER_INCH = 2.54;
const KG_PER_LB = 2.20462; // More accurate conversion factor

// IBW Calculation (Hamwi Method)
const IBW_BASE_HEIGHT_IN = 60;
const IBW_BASE_WEIGHT_MALE_LBS = 106;
const IBW_BASE_WEIGHT_FEMALE_LBS = 100;
const IBW_ADDITIONAL_WEIGHT_MALE_LBS_PER_INCH = 6;
const IBW_ADDITIONAL_WEIGHT_FEMALE_LBS_PER_INCH = 5;
// IBW Frame Size Adjustment Thresholds (Height cm / Wrist cm)
const IBW_FRAME_SMALL_MALE_RATIO = 10.4;
const IBW_FRAME_LARGE_MALE_RATIO = 9.6;
const IBW_FRAME_SMALL_FEMALE_RATIO = 11;
const IBW_FRAME_LARGE_FEMALE_RATIO = 10.1;
const IBW_FRAME_ADJUST_SMALL_FACTOR = 0.9; // -10%
const IBW_FRAME_ADJUST_LARGE_FACTOR = 1.1; // +10%
// IBW Below 60 inches adjustment (Note: Non-standard formula used in original code)
const IBW_BELOW_60_ADJUST_FACTOR = 2;

// Adjusted Body Weight
const ADJ_BW_BMI_THRESHOLD_1 = 30;
const ADJ_BW_BMI_THRESHOLD_2 = 40;
const ADJ_BW_FACTOR_1 = 0.25; // For BMI 30-40
const ADJ_BW_FACTOR_2 = 0.50; // For BMI > 40

// BMR (Mifflin-St Jeor Equation) Constants
const BMR_WEIGHT_FACTOR = 10;
const BMR_HEIGHT_FACTOR = 6.25;
const BMR_AGE_FACTOR = 5;
const BMR_MALE_OFFSET = 5;
const BMR_FEMALE_OFFSET = -161;

// Macronutrient Distribution (Example: 50/20/30 split)
const MACRO_CARB_PERCENT = 0.50;
const MACRO_PROTEIN_PERCENT = 0.20;
const MACRO_FAT_PERCENT = 0.30;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_FAT = 9;

// Fluid Requirement
const FLUID_ML_PER_KG = 30;

export class NutritionService {
  // Parameter properties are concise and fit minimalist style
  constructor(
    private weightKg: number,
    private heightCm: number,
    private gender: GenderType,
    private age: number,
    private activityFactor: number,
    private wristCm?: number,
    private stressFactor?: number
  ) {}

  calculateBMI(): number {
    if (this.heightCm <= 0) return 0; // Avoid division by zero
    const heightM = this.heightCm / 100;
    return this.weightKg / (heightM * heightM);
  }

  /**
   * Calculates Ideal Body Weight (IBW) using the Hamwi method.
   * Includes optional frame size adjustment based on wrist circumference.
   * NOTE: The original formula for heights < 60 inches was non-standard and is kept here,
   * but should be validated for clinical use.
   * NOTE: The original code included a questionable +10% adjustment for height < 20 inches, which has been removed.
   * NOTE: The original code used Math.floor before lbs->kg conversion; this is kept but may underestimate results.
   */
  calculateIBW(): number {
    const heightIn = this.heightCm / CM_PER_INCH;
    let ibwLbs: number;

    const baseWeightLbs = this.gender === GenderType.Male ? IBW_BASE_WEIGHT_MALE_LBS : IBW_BASE_WEIGHT_FEMALE_LBS;
    const additionalWeightLbsPerInch = this.gender === GenderType.Male ? IBW_ADDITIONAL_WEIGHT_MALE_LBS_PER_INCH : IBW_ADDITIONAL_WEIGHT_FEMALE_LBS_PER_INCH;

    if (heightIn >= IBW_BASE_HEIGHT_IN) {
      ibwLbs = baseWeightLbs + additionalWeightLbsPerInch * (heightIn - IBW_BASE_HEIGHT_IN);
    } else {
      // WARNING: Non-standard formula from original code for heights < 60 inches
      const inchesBelow60 = IBW_BASE_HEIGHT_IN - heightIn;
      ibwLbs = baseWeightLbs - IBW_BELOW_60_ADJUST_FACTOR * inchesBelow60;
      // Ensure IBW doesn't become unreasonably low or negative for very short heights
      ibwLbs = Math.max(ibwLbs, 0);
    }

    // Frame size adjustment
    if (this.wristCm && this.wristCm > 0 && this.heightCm > 0) {
      const R = this.heightCm / this.wristCm;

      if (this.gender === GenderType.Male) {
        if (R > IBW_FRAME_SMALL_MALE_RATIO) { // Changed >= to > for consistency with <= below
          ibwLbs *= IBW_FRAME_ADJUST_SMALL_FACTOR; // Small Frame
        } else if (R < IBW_FRAME_LARGE_MALE_RATIO) { // Changed <= to < for consistency
          ibwLbs *= IBW_FRAME_ADJUST_LARGE_FACTOR; // Large Frame
        }
      } else { // Female
        if (R > IBW_FRAME_SMALL_FEMALE_RATIO) { // Changed >= to >
          ibwLbs *= IBW_FRAME_ADJUST_SMALL_FACTOR; // Small Frame
        } else if (R < IBW_FRAME_LARGE_FEMALE_RATIO) { // Changed <= to <
          ibwLbs *= IBW_FRAME_ADJUST_LARGE_FACTOR; // Large Frame
        }
      }
    }

    // NOTE: Original code had an adjustment for height < 20 inches here, which was removed due to being suspect.

    // Convert from lbs to kg
    // Keeping Math.floor as per original code's comment, but rounding might be more appropriate.
    // Using more accurate conversion factor.
    const ibwKg = Math.floor(ibwLbs) / KG_PER_LB;

    return ibwKg > 0 ? ibwKg : 0; // Ensure non-negative result
  }

  /**
   * Calculates Adjusted Body Weight (AdjBW) for use in nutritional calculations
   * for individuals with BMI > 30. Otherwise, returns actual body weight.
   */
  calculateAdjustedBW(): number {
    const ibwKg = this.calculateIBW();
    const bmi = this.calculateBMI();

    if (bmi > ADJ_BW_BMI_THRESHOLD_2) { // BMI > 40
      return ibwKg + (this.weightKg - ibwKg) * ADJ_BW_FACTOR_2;
    }
    if (bmi > ADJ_BW_BMI_THRESHOLD_1) { // BMI 30.1 - 40
      return ibwKg + (this.weightKg - ibwKg) * ADJ_BW_FACTOR_1;
    }

    // For BMI <= 30, adjusted weight is not typically used; return actual weight.
    return this.weightKg;
  }

  /**
   * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
   */
  calculateBMR(): number {
    const baseCalculation = (BMR_WEIGHT_FACTOR * this.weightKg) + (BMR_HEIGHT_FACTOR * this.heightCm) - (BMR_AGE_FACTOR * this.age);
    const offset = this.gender === GenderType.Male ? BMR_MALE_OFFSET : BMR_FEMALE_OFFSET;
    const bmr = baseCalculation + offset;
    return bmr > 0 ? bmr : 0; // Ensure non-negative result
  }

  /**
   * Calculates Total Energy Expenditure (TEE) based on BMR, activity factor,
   * and an optional stress factor.
   */
  calculateTEE(): number {
    const bmr = this.calculateBMR();
    const tee = bmr * this.activityFactor * (this.stressFactor ?? 1);
    return tee > 0 ? tee : 0; // Ensure non-negative result
  }

  /**
   * Calculates macronutrient distribution in grams for a given total calorie goal.
   * Uses a fixed 50% Carb, 20% Protein, 30% Fat distribution.
   */
  calculateMacronutrientDistribution(totalCalories: number): { carbs: number; protein: number; fat: number } {
    if (totalCalories <= 0) {
        return { carbs: 0, protein: 0, fat: 0 };
    }
    return {
      carbs: (totalCalories * MACRO_CARB_PERCENT) / KCAL_PER_G_CARB,
      protein: (totalCalories * MACRO_PROTEIN_PERCENT) / KCAL_PER_G_PROTEIN,
      fat: (totalCalories * MACRO_FAT_PERCENT) / KCAL_PER_G_FAT
    };
  }

  /**
   * Calculates a basic fluid requirement estimate (e.g., 30 mL per kg).
   */
  calculateFluidRequirement(): number {
    const requirement = this.weightKg * FLUID_ML_PER_KG;
    return requirement > 0 ? requirement : 0; // Ensure non-negative result
  }
}
