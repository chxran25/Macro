// types/meal.ts

/** ---------- Basic Macros ---------- */
export type Macro = {
    protein: number;
    carbs: number;
    fat: number;
};

/** ---------- Single Meal ---------- */
export type Meal = {
    id: string;
    title: string;
    image: string;
    macros: Macro;
    calories: number;
    description?: string;
    // tolerate backend extras without breaking the app
    [k: string]: any;
};

/** ---------- Weekly Plan ---------- */
/**
 * We keep day/section names flexible so backend can send
 * "Mon"/"Monday" etc. without forcing a strict enum.
 */
export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun" | string;
export type SectionName = "Breakfast" | "Lunch" | "Snacks" | "Dinner" | string;

/** weeklyPlan.plan[day][section] = Meal[] */
export type WeeklyPlan = {
    plan: Record<DayKey, Record<SectionName, Meal[]>>;
    // optional meta
    [k: string]: any;
};

export type WeeklyPlanResponse = {
    userId: string;
    name: string;
    weeklyPlan: WeeklyPlan;
};
