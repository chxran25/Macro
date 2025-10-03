import { Meal } from "../types/meal";

export const recipesByMeal: Record<string, Meal[]> = {
    Breakfast: [
        {
            id: "b1",
            title: "Scrambled Eggs with Spinach",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=640",
            macros: { protein: 25, carbs: 10, fat: 20 },
            calories: 350,
            // description is optional; can omit here
        },
    ],
    Lunch: [
        {
            id: "l1",
            title: "Grilled Chicken Salad",
            image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=640",
            macros: { protein: 35, carbs: 15, fat: 15 },
            calories: 450,
        },
    ],
    Dinner: [
        {
            id: "d1",
            title: "Salmon with Roasted Vegetables",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640",
            macros: { protein: 40, carbs: 20, fat: 30 },
            calories: 500,
        },
    ],
};

export const recommended: Meal[] = [
    {
        id: "r1",
        title: "Vegan Lentil Soup",
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=640",
        macros: { protein: 14, carbs: 30, fat: 5 },
        calories: 280,
        description: "Hearty and nutritious soup with lentils and vegetables. Vegan, Gluten‑Free.",
    },
    {
        id: "r2",
        title: "Quinoa Bowl with Avocado",
        image: "https://images.unsplash.com/photo-1543332164-6e82f355bad8?w=640",
        macros: { protein: 12, carbs: 45, fat: 10 },
        calories: 320,
        description: "Balanced bowl with quinoa, avocado, and mixed greens. Gluten‑Free.",
    },
];
