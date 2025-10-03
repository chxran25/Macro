export type Meal = {
    id: string;
    title: string;
    image: string;
    macros: { protein: number; carbs: number; fat: number };
    calories: number;
    description?: string;
};
