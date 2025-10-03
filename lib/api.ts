const BASE = "https://calorieboy.onrender.com/api/users";

async function request<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        ...init,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Something went wrong");
    return data as T;
}

export type SignupPayload = {
    name: string;
    phoneNumber: string; // +91XXXXXXXXXX
    addresses: Array<{ line1: string }>;
    gender: string;
    fitnessGoal: string;
    dietType: string;
    spicePreference: string;
    cuisinePreferences: string[];
    mealFrequency: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    // Optional extras the backend ignores gracefully
    age?: number;
    heightCm?: number;
    weightKg?: number;
    dietaryRestrictions?: string[];
    dislikes?: string;
    eatingWindow?: string;
};

export async function signupUser(payload: SignupPayload) {
    return request<{ message: string; otpExpiresInSeconds: number }>("/signup", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
