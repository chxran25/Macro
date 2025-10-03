import { View, Text, ActivityIndicator } from "react-native";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

export default function Index() {
    const { loading } = useAuthRedirect();

    return (
        <View className="flex-1 items-center justify-center bg-black">
            <Text className="text-white text-3xl font-bold mb-4">CalorieBoy</Text>
            {loading && <ActivityIndicator color="#fff" />}
        </View>
    );
}
