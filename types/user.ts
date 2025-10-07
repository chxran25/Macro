// types/user.ts

/** -------- Server contracts inferred from Render logs -------- */

export type GenderBackend = "Man" | "Woman"; // server enum is UI-style, not "male"/"female"

export interface Address {
    flatNumber: string;
    block: string;
    apartment: string;
}

export interface SignupPayload {
    name: string;
    phoneNumber: string;        // +91XXXXXXXXXX
    addresses: Address[];       // embedded docs, not strings
    gender: GenderBackend;
    fitnessGoal: string;
    dietType: string;
    spicePreference: string;
    cuisinePreferences: string[];
    mealFrequency: number;      // 3 | 4 | 5 | 6
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface SignupResponse {
    message: string;
    otpExpiresInSeconds: number;
}

/** ---------------- UI helpers ---------------- */

export type UIGender = "Man" | "Woman";
export type MealFrequencyOption = "3 Meals" | "4 Meals" | "5 Meals" | "6 Meals";

export function mealFrequencyToNumber(mf: MealFrequencyOption | string): number {
    const m = String(mf).match(/\d+/);
    return m ? parseInt(m[0], 10) : NaN;
}

export function buildAddressObj(
    flatNo: string,
    block: string,
    apartment: string
): Address {
    return {
        flatNumber: flatNo.trim(),
        block: block.trim(),
        apartment: apartment.trim(),
    };
}
