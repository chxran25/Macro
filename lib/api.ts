// lib/api.ts
import type {
    GetWeeklyPlanApiResponse,
    WeeklyMealPlanApiResponse,
} from "../types/meal";

const BASE = "https://calorieboy.onrender.com/api/users";

/** Utility to colorize logs (works in Metro console) */
const log = {
    info: (msg: string, ...rest: any[]) =>
        console.log(`\x1b[36m[API INFO]\x1b[0m ${msg}`, ...rest),
    success: (msg: string, ...rest: any[]) =>
        console.log(`\x1b[32m[API OK]\x1b[0m ${msg}`, ...rest),
    warn: (msg: string, ...rest: any[]) =>
        console.warn(`\x1b[33m[API WARN]\x1b[0m ${msg}`, ...rest),
    error: (msg: string, ...rest: any[]) =>
        console.error(`\x1b[31m[API ERR]\x1b[0m ${msg}`, ...rest),
};

/** Generic fetch helper with logging + sane error bubbling */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${BASE}${path}`;
    const start = Date.now();

    // Log START
    log.info(`→ ${init.method || "GET"} ${url}`);

    // If body is JSON, log it
    if (init.body && !(init.body instanceof FormData)) {
        try {
            const parsed = JSON.parse(init.body as string);
            log.info(`📦 Payload:`, parsed);
        } catch {
            log.info(`📦 Raw body:`, init.body);
        }
    } else if (init.body instanceof FormData) {
        log.info(`📦 Payload: FormData`);
    }

    // ❗ FIX: do NOT override content-type for FormData
    const isForm = init.body instanceof FormData;

    const res = await fetch(url, {
        ...init,
        headers: isForm
            ? { ...(init.headers || {}) }
            : {
                "Content-Type": "application/json",
                ...(init.headers || {}),
            },
    });

    const time = Date.now() - start;

    let raw = "";
    let data: any = null;

    try {
        raw = await res.text();
        data = raw ? JSON.parse(raw) : null;
    } catch {
        log.warn("⚠️ Response is not JSON-parsable");
    }

    if (!res.ok) {
        const msg = data?.error || data?.message || raw || `HTTP ${res.status}`;
        const err = new Error(msg) as Error & { status?: number };
        err.status = res.status;

        log.error(`← ${res.status} ${url} (${time} ms):`, data || raw);
        throw err;
    }

    log.success(`← ${res.status} ${url} (${time} ms)`);
    log.info("✅ Response:", data);

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
   WEEKLY PLAN (FETCH EXISTING)
   ======================= */

/**
 * Fetch user's stored weekly plan from /getWeekly.
 *
 * Backend:
 *  - 404 + "No weekly plan..."  → NO PLAN YET (return null)
 *  - 200 + { name, userId, weeklyPlan: { plan, totals, ... } } → plan exists
 */
export async function getWeeklyPlan(
    token: string
): Promise<GetWeeklyPlanApiResponse | null> {
    log.info(`🟧 Fetching weekly plan with token`);

    try {
        const result = await request<GetWeeklyPlanApiResponse>("/getWeekly", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        return result;
    } catch (err: any) {
        const status = err?.status;
        const msg = err?.message || "";

        if (status === 404 && msg === "No weekly plan available for this user") {
            log.info(
                "ℹ️ No weekly plan available for this user yet. Returning null (empty state)."
            );
            return null;
        }

        log.error("❌ Error fetching weekly plan:", err);
        throw err;
    }
}

/* =======================
   RECOMMEND (first-time)
   ======================= */

/**
 * /recommend-meals
 * → { success, message, method, aiReasoning, weekPlan }
 */
export async function recommendWeeklyMeals(
    token: string
): Promise<WeeklyMealPlanApiResponse> {
    log.info(`🟨 Generating meal recommendations (GET /recommend-meals)`);

    try {
        return await request<WeeklyMealPlanApiResponse>("/recommend-meals", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (err: any) {
        const status = err?.status;
        const msg = err?.message || "";

        if (status === 404 && msg.startsWith("HTTP 404")) {
            log.error(
                "⚠️ /recommend-meals endpoint not found. Check backend routing (/api/users/recommend-meals)."
            );
            throw new Error(
                "Recommendations service is not available right now. Please try again later."
            );
        }

        throw err;
    }
}


export type SingleMealOrderResponse = {
    success: boolean;
    message: string;
    order: {
        orderID: string;
        orderType: string;
        meal: any;
        totalAmount: number;
        status: string;
        scheduledFor: string;
        deliveryAddress: any;
        adminId: string;
        userLocation: any;
        adminLocation: any;
    };
};

/**
 * Create a single-meal order for a given mealId.
 * Optionally pass scheduledFor / addressIndex if you want later.
 */
export async function createSingleMealOrder(
    token: string,
    mealId: string,
    opts: { scheduledFor?: Date | string; addressIndex?: number } = {}
): Promise<SingleMealOrderResponse> {
    const payload: any = { mealId };

    if (opts.scheduledFor) payload.scheduledFor = opts.scheduledFor;
    if (typeof opts.addressIndex === "number") {
        payload.addressIndex = opts.addressIndex;
    }

    return request<SingleMealOrderResponse>("/order", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
}
