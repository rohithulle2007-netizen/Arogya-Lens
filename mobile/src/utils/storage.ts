import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@arogya_token";
const USER_KEY = "@arogya_user";
const API_URL_KEY = "@arogya_api_url";

export const DEFAULT_API_URL = "http://127.0.0.1:8000";

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
    return url || DEFAULT_API_URL;
  },
  async setApiUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(API_URL_KEY, url.trim().replace(/\/$/, ""));
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
};
