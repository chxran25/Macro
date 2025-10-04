import * as SecureStore from "expo-secure-store";

const ACCESS = "accessToken";
const REFRESH = "refreshToken";
const ONBOARDED = "hasOnboarded"; // "true" | "false"

export async function saveTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS, accessToken);
    await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export async function getAccessToken() {
    return await SecureStore.getItemAsync(ACCESS);
}

export async function getRefreshToken() {
    return await SecureStore.getItemAsync(REFRESH);
}

export async function clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
}

/** First-time preference plan flag */
export async function setOnboarded(value: boolean) {
    await SecureStore.setItemAsync(ONBOARDED, value ? "true" : "false");
}
export async function getOnboarded() {
    return await SecureStore.getItemAsync(ONBOARDED); // -> "true" | "false" | null
}
export async function clearOnboarded() {
    await SecureStore.deleteItemAsync(ONBOARDED);
}
