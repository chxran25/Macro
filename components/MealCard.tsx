// components/MealCard.tsx
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { Meal } from "../types/meal";

type Props = {
    meal: Meal;
    onPress?: (meal: Meal) => void;
};

const MealCard: React.FC<Props> = ({ meal, onPress }) => {
    const { title, image, calories, macros, raw } = meal;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress?.(meal)}
            className="flex-row items-stretch rounded-2xl bg-zinc-900 mb-4 overflow-hidden"
        >
            {image ? (
                <Image
                    source={{ uri: image }}
                    className="w-24 h-24"
                    resizeMode="cover"
                />
            ) : (
                <View className="w-24 h-24 bg-zinc-800 items-center justify-center">
                    <Text className="text-xs text-zinc-400 text-center px-2">
                        No Image
                    </Text>
                </View>
            )}

            <View className="flex-1 p-3 justify-center">
                <Text
                    className="text-white text-base font-semibold"
                    numberOfLines={1}
                >
                    {title}
                </Text>

                <Text className="text-zinc-400 text-xs mt-1">
                    {calories} kcal • P {macros.protein}g • C {macros.carbs}g • F {macros.fat}g
                </Text>

                <View className="flex-row mt-2 space-x-2">
                    {raw?.dietType && (
                        <View className="px-2 py-1 rounded-full bg-zinc-800">
                            <Text className="text-[10px] text-zinc-200">
                                {raw.dietType}
                            </Text>
                        </View>
                    )}
                    {raw?.spiceLevel && (
                        <View className="px-2 py-1 rounded-full bg-zinc-800">
                            <Text className="text-[10px] text-zinc-200">
                                {raw.spiceLevel}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default MealCard;
