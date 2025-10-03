export interface SignupPayload {
    name: string;
    phoneNumber: string;        // +91XXXXXXXXXX
    addresses: string[];        // at least one
    gender: "male" | "female" | "other";
    fitnessGoal: string;
    dietType: string;
    spicePreference: string;
    cuisinePreferences: string[];
    mealFrequency: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface SignupResponse {
    message: string;
    otpExpiresInSeconds: number;
}
