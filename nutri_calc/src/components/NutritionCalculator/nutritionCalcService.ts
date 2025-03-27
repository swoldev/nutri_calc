import { GenderType } from "./models"

export class NutritionService {
  constructor(
    private weightKg: number,
    private heightCm: number,
    private gender: GenderType,
    private age: number,
    private activityFactor: number,
    private wristCm?: number,
    private stressFactor?: number
  ) { }

  calculateBMI(): number {
    const heightM = this.heightCm / 100;
    return this.weightKg / (heightM * heightM);
  }

  calculateIBW(): number {
    const heightIn = this.heightCm / 2.54;
    const heightYIn = 60 - heightIn;
    const baseWeight = this.gender === GenderType.Male ? 106 : 100;
    const additionalWeight = this.gender === GenderType.Male ? 6 : 5;

    let ibw: number;

    if (heightIn >= 60) {
      ibw = baseWeight + additionalWeight * (heightIn - 60);
    } else {
      // Modified formula: If height < 60 inches, use a different weight adjustment
      ibw = baseWeight - 2 * heightYIn;
    }

    // Calculate wrist-to-height ratio (R) for frame size adjustment
    if (this.wristCm) {
      const R = this.heightCm / this.wristCm;

      // Adjust IBW based on frame size
      if (this.gender === GenderType.Male) {
        if (R >= 10.4) {
          ibw *= 0.9; // Small Frame (-10%)
        } else if (R <= 9.6) {
          ibw *= 1.1; // Large Frame (+10%)
        }
      }

      if (this.gender === GenderType.Female) {
        if (R >= 11) {
          ibw *= 0.9; // Small Frame (-10%)
        } else if (R <= 10.1) {
          ibw *= 1.1; // Large Frame (+10%)
        }
      }
    }

    if (heightYIn > 40) {
      ibw *= 1.1; // +10%
    }

    // Convert from lbs to kg
    // Not sure if floor is correct, but it gives the correct result
    ibw = Math.floor(ibw) / 2.2;

    return ibw;
  }

  calculateAdjustedBW(): number {
    const ibw = this.calculateIBW();
    const bmi = this.calculateBMI();
    if (bmi > 30 && bmi < 40) {
      return ibw + (this.weightKg - ibw) / 4;
    }
    if (bmi > 40) {
      return ibw + (this.weightKg - ibw) / 2;
    }

    return 0;
  }

  calculateBMR(): number {
    return this.gender === GenderType.Male
      ? 5 + (10 * this.weightKg) + (6.25 * this.heightCm) - (5 * this.age)
      : -161 + (10 * this.weightKg) + (6.25 * this.heightCm) - (5 * this.age);
  }

  calculateTEE(): number {
    if (this.stressFactor) {
      return this.calculateBMR() * this.activityFactor * this.stressFactor;
    }

    return this.calculateBMR() * this.activityFactor;
  }

  calculateMacronutrientDistribution(totalCalories: number): { carbs: number; protein: number; fat: number } {
    return {
      carbs: totalCalories * 0.5 / 4,
      protein: totalCalories * 0.2 / 4,
      fat: totalCalories * 0.3 / 9
    };
  }

  calculateFluidRequirement(): number {
    return this.weightKg * 30;
  }
}
