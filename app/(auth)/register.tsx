// app/(auth)/register.tsx
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { mealFrequencyToNumber } from "../../types/user";


/* ----------------------------- Reusable Card ----------------------------- */
const Card = ({ children }: { children: React.ReactNode }) => (
    <View
        className="rounded-3xl p-6 border border-white/10 bg-white/5 mb-6 w-full"
        style={{
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
        }}
    >
        {children}
    </View>
);

/* ------------------------------- Step One -------------------------------- */
type StepOneProps = {
    name: string;
    setName: (v: string) => void;
    nameValid: boolean;

    phoneNumber: string;
    setPhoneNumber: (v: string) => void;
    phoneValid: boolean;
};

function StepOne({
                     name,
                     setName,
                     nameValid,
                     phoneNumber,
                     setPhoneNumber,
                     phoneValid,
                 }: StepOneProps) {
    return (
        <Card>
            <Text allowFontScaling={false} className="text-white text-2xl font-extrabold mb-6">
                Create Account
            </Text>

            <View className="space-y-4 w-full">
                <View className="w-full">
                    <Text className="text-neutral-300 mb-2 text-xs font-medium tracking-wide">
                        FULL NAME
                    </Text>
                    <TextInput
                        placeholder="John Doe"
                        placeholderTextColor="#6B7280"
                        className="w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                    {!nameValid && name.length > 0 && (
                        <Text className="text-red-400 mt-2 text-xs">Please enter your full name.</Text>
                    )}
                </View>

                <View className="w-full mt-4">
                    <Text className="text-neutral-300 mb-2 text-xs font-medium tracking-wide">
                        PHONE NUMBER
                    </Text>
                    <View className="w-full bg-neutral-900/80 rounded-2xl px-3 py-3 border border-white/5">
                        <View className="flex-row items-center w-full" style={{ flexShrink: 1 }}>
                            <View className="flex-row items-center bg-emerald-500/10 rounded-xl px-3 py-2 mr-3 border border-emerald-500/20">
                                <Text className="text-xl">🇮🇳</Text>
                                <Text className="text-white ml-2 font-bold text-sm">+91</Text>
                            </View>
                            <TextInput
                                placeholder="XXXXXXXXXX"
                                placeholderTextColor="#6B7280"
                                keyboardType="phone-pad"
                                className="flex-1 text-white text-base font-medium"
                                value={phoneNumber}
                                onChangeText={(t) => {
                                    if (t === "") {
                                        setPhoneNumber("");
                                        return;
                                    }
                                    const raw = t.replace(/[^\d]/g, "");
                                    let ten = raw.startsWith("91") ? raw.slice(2) : raw;
                                    ten = ten.slice(0, 10);
                                    setPhoneNumber(ten ? `+91${ten}` : "+91");
                                }}
                                maxLength={13}
                                autoCorrect={false}
                            />
                        </View>
                    </View>
                    {!phoneValid && phoneNumber.length > 0 && (
                        <Text className="text-red-400 mt-2 text-xs">
                            Format must be +91 followed by 10 digits.
                        </Text>
                    )}
                </View>
            </View>
        </Card>
    );
}

/* ------------------------------- Step Two -------------------------------- */
// Helpers
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");

