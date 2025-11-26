// types/meal.ts

/* ================================
 * Backend / API response types
 * ================================ */

export type DayKey =
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday"
    | string;

export type SectionName = string;

export type BackendMealImage = {
    url: string;
    publicId?: string;
    originalName?: string;
    uploadedAt?: string;
    [k: string]: any;
};

export type BackendMeal = {
    _id: string;
    name: string;

    calories: number;
    protein: number;
    carbs: number;
    fat: number;

    description?: string;
    image?: BackendMealImage;

    category?: string;
    dietType?: string;
    spiceLevel?: string;
    cuisineType?: string;
    prepTime?: number;
    servingSize?: number;

    [k: string]: any;
};

/**
 * Shape of the `weekPlan` object in the API response:
 *
 * {
 *   Monday:   { "Meal 1": BackendMeal, "Meal 2": BackendMeal, ... },
 *   Tuesday:  { ... },
 *   ...
 * }
 */
export type BackendWeekPlan = Record<DayKey, Record<SectionName, BackendMeal>>;

export type WeeklyMealPlanApiResponse = {
    success: boolean;
    message: string;
    method: string;
    aiReasoning?: string;
    weekPlan: BackendWeekPlan;
    [k: string]: any;
};


/* ================================
 * UI-normalized types
 * ================================ */

export type Macro = {
    protein: number;
    carbs: number;
    fat: number;
};

export type Meal = {
    /** Backend `_id` */
    id: string;

    /** Backend `name` mapped to UI title */
    title: string;

    /** Direct URL for rendering */
    image?: string;

    macros: Macro;
    calories: number;
    description?: string;

    /** Optional context for UI */
    day?: DayKey;
    section?: SectionName;

    /** Full raw backend object if needed */
    raw?: BackendMeal;

    [k: string]: any;
};

/**
 * Normalized weekly plan for UI:
 * plan[day][section] = Meal[]
 */
export type WeeklyPlan = {
    plan: Record<DayKey, Record<SectionName, Meal[]>>;
    [k: string]: any;
};

/**
 * Wrapper if you store a named plan per user.
 * (Optional – keep or extend as you need.)
 */
export type WeeklyPlanResponse = {
    userId?: string;
    name?: string;
    weeklyPlan: WeeklyPlan;
    [k: string]: any;
};
