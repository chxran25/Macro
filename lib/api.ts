import type { Meal, WeeklyPlanResponse } from "../types/meal";

const BASE = "https://calorieboy.onrender.com/api/users";

/** Utility to colorize logs (works in Metro console) */
const log = {
    info: (msg: string, ...rest: any[]) => console.log(`\x1b[36m[API INFO]\x1b[0m ${msg}`, ...rest),
    success: (msg: string, ...rest: any[]) => console.log(`\x1b[32m[API OK]\x1b[0m ${msg}`, ...rest),
    warn: (msg: string, ...rest: any[]) => console.warn(`\x1b[33m[API WARN]\x1b[0m ${msg}`, ...rest),
    error: (msg: string, ...rest: any[]) => console.error(`\x1b[31m[API ERR]\x1b[0m ${msg}`, ...rest),
};

/** Generic fetch helper with logging + sane error bubbling */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${BASE}${path}`;
    const start = Date.now();

    log.info(`→ ${init.method || "GET"} ${url}`);

    if (init.body) {
        try {
            const parsed = JSON.parse(init.body as string);
            log.info(`📦 Payload:`, parsed);
        } catch {
            log.info(`📦 Raw body:`, init.body);
        }
    }

    const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        ...init,
    });

    const time = Date.now() - start;
    let raw = "";
    let data: any = null;

    try {
        raw = await res.text();
        data = raw ? JSON.parse(raw) : null;
    } catch {
        log.warn(`⚠️ Response not JSON-parsable`);
    }

    if (!res.ok) {
        const msg = data?.error || data?.message || raw || `HTTP ${res.status}`;
        const err = new Error(msg) as Error & { status?: number };
        err.status = res.status;

        log.error(`← ${res.status} ${url} (${time} ms):`, data || raw);
        throw err;
    }

    log.success(`← ${res.status} ${url} (${time} ms)`);
    log.info(`✅ Response:`, data);

    return (data ?? {}) as T;
}

/* =======================
   AUTH / SIGNUP
   ======================= */

export type SignupPayload = {
    name: string;
    phoneNumber: string; // "+91XXXXXXXXXX"
    addresses: Array<{
        flatNo: string;
        block: string;
        apartment: string;
    }>;
    gender: "Man" | "Woman";
    fitnessGoal: "Maintain" | "Lose Fat" | "Build Muscle" | string;
    dietType: "Veg" | "Non-Veg" | "Both" | string;
    spicePreference: "Not Spicy" | "Mild" | "Medium" | "Spicy" | string;
    cuisinePreferences: string[];
    mealFrequency: number; // 3 | 4 | 5 | 6
    calories: number;
    protein: number;
    carbs: number;
    fat: number;

    // optional
    age?: number;
    height?: number;
    weight?: number;
    dietaryRestrictions?: string[];
    otherAllergens?: string;
    foodDislikes?: string;
    eatingWindow?: string;
    location?: { latitude: number; longitude: number };
};

export async function signupUser(payload: SignupPayload) {
    log.info(`🟦 Calling /signup`);
    return request<{ message: string; otpExpiresInSeconds?: number }>("/signup", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/* =======================
   WEEKLY PLAN
   ======================= */

/**
 * Fetch user's weekly plan.
 * Backend:
 * - 401 if not logged in
 * - 404 if user not found OR no weekly plan
 * - 200 with { userId, name, weeklyPlan } otherwise
 */
export async function getWeeklyPlan(token: string) {
    log.info(`🟧 Fetching weekly plan with token`);
    return request<WeeklyPlanResponse>("/getWeekly", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

/* =======================
   RECOMMEND (first-time)
   ======================= */

export async function recommendWeeklyMeals(token: string) {
    log.info(`🟨 Generating meal recommendations`);
    return request<{
        success: boolean;
        message: string;
        method?: string;
        weekPlan?: any;
    }>("/recommend-meals", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
}
