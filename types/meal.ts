/** ---------- Basic Macros ---------- */
export type Macro = {
    protein: number;
    carbs: number;
    fat: number;
};

/** ---------- Single Meal (UI-normalized) ---------- */
export type Meal = {
    id: string;
    title: string;                 // server may send "name" → normalize in UI if needed
    image: string;
    macros: Macro;                 // server may send protein/carbs/fat → normalize in UI if needed
    calories: number;
    description?: string;
    [k: string]: any;              // tolerate server extras
};

/** ---------- Weekly Plan ---------- */
export type DayKey = string;      // e.g., "Monday", "Mon", etc.
export type SectionName = string; // e.g., "Breakfast", "Meal 1", etc.

/**
 * Be liberal in what we accept:
 * weeklyPlan.plan[day][section] can be:
 *  - Meal[]
 *  - Record<string, Meal>  (e.g., { "Meal 1": {...}, "Meal 2": {...} })
 *  - Meal                  (single object)
 */
export type WeeklyPlan = {
    plan: Record<DayKey, Record<SectionName, Meal[] | Record<string, Meal> | Meal>>;
    [k: string]: any;
};

export type WeeklyPlanResponse = {
    userId: string;
    name: string;
    weeklyPlan: WeeklyPlan;
};
