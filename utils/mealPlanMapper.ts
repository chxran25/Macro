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
 * Map a single BackendMeal → UI Meal
 */
export const mapBackendMealToMeal = (
    backendMeal: BackendMeal,
    day?: DayKey,
    section?: SectionName
): Meal => {
    return {
        id: backendMeal._id,
        title: backendMeal.name,
        image: backendMeal.image?.url,

        macros: {
            protein: backendMeal.protein ?? 0,
            carbs: backendMeal.carbs ?? 0,
            fat: backendMeal.fat ?? 0,
        },

        calories: backendMeal.calories ?? 0,
        description: backendMeal.description,

        day,
        section,

        // keep full raw object in case UI needs more fields later
        raw: backendMeal,
    };
};

/**
 * Map BackendWeekPlan (API `weekPlan`) → UI-normalized WeeklyPlan
 *
 * Result shape:
 *  weekly.plan[day][section] = Meal[]
 */
export const mapBackendWeekPlanToWeeklyPlan = (
    backendWeekPlan: BackendWeekPlan
): WeeklyPlan => {
    const plan: WeeklyPlan["plan"] = {};

    Object.entries(backendWeekPlan).forEach(([dayKey, sections]) => {
        const day = dayKey as DayKey;
        plan[day] = plan[day] || {};

        Object.entries(sections).forEach(([sectionKey, backendMeal]) => {
            const section = sectionKey as SectionName;

            // For now, backend sends exactly one meal per section
            const meal = mapBackendMealToMeal(backendMeal, day, section);

            // Store as array to keep UI API consistent and future-proof
            if (!plan[day][section]) {
                plan[day][section] = [meal];
            } else {
                plan[day][section].push(meal);
            }
        });
    });

    return { plan };
};