// Reusable numeric stepper with editable input + up/down arrows
function NumberStepper({
                           label,
                           unit,
                           value,
                           onChangeText,
                           min,
                           max,
                           step = 1,
                           maxLength,
                       }: {
    label: string;
    unit?: string;
    value: string; // keep as string so we can allow temporary blank while typing
    onChangeText: (s: string) => void;
    min: number;
    max: number;
    step?: number;
    maxLength?: number;
}) {
    const n = Number.isFinite(Number(value)) && value !== "" ? Number(value) : NaN;

    const inc = () => onChangeText(String(clamp(isNaN(n) ? min : n + step, min, max)));
    const dec = () => onChangeText(String(clamp(isNaN(n) ? min : n - step, min, max)));

    const handleBlur = () => {
        // If empty or NaN, snap to min. Otherwise clamp into range.
        const next = value.trim() === "" ? min : clamp(Number(value), min, max);
        onChangeText(String(next));
    };

    return (
        <View className="w-full mb-4">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-neutral-300 text-xs font-medium tracking-wide">
                    {label.toUpperCase()}
                </Text>
                {!!unit && <Text className="text-emerald-400 text-[10px] font-semibold">{unit}</Text>}
            </View>

            <View className="flex-row items-stretch bg-neutral-900/80 rounded-2xl border border-white/5 overflow-hidden">
                {/* Editable numeric input */}
                <View className="flex-1 px-4 py-3 justify-center">
                    <TextInput
                        placeholder={`${min}`}
                        placeholderTextColor="#6B7280"
                        value={value}
                        onChangeText={(t) => {
                            // Allow empty to let user retype, otherwise keep digits only
                            const cleaned = t === "" ? "" : onlyDigits(t);
                            onChangeText(cleaned);
                        }}
                        onBlur={handleBlur}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={maxLength}
                        className="text-white text-base font-semibold"
                    />
                </View>

                {/* Up/Down control */}
                <View className="w-12 border-l border-white/10">
                    <TouchableOpacity
                        accessibilityLabel={`Increase ${label}`}
                        onPress={inc}
                        className="flex-1 items-center justify-center bg-white/5 active:bg-white/10"
                        style={{ paddingVertical: 8 }}
                    >
                        <Text className="text-white text-base">▲</Text>
                    </TouchableOpacity>
                    <View className="h-px bg-white/10" />
                    <TouchableOpacity
                        accessibilityLabel={`Decrease ${label}`}
                        onPress={dec}
                        className="flex-1 items-center justify-center bg-white/5 active:bg-white/10"
                        style={{ paddingVertical: 8 }}
                    >
                        <Text className="text-white text-base">▼</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

type StepTwoProps = {
    gender: "Man" | "Woman";
    setGender: React.Dispatch<React.SetStateAction<"Man" | "Woman">>;
    age: string;
    setAge: (v: string) => void;
    height: string;
    setHeight: (v: string) => void;
    weight: string;
    setWeight: (v: string) => void;
    fitnessGoal: string;
    setFitnessGoal: (v: string) => void;
};


function StepTwo({
                     gender,
                     setGender,
                     age,
                     setAge,
                     height,
                     setHeight,
                     weight,
                     setWeight,
                     fitnessGoal,
                     setFitnessGoal,
                 }: StepTwoProps) {
    return (
        <Card>
            <Text allowFontScaling={false} className="text-white text-2xl font-extrabold mb-6">
                Personal Details
            </Text>

            {/* Gender dropdown */}
            <View className="w-full mb-4">
                <Text className="text-neutral-300 mb-2 text-xs font-medium tracking-wide">GENDER</Text>
                <View className="bg-neutral-900/80 rounded-2xl border border-white/5 overflow-hidden">
                    <Picker
                        selectedValue={gender || "Man"}
                        onValueChange={(val) => setGender(val)}
                        dropdownIconColor="#fff"
                        style={{ color: "#fff" }}
                    >
                        <Picker.Item label="Man" value="Man" />
                        <Picker.Item label="Woman" value="Woman" />
                    </Picker>
                </View>
            </View>

            {/* Age stepper (years) — range 10..100 */}
            <NumberStepper
                label="Age"
                unit="years"
                value={age}
                onChangeText={setAge}
                min={10}
                max={100}
                step={1}
                maxLength={3}
            />

            {/* Height stepper (cm) — range 100..240 */}
            <NumberStepper
                label="Height"
                unit="cm"
                value={height}
                onChangeText={setHeight}
                min={100}
                max={240}
                step={1}
                maxLength={3}
            />

            {/* Weight stepper (kg) — range 20..300 */}
            <NumberStepper
                label="Weight"
                unit="kg"
                value={weight}
                onChangeText={setWeight}
                min={20}
                max={300}
                step={1}
                maxLength={3}
            />

            {/* Fitness goal chips (unchanged) */}
            <View className="mt-2 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    FITNESS GOAL
                </Text>
                <View className="flex-row flex-wrap">
                    {["Maintain", "Lose Fat", "Build Muscle"].map((goal) => (
                        <TouchableOpacity
                            key={goal}
                            onPress={() => setFitnessGoal(goal)}
                            className={`px-5 py-3 mr-2 mb-2 rounded-2xl border-2 ${
                                fitnessGoal === goal
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text
                                className={`font-semibold text-sm ${
                                    fitnessGoal === goal ? "text-black" : "text-white"
                                }`}
                            >
                                {goal}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Card>
    );
}

/* ------------------------------ NEW Step Three --------------------------- */
type StepAddressProps = {
    flatNo: string;
    setFlatNo: (v: string) => void;
    block: string;
    setBlock: (v: string) => void;
    apartment: string;
    setApartment: (v: string) => void;
    addressValid: boolean;

    onPickLocation: () => Promise<void>;
    locLoading: boolean;
    latitude: number | null;
    longitude: number | null;
};

function StepAddress({
                         flatNo,
                         setFlatNo,
                         block,
                         setBlock,
                         apartment,
                         setApartment,
                         addressValid,
                         onPickLocation,
                         locLoading,
                         latitude,
                         longitude,
                     }: StepAddressProps) {
    return (
        <Card>
            <Text allowFontScaling={false} className="text-white text-2xl font-extrabold mb-6">
                Address
            </Text>

            <View className="w-full">
                <Text className="text-neutral-300 mb-2 text-xs font-medium tracking-wide">
                    FLAT / HOUSE NUMBER
                </Text>
                <TextInput
                    placeholder="e.g., 12B"
                    placeholderTextColor="#6B7280"
                    className="w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                    value={flatNo}
                    onChangeText={setFlatNo}
                    autoCorrect={false}
                />
            </View>

            <View className="w-full mt-4">
                <Text className="text-neutral-300 mb-2 text-xs font-medium tracking-wide">
                    BLOCK / TOWER
                </Text>
                <TextInput
                    placeholder="e.g., Block A"
                    placeholderTextColor="#6B7280"
                    className="w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                    value={block}
                    onChangeText={setBlock}
                    autoCorrect={false}
                />
            </View>

            <View className="w-full mt-4">
                <Text className="text-neutral-300 mb-2 text-xs font-medium tracking-wide">
                    APARTMENT / COMMUNITY
                </Text>
                <TextInput
                    placeholder="e.g., Ramky Pearl"
                    placeholderTextColor="#6B7280"
                    className="w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                    value={apartment}
                    onChangeText={setApartment}
                    autoCorrect={false}
                />
            </View>

            {!addressValid && (flatNo || block || apartment) && (
                <Text className="text-red-400 mt-2 text-xs">Please fill all the address fields.</Text>
            )}

            <View className="mt-5 w-full flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={onPickLocation}
                    className="px-4 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40"
                    disabled={locLoading}
                    activeOpacity={0.8}
                >
                    <Text className="text-emerald-300 font-semibold">
                        {locLoading ? "Getting location..." : "Use my location"}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row items-center">
                    {latitude != null && longitude != null ? (
                        <Text className="text-neutral-300 text-xs">
                            📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}
                        </Text>
                    ) : (
                        <Text className="text-neutral-500 text-xs">No coordinates yet</Text>
                    )}
                </View>
            </View>
        </Card>
    );
}

/* ------------------------------ Step Four -------------------------------- */
type StepThreeProps = {
    dietType: string;
    setDietType: (v: string) => void;
    spicePreference: string;
    setSpicePreference: (v: string) => void;
    dietaryRestrictions: string[];
    setDietaryRestrictions: (v: string[]) => void;
    otherAllergens: string;
    setOtherAllergens: (v: string) => void;
};

function StepThree({
                       dietType,
                       setDietType,
                       spicePreference,
                       setSpicePreference,
                       dietaryRestrictions,
                       setDietaryRestrictions,
                       otherAllergens,
                       setOtherAllergens,
                   }: StepThreeProps) {
    const toggle = (arr: string[], value: string, setter: (v: string[]) => void) => {
        if (arr.includes(value)) setter(arr.filter((x) => x !== value));
        else setter([...arr, value]);
    };

    return (
        <Card>
            <Text allowFontScaling={false} className="text-white text-2xl font-extrabold mb-6">
                Diet Preferences
            </Text>

            <View className="mb-4 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    DIET TYPE
                </Text>
                <View className="flex-row flex-wrap">
                    {["Veg", "Non-Veg", "Both"].map((dt) => (
                        <TouchableOpacity
                            key={dt}
                            onPress={() => setDietType(dt)}
                            className={`px-5 py-3 mr-2 mb-2 rounded-2xl border-2 ${
                                dietType === dt
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text
                                className={`font-semibold text-sm ${
                                    dietType === dt ? "text-black" : "text-white"
                                }`}
                            >
                                {dt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="mt-4 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    SPICE LEVEL
                </Text>
                <View className="flex-row flex-wrap">
                    {[
                        { label: "Not Spicy", emoji: "😊" },
                        { label: "Mild", emoji: "🌶️" },
                        { label: "Medium", emoji: "🌶️🌶️" },
                        { label: "Spicy", emoji: "🔥" },
                    ].map((sp) => (
                        <TouchableOpacity
                            key={sp.label}
                            onPress={() => setSpicePreference(sp.label)}
                            className={`px-4 py-3 mr-2 mb-2 rounded-2xl border-2 flex-row items-center ${
                                spicePreference === sp.label
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text className="mr-2 text-base">{sp.emoji}</Text>
                            <Text
                                className={`font-semibold text-sm ${
                                    spicePreference === sp.label ? "text-black" : "text-white"
                                }`}
                            >
                                {sp.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="mt-4 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    DIETARY RESTRICTIONS (OPTIONAL)
                </Text>
                <View className="flex-row flex-wrap">
                    {["Lactose", "Gluten", "Peanut", "Soy"].map((r) => (
                        <TouchableOpacity
                            key={r}
                            onPress={() => toggle(dietaryRestrictions, r, setDietaryRestrictions)}
                            className={`px-4 py-3 mr-2 mb-2 rounded-2xl border-2 ${
                                dietaryRestrictions.includes(r)
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text
                                className={`font-semibold text-sm ${
                                    dietaryRestrictions.includes(r) ? "text-black" : "text-white"
                                }`}
                            >
                                {r}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    placeholder="Any other allergens?"
                    placeholderTextColor="#6B7280"
                    className="mt-3 w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                    value={otherAllergens}
                    onChangeText={setOtherAllergens}
                    autoCorrect={false}
                />
            </View>
        </Card>
    );
}

/* ------------------------------ Step Five -------------------------------- */
type StepFourProps = {
    foodDislikes: string;
    setFoodDislikes: (v: string) => void;
    cuisinePreferences: string[];
    setCuisinePreferences: (v: string[]) => void;
};

function StepFour({
                      foodDislikes,
                      setFoodDislikes,
                      cuisinePreferences,
                      setCuisinePreferences,
                  }: StepFourProps) {
    const toggle = (arr: string[], value: string, setter: (v: string[]) => void) => {
        if (arr.includes(value)) setter(arr.filter((x) => x !== value));
        else setter([...arr, value]);
    };

    return (
        <Card>
            <Text allowFontScaling={false} className="text-white text-2xl font-extrabold mb-6">
                Food & Cuisine
            </Text>

            <View className="mb-4 w-full">
                <Text className="text-neutral-300 mb-2 text-xs font-medium tracking-wide">
                    FOOD DISLIKES (OPTIONAL)
                </Text>
                <TextInput
                    placeholder="e.g., mushrooms, broccoli..."
                    placeholderTextColor="#6B7280"
                    className="w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                    value={foodDislikes}
                    onChangeText={setFoodDislikes}
                    multiline
                    numberOfLines={3}
                    autoCorrect={false}
                />
            </View>

            <View className="mt-4 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    CUISINE PREFERENCES
                </Text>
                {[
                    { name: "Indian South", emoji: "🥘" },
                    { name: "Indian North", emoji: "🍛" },
                    { name: "Continental", emoji: "🍝" },
                    { name: "Asian", emoji: "🍜" },
                ].map((cuisine) => (
                    <TouchableOpacity
                        key={cuisine.name}
                        onPress={() => toggle(cuisinePreferences, cuisine.name, setCuisinePreferences)}
                        className="flex-row items-center mb-3 bg-neutral-900/50 rounded-2xl p-4 border border-white/5"
                    >
                        <View
                            className={`w-5 h-5 mr-4 rounded-lg border-2 items-center justify-center ${
                                cuisinePreferences.includes(cuisine.name)
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-transparent border-white/20"
                            }`}
                        >
                            {cuisinePreferences.includes(cuisine.name) && (
                                <Text className="text-black font-bold text-xs">✓</Text>
                            )}
                        </View>
                        <Text className="text-lg mr-3">{cuisine.emoji}</Text>
                        <Text className="text-white font-medium text-base">{cuisine.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Card>
    );
}

/* ------------------------------- Step Six -------------------------------- */
type StepFiveProps = {
    mealFrequency: string;
    setMealFrequency: (v: string) => void;
    eatingWindow: string;
    setEatingWindow: (v: string) => void;
    useMacroCalculator: boolean;
    setUseMacroCalculator: (v: boolean) => void;
    calories: string;
    setCalories: (v: string) => void;
    protein: string;
    setProtein: (v: string) => void;
    carbs: string;
    setCarbs: (v: string) => void;
    fat: string;
    setFat: (v: string) => void;
};

function StepFive({
                      mealFrequency,
                      setMealFrequency,
                      eatingWindow,
                      setEatingWindow,
                      useMacroCalculator,
                      setUseMacroCalculator,
                      calories,
                      setCalories,
                      protein,
                      setProtein,
                      carbs,
                      setCarbs,
                      fat,
                      setFat,
                  }: StepFiveProps) {
    return (
        <Card>
            <Text allowFontScaling={false} className="text-white text-2xl font-extrabold mb-6">
                Meal Planning
            </Text>

            <View className="mb-4 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    DAILY MEALS
                </Text>
                <View className="flex-row flex-wrap">
                    {["3 Meals", "4 Meals", "5 Meals", "6 Meals"].map((mf) => (
                        <TouchableOpacity
                            key={mf}
                            onPress={() => setMealFrequency(mf)}
                            className={`px-5 py-3 mr-2 mb-2 rounded-2xl border-2 ${
                                mealFrequency === mf
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text
                                className={`font-semibold text-sm ${
                                    mealFrequency === mf ? "text-black" : "text-white"
                                }`}
                            >
                                {mf}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="mt-2 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    EATING WINDOW (OPTIONAL)
                </Text>
                <TextInput
                    placeholder="e.g., 12pm – 8pm"
                    placeholderTextColor="#6B7280"
                    className="w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                    value={eatingWindow}
                    onChangeText={setEatingWindow}
                    autoCorrect={false}
                />
            </View>

            <View className="mt-5 w-full bg-neutral-900/50 rounded-2xl p-4 border border-white/5">
                <View className="flex-row items-center justify-between">
                    <View style={{ flexShrink: 1 }}>
                        <Text className="text-white font-bold text-base">Use Macro Calculator</Text>
                        <Text className="text-neutral-400 text-xs mt-1">Auto-calculate your macros</Text>
                    </View>
                    <Switch
                        value={useMacroCalculator}
                        onValueChange={setUseMacroCalculator}
                        trackColor={{ false: "#374151", true: "#10b981" }}
                        thumbColor={useMacroCalculator ? "#fff" : "#f4f4f5"}
                    />
                </View>
            </View>

            <View className="mt-5 w-full">
                <Text className="text-neutral-300 mb-3 text-xs font-medium tracking-wide">
                    DAILY TARGETS
                </Text>
                {[
                    { label: "Calories", placeholder: "e.g., 2000", state: calories, set: setCalories, unit: "kcal" },
                    { label: "Protein", placeholder: "e.g., 150", state: protein, set: setProtein, unit: "g" },
                    { label: "Carbs", placeholder: "e.g., 250", state: carbs, set: setCarbs, unit: "g" },
                    { label: "Fat", placeholder: "e.g., 70", state: fat, set: setFat, unit: "g" },
                ].map((field, idx) => (
                    <View key={idx} className="w-full mb-3">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-neutral-300 text-xs font-medium tracking-wide">
                                {field.label.toUpperCase()}
                            </Text>
                            <Text className="text-emerald-400 text-[10px] font-semibold">{field.unit}</Text>
                        </View>
                        <TextInput
                            placeholder={field.placeholder}
                            placeholderTextColor="#6B7280"
                            keyboardType="numeric"
                            className="w-full bg-neutral-900/80 rounded-2xl px-4 py-4 text-white text-base border border-white/5"
                            value={field.state}
                            onChangeText={field.set}
                            autoCorrect={false}
                        />
                    </View>
                ))}
            </View>
        </Card>
    );
}

/* =============================== Main Page =============================== */

export default function Register() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // ========= FORM STATE =========
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState(""); // +91XXXXXXXXXX

    // Personal (set gender default to a valid value)
    const [gender, setGender] = useState<"Man" | "Woman">("Man");
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [fitnessGoal, setFitnessGoal] = useState("");

    // Address (split fields)
    const [flatNo, setFlatNo] = useState("");
    const [block, setBlock] = useState("");
    const [apartment, setApartment] = useState("");

    // Diet prefs
    const [dietType, setDietType] = useState("");
    const [spicePreference, setSpicePreference] = useState("");
    const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
    const [otherAllergens, setOtherAllergens] = useState("");

    // Food & Cuisine
    const [foodDislikes, setFoodDislikes] = useState("");
    const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);

    // Meal planning
    const [mealFrequency, setMealFrequency] = useState("");
    const [eatingWindow, setEatingWindow] = useState("");
    const [useMacroCalculator, setUseMacroCalculator] = useState(false);
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [carbs, setCarbs] = useState("");
    const [fat, setFat] = useState("");

    // ========= LOCATION =========
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [locLoading, setLocLoading] = useState(false);

    const onPickLocation = async () => {
        try {
            setLocLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission needed",
                    "Location permission is required to auto-fill your coordinates."
                );
                return;
            }

            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setLatitude(pos.coords.latitude);
            setLongitude(pos.coords.longitude);
            Alert.alert(
                "Location captured",
                `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`
            );
        } catch (e: any) {
            Alert.alert("Location Error", e?.message ?? "Could not get your location.");
        } finally {
            setLocLoading(false);
        }
    };

    // ========= VALIDATION =========
    const nameValid = useMemo(() => name.trim().length >= 2, [name]);
    const phoneValid = useMemo(() => /^(\+91\d{10})$/.test(phoneNumber.trim()), [phoneNumber]);
    const addressValid = useMemo(() => {
        return flatNo.trim().length > 0 && block.trim().length > 0 && apartment.trim().length > 0;
    }, [flatNo, block, apartment]);

    // ---- required fields check (matches backend error list) ----
    const requiredCheck = () => {
        const missing: string[] = [];
        if (!name.trim()) missing.push("name");
        if (!/^\+91\d{10}$/.test(phoneNumber.trim())) missing.push("phoneNumber");
        if (!(flatNo.trim() && block.trim() && apartment.trim())) missing.push("addresses");
        if (!gender) missing.push("gender");
        if (!fitnessGoal) missing.push("fitnessGoal");
        if (!dietType) missing.push("dietType");
        if (!spicePreference) missing.push("spicePreference");
        if (!cuisinePreferences.length) missing.push("cuisinePreferences");
        const mfNum = mealFrequencyToNumber(mealFrequency);
        if (!Number.isFinite(mfNum) || mfNum <= 0) missing.push("mealFrequency");
        const n = (s: string) => Number.isFinite(Number(s)) && Number(s) > 0;
        if (!n(calories)) missing.push("calories");
        if (!n(protein)) missing.push("protein");
        if (!n(carbs)) missing.push("carbs");
        if (!n(fat)) missing.push("fat");
        return missing;
    };

    const canSubmit = requiredCheck().length === 0 && !submitting;

    // ========= API SUBMIT =========
    const onSubmit = async () => {
        try {
            const missing = requiredCheck();
            if (missing.length) {
                Alert.alert("Missing required", `Please fill: ${missing.join(", ")}`);
                return;
            }

            setSubmitting(true);

            const prettyAddress = `${flatNo.trim()}, ${block.trim()}, ${apartment.trim()}`;

            const payload: any = {
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),

                // ⬇️ addresses must be objects
                addresses: [
                    {
                        flatNo: flatNo.trim(),
                        block: block.trim(),
                        apartment: apartment.trim(),
                    },
                ],


                // ⬇️ server expects "Man" | "Woman" (keep your UI value)
                gender, // no mapping to "male"/"female"

                fitnessGoal,
                dietType,
                spicePreference,
                cuisinePreferences,

                // ⬇️ number, not "3 Meals"
                mealFrequency: mealFrequencyToNumber(mealFrequency),

                useMacroCalculator,
                calories: Number(calories),
                protein: Number(protein),
                carbs: Number(carbs),
                fat: Number(fat),

                // optional
                age: age ? Number(age) : undefined,
                height: height ? Number(height) : undefined,
                weight: weight ? Number(weight) : undefined,
                dietaryRestrictions: dietaryRestrictions.length ? dietaryRestrictions : undefined,
                otherAllergens: otherAllergens?.trim() || undefined,
                foodDislikes: foodDislikes?.trim() || undefined,
                eatingWindow: eatingWindow?.trim() || undefined,
                ...(latitude != null && longitude != null
                    ? { location: { latitude, longitude } }
                    : {}),
            };


            // debug exactly what is being sent
            console.log("SIGNUP payload >", payload);

            const res = await fetch("https://calorieboy.onrender.com/api/users/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const text = await res.text();
            let data: any = {};
            try {
                data = JSON.parse(text);
            } catch {
                data = { raw: text };
            }

            if (!res.ok) {
                console.log("SIGNUP error >", res.status, data);
                throw new Error(data?.error || `Signup failed (${res.status})`);
            }

            Alert.alert("OTP Sent", "Please verify your phone number.");
            router.push({
                pathname: "/verify-otp",
                params: { phone: phoneNumber.trim(), from: "register" },
            });
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    const steps = [
        <StepOne
            key="s1"
            name={name}
            setName={setName}
            nameValid={nameValid}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            phoneValid={phoneValid}
        />,
        <StepTwo
            key="s2"
            gender={gender}
            setGender={setGender}
            age={age}
            setAge={setAge}
            height={height}
            setHeight={setHeight}
            weight={weight}
            setWeight={setWeight}
            fitnessGoal={fitnessGoal}
            setFitnessGoal={setFitnessGoal}
        />,
        <StepAddress
            key="sAddr"
            flatNo={flatNo}
            setFlatNo={setFlatNo}
            block={block}
            setBlock={setBlock}
            apartment={apartment}
            setApartment={setApartment}
            addressValid={addressValid}
            onPickLocation={onPickLocation}
            locLoading={locLoading}
            latitude={latitude}
            longitude={longitude}
        />,
        <StepThree
            key="s3"
            dietType={dietType}
            setDietType={setDietType}
            spicePreference={spicePreference}
            setSpicePreference={setSpicePreference}
            dietaryRestrictions={dietaryRestrictions}
            setDietaryRestrictions={setDietaryRestrictions}
            otherAllergens={otherAllergens}
            setOtherAllergens={setOtherAllergens}
        />,
        <StepFour
            key="s4"
            foodDislikes={foodDislikes}
            setFoodDislikes={setFoodDislikes}
            cuisinePreferences={cuisinePreferences}
            setCuisinePreferences={setCuisinePreferences}
        />,
        <StepFive
            key="s5"
            mealFrequency={mealFrequency}
            setMealFrequency={setMealFrequency}
            eatingWindow={eatingWindow}
            setEatingWindow={setEatingWindow}
            useMacroCalculator={useMacroCalculator}
            setUseMacroCalculator={setUseMacroCalculator}
            calories={calories}
            setCalories={setCalories}
            protein={protein}
            setProtein={setProtein}
            carbs={carbs}
            setCarbs={setCarbs}
            fat={fat}
            setFat={setFat}
        />,
    ] as const;

    return (
        <SafeAreaView
            edges={["top", "bottom"]}
            className="flex-1 bg-black"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <StatusBar barStyle="light-content" />

            {/* Decorative background blobs (kept subtle) */}
            <View pointerEvents="none">
                <View
                    className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-500/10"
                    style={{ top: -60, right: -60 }}
                />
                <View
                    className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-emerald-500/5"
                    style={{ bottom: -80, left: -80 }}
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Hero */}
                    <View className="items-center mb-8 px-2 w-full">
                        <View className="mb-3 items-center w-full">
                            <Text
                                allowFontScaling={false}
                                className="text-white text-4xl font-extrabold tracking-tight text-center w-full"
                            >
                                CalorieBoy
                            </Text>
                            <View className="h-1 bg-emerald-400 rounded-full mt-3 w-20" />
                        </View>

                        <Text
                            allowFontScaling={false}
                            className="text-white text-xl font-bold mb-4 text-center"
                        >
                            Sign Up
                        </Text>

                        {/* Progress (horizontal scroll to avoid overflow) */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ alignItems: "center", paddingHorizontal: 6 }}
                            className="w-full"
                        >
                            <View className="flex-row items-center">
                                {steps.map((_, idx) => (
                                    <View key={idx} className="flex-row items-center">
                                        <View
                                            className={`w-8 h-8 rounded-full items-center justify-center ${
                                                idx === step
                                                    ? "bg-emerald-400"
                                                    : idx < step
                                                        ? "bg-emerald-400/30"
                                                        : "bg-neutral-800"
                                            }`}
                                        >
                                            <Text className={`font-bold text-xs ${idx === step ? "text-black" : "text-white"}`}>
                                                {idx + 1}
                                            </Text>
                                        </View>
                                        {idx < steps.length - 1 && (
                                            <View className={`w-6 h-1 mx-1 ${idx < step ? "bg-emerald-400/30" : "bg-neutral-800"}`} />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        <Text className="text-neutral-400 text-xs mt-2">
                            Step {step + 1} of {steps.length}
                        </Text>
                    </View>

                    {/* Current Step */}
                    <View className="w-full">{steps[step]}</View>
                </ScrollView>

                {/* Navigation (fixed, safe) */}
                <View className="px-4 pb-6 bg-black border-t border-white/5">
                    <View className="flex-row justify-between items-center pt-4">
                        {step > 0 ? (
                            <TouchableOpacity
                                onPress={() => setStep(step - 1)}
                                className="flex-1 mr-3 px-6 py-4 bg-neutral-800 rounded-2xl border border-white/10"
                                activeOpacity={0.8}
                                disabled={submitting}
                            >
                                <Text className="text-white font-bold text-center text-base">← Previous</Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="flex-1 mr-3" />
                        )}

                        {step < steps.length - 1 ? (
                            <TouchableOpacity
                                onPress={() => setStep(step + 1)}
                                className="flex-1 ml-3 px-6 py-4 bg-white rounded-2xl"
                                activeOpacity={0.8}
                                style={{
                                    shadowColor: "#fff",
                                    shadowOpacity: 0.25,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 6 },
                                    elevation: 8,
                                }}
                                disabled={submitting}
                            >
                                <Text className="text-black font-bold text-center text-base">Next →</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={onSubmit}
                                className={`flex-1 ml-3 px-6 py-4 rounded-2xl ${
                                    canSubmit ? "bg-emerald-400" : "bg-emerald-400/40"
                                }`}
                                activeOpacity={0.8}
                                disabled={!canSubmit}
                                style={{
                                    shadowColor: "#10b981",
                                    shadowOpacity: 0.35,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 6 },
                                    elevation: 8,
                                }}
                            >
                                <Text className="text-black font-bold text-center text-base">
                                    {submitting ? "Submitting…" : "Submit ✓"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
