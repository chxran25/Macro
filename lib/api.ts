// app/api/api.ts
import type { Meal } from "../types/meal";

const BASE = "https://calorieboy.onrender.com/api/users";

/**
 * Small helper to call our API with consistent behavior.
 * - Adds JSON headers
 * - Parses JSON
 * - Surfaces backend error/message text when !ok
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        ...init,
    });

    // Try to parse JSON either way
    let data: any = null;
    try {
        data = await res.json();
    } catch {
        // ignore parse error (e.g., empty body)
    }

    if (!res.ok) {
        // Backend for /getWeekly may send { error } or { message }
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return data as T;
}

/* =======================
   AUTH / SIGNUP
   ======================= */

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

/* =======================
   WEEKLY PLAN
   ======================= */

// weeklyPlan.plan[day][section] = Meal[]
export type WeeklyPlan = {
    plan: Record<string, Record<string, Meal[]>>;
    // allow future metadata without breaking the app
    [k: string]: any;
};

export type WeeklyPlanResponse = {
    userId: string;
    name: string;
    weeklyPlan: WeeklyPlan;
};

/**
 * Fetch user's weekly plan.
 * Backend behavior (per spec):
 * - 401 if not logged in
 * - 404 if user not found OR no weekly plan
 * - 200 with { userId, name, weeklyPlan } otherwise
 */
export async function getWeeklyPlan(token: string) {
    return request<WeeklyPlanResponse>("/getWeekly", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}
