// utils/mealPlanMapper.ts
import {
    BackendMeal,
    BackendWeekPlan,
    DayKey,
    Meal,
    SectionName,
    WeeklyPlan,
} from "../types/meal";

/**
 * Map a single BackendMeal -> UI Meal
 */
export const mapBackendMealToMeal = (
    backendMeal: BackendMeal,
    day?: DayKey,
    section?: SectionName
): Meal => {
    return {
        id: String(backendMeal._id ?? backendMeal.id ?? ""),

        title: backendMeal.name ?? backendMeal.title ?? "Meal",

        image: backendMeal.image?.url ?? "",

        macros: {
            protein: backendMeal.protein ?? backendMeal.macros?.protein ?? 0,
            carbs: backendMeal.carbs ?? backendMeal.macros?.carbs ?? 0,
            fat: backendMeal.fat ?? backendMeal.macros?.fat ?? 0,
        },

        calories: backendMeal.calories ?? 0,
        description: backendMeal.description ?? "",

        day,
        section,

        // 🔥 Keep full backend object so Home screen can use
        // mealTiming, category, tags, etc. via meal.raw
        raw: backendMeal,
    };
};

/**
 * Map backend weeklyPlan (with .plan inside it) → UI WeeklyPlan
 */
export const mapBackendWeekPlanToWeeklyPlan = (
    backendWeekly: { plan?: BackendWeekPlan }
): WeeklyPlan => {
    const result: WeeklyPlan = {
        plan: {},
    };

    if (!backendWeekly || !backendWeekly.plan) return result;

    const backendPlan = backendWeekly.plan;

    Object.entries(backendPlan).forEach(([dayKey, sections]) => {
        const day = dayKey as DayKey;

        if (!sections || typeof sections !== "object") return;

        const sectionMap: Record<SectionName, Meal[]> = {};

        Object.entries(sections).forEach(([sectionName, value]) => {
            const section = sectionName as SectionName;

            const mealsArray = Array.isArray(value)
                ? value
                : value && typeof value === "object"
                    ? [value]
                    : [];

            sectionMap[section] = mealsArray.map((m) =>
                mapBackendMealToMeal(m, day, section)
            );
        });

        result.plan[day] = sectionMap;
    });

    return result;
};
