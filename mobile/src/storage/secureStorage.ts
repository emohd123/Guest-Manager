import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// SecureStore is native-only (iOS Keychain / Android Keystore). On web we fall
// back to AsyncStorage. Stored values (JWTs + ids) are well under the 2KB
// SecureStore value limit.
const isNative = Platform.OS === "ios" || Platform.OS === "android";

export async function secureSet(key: string, value: string) {
  if (isNative) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function secureGet(key: string): Promise<string | null> {
  if (isNative) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

export async function secureDelete(key: string) {
  if (isNative) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

// One-time migration of a legacy plaintext value left in AsyncStorage by older
// builds: copy it into SecureStore and remove the plaintext copy.
export async function migrateLegacyKey(key: string) {
  if (!isNative) return;
  const legacy = await AsyncStorage.getItem(key);
  if (legacy) {
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
  }
}
