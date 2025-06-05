import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import * as SecureStore from "expo-secure-store";

(async () => {
  await SecureStore.deleteItemAsync("travelquest_token");
  await SecureStore.deleteItemAsync("travelquest_user_id");
})();

/**
 * Pantalla de arranque: muestra un loader mientras comprobamos
 * si el usuario tiene un token guardado y, cuando termina, redirige
 * a /login (si no hay sesión) o a /crear (si ya está logeado).
 */
export default function Index() {
  /* --- estado global y métodos del hook --- */
  const { isLoggedIn, checkAuth } = useAuth();

  /* --- flag local para saber si ya se ejecutó checkAuth() --- */
  const [ready, setReady] = useState(false);

  /* --- al montar, verificamos autenticación una sola vez --- */
  useEffect(() => {
    (async () => {
      await checkAuth();  // ← cambia isLoggedIn según encuentre token
      setReady(true);     // ← ahora ya podemos decidir la ruta
    })();
  }, [checkAuth]);

  /* --- loader mientras esperamos la verificación --- */
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* --- redirección definitiva --- */
  return <Redirect href={isLoggedIn ? "/(tabs)/crear/crear" : "/(tabs)/login"} />;
}

