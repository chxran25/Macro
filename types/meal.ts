// types/meal.ts

/** ---------- Basic Macros ---------- */
export type Macro = {
    protein: number;
    carbs: number;
    fat: number;
};

/** ---------- Single Meal (UI-normalized) ---------- */
export type Meal = {
    id: string;
    title: string; // normalized from backend "name" / "title"
    image: string;
    macros: Macro;
    calories: number;
    description?: string;
    [k: string]: any; // tolerate server extras
};

/** ---------- Weekly Plan (UI-normalized) ---------- */
export type DayKey = string;      // e.g., "Monday"
export type SectionName = string; // e.g., "Meal 1", "Breakfast"

export type WeeklyPlan = {
    // plan[day][section] = Meal[]
    plan: Record<DayKey, Record<SectionName, Meal[]>>;
    [k: string]: any;
};

/* ============================================================
 * BACKEND SHAPES
 * ============================================================ */

/** Single meal document from backend */
export type BackendMeal = {
    _id?: string;
    id?: string;
    name?: string;
    title?: string;
    image?: any;
    img?: any;

    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    description?: string;

    macros?: {
        protein?: number;
        carbs?: number;
        fat?: number;
        [k: string]: any;
    };

    [k: string]: any;
};

/**
 * A section value from backend can be:
 *  - a single BackendMeal
 *  - an array of BackendMeal
 *  - an object map of id -> BackendMeal
 */
export type BackendSectionValue =
    | BackendMeal
    | BackendMeal[]
    | Record<string, BackendMeal>;

/** Day plan from backend:  { "Meal 1": <sectionValue>, ... } */
export type BackendDayPlan = Record<SectionName, BackendSectionValue>;

/** Week plan from backend: { "Monday": <dayPlan>, ... } */
export type BackendWeekPlan = Record<DayKey, BackendDayPlan>;

/**
 * Response shape from /recommend-meals
 * (the one that has success + weekPlan at top level)
 */
export type WeeklyMealPlanApiResponse = {
    success: boolean;
    message: string;
    method?: string;
    aiReasoning?: string;
    weekPlan: BackendWeekPlan;
    [k: string]: any;
};

/**
 * Response shape from /getWeekly
 * (the one you logged in Metro)
 *
 * {
 *   name: string;
 *   userId: string;
 *   weeklyPlan: {
 *     generatedAt: string;
 *     plan: BackendWeekPlan;
 *     totals?: any;
 *     weeklyTarget?: any;
 *   }
 * }
 */
export type GetWeeklyPlanApiResponse = {
    name?: string;
    userId?: string;
    weeklyPlan?: {
        generatedAt?: string;
        plan?: BackendWeekPlan;
        totals?: any;
        weeklyTarget?: any;
        [k: string]: any;
    } | null;
    [k: string]: any;
};
