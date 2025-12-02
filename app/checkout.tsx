// app/checkout.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { getAccessToken } from "../utils/secureStore";
import {
    getCart,
    checkoutCart,
    increaseCartQuantity,
    decreaseCartQuantity,
} from "../lib/api";
import type {
    CartItem,
    CartBreakdown,
    GetCartApiResponse,
} from "../lib/api";

type LineItem = CartItem & {
    _key: string;
};

const CheckoutScreen: React.FC = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [cartCount, setCartCount] = useState(0);
    const [backendBreakdown, setBackendBreakdown] =
        useState<CartBreakdown | null>(null);
    const [selectedPayment, setSelectedPayment] =
        useState<"card" | null>("card");
    const [addressInput, setAddressInput] = useState("");

    const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

    // --- Map API response → local state ---
    const mapCartResponse = (res: GetCartApiResponse) => {
        const relevant = (res.cart || []).filter(
            (item) =>
                item.orderType === "SingleMeal" ||
                item.orderType === "DailyPlan"
        );

        const mapped: LineItem[] = relevant.map((item, idx) => {
            const keyBase =
                item.orderType === "DailyPlan"
                    ? `${item.orderType}-${item.dayName || "day"}`
                    : item.mealId || "item";

            return {
                ...item,
                _key: `${keyBase}-${idx}`,
            };
        });

        setLineItems(mapped);
        setCartCount(mapped.length);
        setBackendBreakdown(res.breakdown || null);
    };

    // --- Fetch cart on focus (fresh every time you open checkout) ---
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadCart = async () => {
                try {
                    setLoading(true);
                    const token = await getAccessToken();
                    if (!token) {
                        if (!isActive) return;
                        Alert.alert(
                            "Not logged in",
                            "Please login to view your cart."
                        );
                        router.replace("/login");
                        return;
                    }

                    const res: GetCartApiResponse = await getCart(token);
                    if (!isActive) return;
                    mapCartResponse(res);
                } catch (err: any) {
                    if (!isActive) return;
                    Alert.alert(
                        "Error",
                        err?.message || "Could not load your cart. Please try again."
                    );
                } finally {
                    if (isActive) setLoading(false);
                }
            };

            loadCart();

            return () => {
                isActive = false;
            };
        }, [router])
    );

    // --- Totals from backend breakdown ---
    const {
        subtotalMeals,
        handlingFee,
        platformFee,
        deliveryFee,
        totalAmount,
    } = useMemo(() => {
        return {
            subtotalMeals: backendBreakdown?.totalMealsPrice ?? 0,
            handlingFee: backendBreakdown?.handlingFee ?? 0,
            platformFee: backendBreakdown?.platformFee ?? 0,
            deliveryFee: backendBreakdown?.deliveryFee ?? 0,
            totalAmount: backendBreakdown?.totalAmount ?? 0,
        };
    }, [backendBreakdown]);

    // --- Refresh cart after +/- ---
    const refreshCart = useCallback(async () => {
        try {
            const token = await getAccessToken();
            if (!token) {
                Alert.alert(
                    "Not logged in",
                    "Please login to view your cart."
                );
                router.replace("/login");
                return;
            }
            const res: GetCartApiResponse = await getCart(token);
            mapCartResponse(res);
        } catch (err: any) {
            Alert.alert(
                "Error",
                err?.message ||
                "Could not refresh your cart. Please try again."
            );
        }
    }, [router]);

    // --- Quantity handlers (sync with backend) ---
    const handleIncrement = async (item: LineItem) => {
        // Daily Plan quantity is fixed (1)
        if (item.orderType === "DailyPlan") return;
        if (!item.mealId) return;

        try {
            const token = await getAccessToken();
            if (!token) {
                Alert.alert(
                    "Not logged in",
                    "Please login to update your cart."
                );
                router.replace("/login");
                return;
            }

            await increaseCartQuantity(token, item.mealId);
            await refreshCart();
        } catch (err: any) {
            Alert.alert(
                "Update failed",
                err?.message ||
                "Could not increase quantity. Please try again."
            );
        }
    };

    const handleDecrement = async (item: LineItem) => {
        // Daily Plan quantity is fixed (1)
        if (item.orderType === "DailyPlan") return;
        if (!item.mealId) return;

        try {
            const token = await getAccessToken();
            if (!token) {
                Alert.alert(
                    "Not logged in",
                    "Please login to update your cart."
                );
                router.replace("/login");
                return;
            }

            await decreaseCartQuantity(token, item.mealId);
            await refreshCart();
        } catch (err: any) {
            Alert.alert(
                "Update failed",
                err?.message ||
                "Could not decrease quantity. Please try again."
            );
        }
    };

    // --- Place Order / Checkout ---
    const handlePlaceOrder = async () => {
        if (placingOrder) return;
        if (!lineItems.length) {
            Alert.alert("Cart empty", "Please add items to your cart first.");
            return;
        }
        if (!selectedPayment) {
            Alert.alert(
                "Select payment",
                "Please select a payment method."
            );
            return;
        }

        try {
            setPlacingOrder(true);
            const token = await getAccessToken();
            if (!token) {
                Alert.alert(
                    "Not logged in",
                    "Please login again to place order."
                );
                router.replace("/login");
                return;
            }

            const res = await checkoutCart(token);

            // Backend clears user.cart; mirror in UI
            setLineItems([]);
            setCartCount(0);
            setBackendBreakdown(null);

            Alert.alert(
                "Order Placed",
                res?.message || "Your order has been placed successfully.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace("/(tabs)/meals" as any);
                        },
                    },
                ]
            );
        } catch (err: any) {
            Alert.alert(
                "Checkout failed",
                err?.message ||
                "Could not place your order. Please try again."
            );
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    // --- Render helpers ---
    const renderLineItem = (item: LineItem) => {
        const isDaily = item.orderType === "DailyPlan";
        const imageUri = item.imageUrl || undefined;

        let title = item.mealName || "Meal";
        let subtitle = "Single Meal Plan";

        if (isDaily) {
            title = `${item.dayName || "Day"} - Daily meals`;
            subtitle = "Daily Plan (all meals for the day)";
        }

        const unitPrice =
            (item.price ?? undefined) !== undefined ? item.price || 0 : 0;
        const qty =
            item.quantity && item.quantity > 0 ? item.quantity : 1;

        // Prefer backend subTotal, fall back to price * qty
        const lineTotal =
            item.subTotal !== undefined ? item.subTotal : unitPrice * qty;

        return (
            <View
                key={item._key}
                className="flex-row items-center mb-5"
            >
                {/* Image */}
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        className="w-14 h-14 rounded-2xl mr-4"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-14 h-14 rounded-2xl mr-4 bg-neutral-800 items-center justify-center">
                        <Text className="text-[10px] text-neutral-500 text-center px-1">
                            No Image
                        </Text>
                    </View>
                )}

                {/* Texts + quantity controls */}
                <View className="flex-1 mr-3">
                    <Text
                        className="text-white text-[15px] font-semibold"
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                    <Text className="text-neutral-400 text-[11px] mt-1">
                        {subtitle}
                    </Text>

                    {/* Quantity controls */}
                    <View className="flex-row items-center mt-3">
                        {/* Minus */}
                        <TouchableOpacity
                            onPress={() => handleDecrement(item)}
                            activeOpacity={isDaily ? 1 : 0.9}
                            disabled={isDaily}
                            className={`w-9 h-9 rounded-full border border-white/20 items-center justify-center ${
                                isDaily ? "bg-white/5" : "bg-white/10"
                            }`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.25,
                                shadowRadius: 4,
                                elevation: 3,
                            }}
                        >
                            <Text className="text-white text-base font-semibold">
                                −
                            </Text>
                        </TouchableOpacity>

                        <Text className="text-white text-sm mx-4 font-semibold">
                            {qty}
                        </Text>

                        {/* Plus */}
                        <TouchableOpacity
                            onPress={() => handleIncrement(item)}
                            activeOpacity={isDaily ? 1 : 0.9}
                            disabled={isDaily}
                            className="w-9 h-9 rounded-full items-center justify-center"
                            style={{
                                backgroundColor: isDaily ? "#4b4335" : "#f5b31b",
                                shadowColor: isDaily ? "#000" : "#f5b31b",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: isDaily ? 0.3 : 0.5,
                                shadowRadius: 6,
                                elevation: 5,
                            }}
                        >
                            <Text className="text-black text-base font-semibold">
                                +
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Price */}
                <View className="items-end">
                    <Text className="text-white text-[15px] font-semibold">
                        {formatCurrency(lineTotal)}
                    </Text>
                    <Text className="text-neutral-500 text-[11px] mt-1">
                        {formatCurrency(unitPrice)} each
                    </Text>
                </View>
            </View>
        );
    };

    const hasItems = lineItems.length > 0;

    // --- UI ---
    return (
        <View
            className="flex-1 bg-black"
            style={{ backgroundColor: "#120c08" }}
        >
            <SafeAreaView edges={["top"]} className="bg-transparent">
                {/* Top bar */}
                <View className="flex-row items-center px-4 py-3 mb-1">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="w-10 h-10 rounded-full items-center justify-center bg-white/10 mr-3"
                        activeOpacity={0.8}
                    >
                        <ArrowLeft color="#ffffff" size={20} />
                    </TouchableOpacity>
                    <Text className="text-white text-[20px] font-semibold">
                        Checkout
                    </Text>
                </View>
            </SafeAreaView>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-neutral-400 mt-3 text-sm">
                        Loading your cart…
                    </Text>
                </View>
            ) : !hasItems ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-neutral-300 text-center mb-5 text-[15px]">
                        Your cart is empty.
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.replace("/(tabs)/meals" as any)}
                        className="px-6 py-3 rounded-2xl bg-white"
                        activeOpacity={0.9}
                    >
                        <Text className="text-black font-semibold text-sm">
                            Browse Meals
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 28 }}
                    className="flex-1"
                >
                    {/* Order Summary */}
                    <View className="px-4 mt-2">
                        <Text className="text-white text-[17px] font-semibold mb-3">
                            Order Summary
                        </Text>

                        <View className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            {lineItems.map(renderLineItem)}

                            {/* Price breakdown from backend */}
                            <View className="mt-1 pt-3 border-t border-white/10">
                                <View className="flex-row justify-between mb-1.5">
                                    <Text className="text-neutral-300 text-[13px]">
                                        Subtotal (Meals)
                                    </Text>
                                    <Text className="text-neutral-100 text-[13px] font-medium">
                                        {formatCurrency(subtotalMeals)}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between mb-1.5">
                                    <Text className="text-neutral-300 text-[13px]">
                                        Handling Fee
                                    </Text>
                                    <Text className="text-neutral-100 text-[13px] font-medium">
                                        {formatCurrency(handlingFee)}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between mb-1.5">
                                    <Text className="text-neutral-300 text-[13px]">
                                        Platform Fee
                                    </Text>
                                    <Text className="text-neutral-100 text-[13px] font-medium">
                                        {formatCurrency(platformFee)}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between mb-1.5">
                                    <Text className="text-neutral-300 text-[13px]">
                                        Delivery
                                    </Text>
                                    <Text className="text-neutral-100 text-[13px] font-medium">
                                        {formatCurrency(deliveryFee)}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between mt-2">
                                    <Text className="text-white text-[15px] font-semibold">
                                        Total
                                    </Text>
                                    <Text className="text-white text-[15px] font-semibold">
                                        {formatCurrency(totalAmount)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Apply Coupon button */}
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                activeOpacity={0.9}
                                className="px-5 py-2.5 rounded-2xl bg-[#5b4b2a]"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 3 },
                                    shadowOpacity: 0.35,
                                    shadowRadius: 5,
                                    elevation: 4,
                                }}
                            >
                                <Text className="text-white text-[12px] font-semibold">
                                    Apply Coupon
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Delivery Address */}
                    <View className="px-4 mt-6">
                        <Text className="text-white text-[16px] font-semibold mb-2">
                            Delivery Address
                        </Text>
                        <TextInput
                            value={addressInput}
                            onChangeText={setAddressInput}
                            placeholder="Your default address will be used"
                            placeholderTextColor="#8b7c64"
                            className="px-4 py-3.5 rounded-2xl bg-[#2b2218] text-white text-sm border border-white/10"
                        />
                    </View>

                    {/* Payment Method */}
                    <View className="px-4 mt-6 mb-4">
                        <Text className="text-white text-[16px] font-semibold mb-3">
                            Payment Method
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setSelectedPayment("card")}
                            className="flex-row items-center"
                        >
                            <View className="flex-row items-center">
                                <View
                                    className={`w-5 h-5 rounded-md mr-3 items-center justify-center ${
                                        selectedPayment === "card"
                                            ? "bg-[#f5b31b]"
                                            : "bg-white"
                                    }`}
                                >
                                    {selectedPayment === "card" && (
                                        <View className="w-2.5 h-2.5 rounded-sm bg-black" />
                                    )}
                                </View>
                                <Text className="text-white text-sm">
                                    Credit Card
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Place Order button */}
            {!loading && hasItems && (
                <SafeAreaView edges={["bottom"]} className="bg-transparent">
                    <View className="px-4 pb-3 pt-1">
                        <TouchableOpacity
                            activeOpacity={0.95}
                            onPress={handlePlaceOrder}
                            disabled={placingOrder}
                            className="w-full py-3.5 rounded-3xl items-center justify-center"
                            style={{
                                backgroundColor: "#f5b31b",
                                shadowColor: "#f5b31b",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.6,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            <Text className="text-black text-[15px] font-semibold">
                                {placingOrder ? "Placing Order…" : "Place Order"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            )}
        </View>
    );
};

export default CheckoutScreen;
