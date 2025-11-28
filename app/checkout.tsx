// app/checkout.tsx
import React, { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { getAccessToken } from "../utils/secureStore";
import { getCart, checkoutCart } from "../lib/api";
import type { CartItem, GetCartApiResponse } from "../lib/api";

const CheckoutScreen: React.FC = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartCount, setCartCount] = useState(0);
    const [selectedPayment, setSelectedPayment] = useState<"card" | null>("card");

    // (Optional future use) Delivery address input
    const [addressInput, setAddressInput] = useState("");

    // ------- Fetch cart on mount -------
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const token = await getAccessToken();
                if (!token) {
                    Alert.alert("Not logged in", "Please login to view your cart.");
                    router.replace("/login");
                    return;
                }

                const res: GetCartApiResponse = await getCart(token);

// ✅ Only keep items that were added via the SingleMeal endpoint
                const singles = (res.cart || []).filter(
                    (item) => item.orderType === "SingleMeal"
                );

                setCartItems(singles);
                setCartCount(singles.length);
            } catch (err: any) {
                Alert.alert(
                    "Error",
                    err?.message || "Could not load your cart. Please try again."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ------- Derived amounts (front-end view only) -------
    const { subtotal, deliveryFee, total } = useMemo(() => {
        let sub = 0;

        cartItems.forEach((item) => {
            // Prefer explicit price; fallback to totalAmount
            const base =
                (item.price ?? undefined) !== undefined
                    ? item.price || 0
                    : item.totalAmount || 0;
            sub += base || 0;
        });

        // You don't have delivery fees from /cart; use a simple estimate for display.
        // Backend will compute real totals in /checkout.
        const delivery = cartItems.length > 0 ? 5 : 0; // tweak as needed
        const t = sub + delivery;

        return {
            subtotal: sub,
            deliveryFee: delivery,
            total: t,
        };
    }, [cartItems]);

    const formatCurrency = (value: number) =>
        `₹${value.toFixed(2)}`; // or `$` if you prefer

    // ------- Place Order / Checkout -------
    const handlePlaceOrder = async () => {
        if (placingOrder) return;
        if (!cartItems.length) {
            Alert.alert("Cart empty", "Please add items to your cart first.");
            return;
        }
        if (!selectedPayment) {
            Alert.alert("Select payment", "Please select a payment method.");
            return;
        }

        try {
            setPlacingOrder(true);
            const token = await getAccessToken();
            if (!token) {
                Alert.alert("Not logged in", "Please login again to place order.");
                router.replace("/login");
                return;
            }

            const res = await checkoutCart(token);

            Alert.alert(
                "Order Placed",
                res?.message || "Your order has been placed successfully.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // You can navigate to Orders screen if you have one
                            router.replace("/(tabs)/orders" as any);
                        },
                    },
                ]
            );
        } catch (err: any) {
            Alert.alert(
                "Checkout failed",
                err?.message || "Could not place your order. Please try again."
            );
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    // ------- Render helpers -------
    const renderCartItem = (item: CartItem, index: number) => {
        const quantity = item.quantity || 1;
        const subtitle =
            item.orderType === "SingleMeal"
                ? "Single Meal Plan"
                : `${quantity} item${quantity > 1 ? "s" : ""}`;

        const imageUri = item.imageUrl || undefined;

        return (
            <View
                key={`${item.mealId || index}-${index}`}
                className="flex-row items-center mb-4"
            >
                {/* Image */}
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        className="w-12 h-12 rounded-lg mr-3"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-12 h-12 rounded-lg mr-3 bg-neutral-800 items-center justify-center">
                        <Text className="text-[10px] text-neutral-500 text-center px-1">
                            No Image
                        </Text>
                    </View>
                )}

                {/* Texts */}
                <View className="flex-1">
                    <Text
                        className="text-white text-sm font-semibold"
                        numberOfLines={2}
                    >
                        {item.mealName || "Meal"}
                    </Text>
                    <Text className="text-neutral-400 text-[11px] mt-0.5">
                        {subtitle}
                    </Text>
                </View>

                {/* Price */}
                <Text className="text-white text-sm font-semibold ml-2">
                    {formatCurrency(
                        (item.price ??
                            item.totalAmount ??
                            0) as number
                    )}
                </Text>
            </View>
        );
    };

    // ------- UI -------
    return (
        <View
            className="flex-1 bg-black"
            style={{ backgroundColor: "#1c130b" }} // deep brown to match mock
        >
            <SafeAreaView edges={["top"]} className="bg-transparent">
                {/* Top bar */}
                <View className="flex-row items-center px-4 py-3">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="w-9 h-9 rounded-full items-center justify-center bg-white/5 mr-2"
                        activeOpacity={0.8}
                    >
                        <ArrowLeft color="#ffffff" size={18} />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold">Checkout</Text>
                </View>
            </SafeAreaView>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-neutral-400 mt-3">
                        Loading your cart…
                    </Text>
                </View>
            ) : !cartItems.length ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-neutral-300 text-center mb-4">
                        Your cart is empty.
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.replace("/(tabs)/meals" as any)}
                        className="px-5 py-3 rounded-2xl bg-white"
                    >
                        <Text className="text-black font-semibold">
                            Browse Meals
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{
                        paddingBottom: 24,
                    }}
                    className="flex-1"
                >
                    {/* Order Summary */}
                    <View className="px-4 mt-2">
                        <Text className="text-white text-base font-semibold mb-3">
                            Order Summary
                        </Text>

                        {cartItems.map(renderCartItem)}

                        {/* Subtotal / Delivery / Total */}
                        <View className="mt-2">
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-neutral-300 text-sm">
                                    Subtotal
                                </Text>
                                <Text className="text-neutral-100 text-sm">
                                    {formatCurrency(subtotal)}
                                </Text>
                            </View>
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-neutral-300 text-sm">
                                    Delivery
                                </Text>
                                <Text className="text-neutral-100 text-sm">
                                    {formatCurrency(deliveryFee)}
                                </Text>
                            </View>
                            <View className="flex-row justify-between mt-1">
                                <Text className="text-white text-sm font-semibold">
                                    Total
                                </Text>
                                <Text className="text-white text-sm font-semibold">
                                    {formatCurrency(total)}
                                </Text>
                            </View>
                        </View>

                        {/* Apply Coupon button */}
                        <View className="flex-row justify-end mt-3">
                            <TouchableOpacity
                                activeOpacity={0.85}
                                className="px-4 py-2 rounded-xl bg-[#5b4b2a]"
                            >
                                <Text className="text-white text-xs font-semibold">
                                    Apply Coupon
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Delivery Address */}
                    <View className="px-4 mt-6">
                        <Text className="text-white text-base font-semibold mb-2">
                            Delivery Address
                        </Text>
                        {/* For now, input is visual only. Backend uses saved address. */}
                        <TextInput
                            value={addressInput}
                            onChangeText={setAddressInput}
                            placeholder="Your default address will be used"
                            placeholderTextColor="#8b7c64"
                            className="px-4 py-3 rounded-xl bg-[#3a2f22] text-white text-sm"
                        />
                    </View>

                    {/* Payment Method */}
                    <View className="px-4 mt-6 mb-4">
                        <Text className="text-white text-base font-semibold mb-3">
                            Payment Method
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setSelectedPayment("card")}
                            className="flex-row items-center"
                        >
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
                            <Text className="text-white text-sm">Credit Card</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Place Order button */}
            {!loading && cartItems.length > 0 && (
                <SafeAreaView
                    edges={["bottom"]}
                    className="bg-transparent"
                >
                    <View className="px-4 pb-3 pt-1">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handlePlaceOrder}
                            disabled={placingOrder}
                            className="w-full py-3 rounded-2xl items-center justify-center"
                            style={{ backgroundColor: "#f5b31b" }} // bright yellow
                        >
                            <Text className="text-black text-sm font-semibold">
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
