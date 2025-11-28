import React, { useState } from "react";
import {
    Alert,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { Meal } from "../types/meal";
import { getAccessToken } from "../utils/secureStore";
import { createSingleMealOrder } from "../lib/api";

type Props = {
    meal: Meal;
    onPress?: (meal: Meal) => void;
    /** Called when this meal is successfully added to cart */
    onAddedToCart?: (meal: Meal) => void;
};

const MealCard: React.FC<Props> = ({ meal, onPress, onAddedToCart }) => {
    const { id, title, image, calories, macros } = meal;
    const [ordering, setOrdering] = useState(false);

    const imgUri =
        typeof image === "string" && image.length > 0 ? image : undefined;

    const handleOrderPress = async () => {
        if (ordering) return;

        try {
            setOrdering(true);

            const token = await getAccessToken();
            if (!token) {
                Alert.alert(
                    "Login required",
                    "Please login to add this meal to your cart."
                );
                return;
            }

            await createSingleMealOrder(token, id);

            // 🔔 notify parent so it can show the floating bubble
            onAddedToCart?.(meal);
        } catch (err: any) {
            Alert.alert(
                "Action failed",
                err?.message || "Could not add this meal. Please try again."
            );
        } finally {
            setOrdering(false);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress?.(meal)}
            className="flex-row items-center justify-between rounded-2xl bg-neutral-900 mb-4 px-4 py-3"
        >
            {/* LEFT: Text block */}
            <View className="flex-1 pr-3">
                {!!calories && (
                    <Text className="text-xs text-neutral-400 mb-1">
                        {calories} cal
                    </Text>
                )}

                <Text
                    className="text-white text-[15px] font-semibold leading-snug"
                    numberOfLines={2}
                >
                    {title}
                </Text>

                <Text className="text-[12px] text-neutral-400 mt-2">
                    Protein: {macros.protein}g | Carbs: {macros.carbs}g | Fat:{" "}
                    {macros.fat}g
                </Text>

                {/* Add to cart button */}
                <TouchableOpacity
                    onPress={handleOrderPress}
                    activeOpacity={0.85}
                    className="mt-3 self-start px-3 py-1.5 rounded-full bg-white"
                    disabled={ordering}
                >
                    <Text className="text-black text-[12px] font-semibold">
                        {ordering ? "Adding…" : "Add to cart"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* RIGHT: Image */}
            {imgUri ? (
                <Image
                    source={{ uri: imgUri }}
                    className="w-24 h-24 rounded-2xl"
                    resizeMode="cover"
                />
            ) : (
                <View className="w-24 h-24 rounded-2xl bg-neutral-800 items-center justify-center">
                    <Text className="text-[11px] text-neutral-500 text-center px-2">
                        No Image
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default MealCard;
