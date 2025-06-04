// hooks/useAuth.ts
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/auth";

const TOKEN_KEY   = "travelquest_token";
const USER_ID_KEY = "travelquest_user_id";

export function useAuth() {
  /* ← estado global + setters de zustand */
  const {
    isLoggedIn,
    userId,
    setIsLoggedIn,
    setUserId,
  } = useAuthStore();

  /* ---------- MÉTODOS ---------- */
  const login = async (token: string, uid?: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (uid) { await SecureStore.setItemAsync(USER_ID_KEY, uid); setUserId(uid); }
    setIsLoggedIn(true);
    return true;
  };

  const register = async (token?: string, uid?: string) => {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (uid)   { await SecureStore.setItemAsync(USER_ID_KEY, uid); setUserId(uid); }
    setIsLoggedIn(true);
    return true;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    setIsLoggedIn(false);
    setUserId(null);
    return true;
  };

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const uid   = await SecureStore.getItemAsync(USER_ID_KEY);
    if (token) {
      setIsLoggedIn(true);
      if (uid) setUserId(uid);
      return true;
    }
    return false;
  };

  /* ---------- RETORNO ---------- */
  return {
    /** Estado */
    isLoggedIn,
    userId,
    /** Acciones */
    login,
    register,
    logout,
    checkAuth,
  };
}
