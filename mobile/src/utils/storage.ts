import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const TOKEN_KEY = "@arogya_token";
const USER_KEY = "@arogya_user";
const API_URL_KEY = "@arogya_api_url";

export const getDynamicDefaultApiUrl = (): string => {
  // Extract host from Expo Metro connection if available
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && !host.includes("exp.direct") && !host.includes("localhost") && host !== "127.0.0.1") {
      return `http://${host}:8000`;
    }
  }
  return "http://10.127.173.92:8000";
};

export const DEFAULT_API_URL = getDynamicDefaultApiUrl();

export const Storage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async getUser(): Promise<any | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async getApiUrl(): Promise<string> {
    const url = await AsyncStorage.getItem(API_URL_KEY);
    return url || getDynamicDefaultApiUrl();
  },
  async setApiUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(API_URL_KEY, url.trim().replace(/\/$/, ""));
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
};
