import { View, Text, TouchableOpacity, Alert, ImageBackground } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import React from 'react';
import { useAuthStore } from "../../../store/auth";
import { apiFetch } from "../../../lib/api";
import { useUbicacion } from "../../../hooks/useUbicacion";

export default function RetoNumero() {
  const router = useRouter();
  const { cityId: paramCityId } = useLocalSearchParams();
  const { ubicacion } = useUbicacion();

  const cityId = paramCityId ?? ubicacion?.cityId;
  const userId = useAuthStore((state) => state.userId);

  const seleccionarCantidad = async (cantidad: number) => {
    if (!userId) {
      Alert.alert("Error", "Usuario no identificado.");
      return;
    }

    if (!cityId) {
      Alert.alert("Error", "Ciudad no especificada.");
      return;
    }

    try {
      console.log("Generando reto con:", { cityId, userId, cantidad });

      const res = await apiFetch("/retos/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: Number(cityId),
          userId,
          totalMissions: cantidad,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const reto = await res.json();

      router.push({
        pathname: "./retoGenerado",
        params: {
          retoId: reto.id.toString(),
        },
      });
    } catch (err) {
      console.error("Error generando reto:", err);
      const errorMessage = err instanceof Error
        ? err.message
        : "No se pudo generar el reto.";

      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/fondo.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View className="flex-1 px-6 pt-12 justify-start">

        <View className="bg-white/80 px-4 py-2 rounded-xl shadow-md self-start mb-10 flex-row items-center gap-2">
          <Text className="text-black text-lg font-semibold">
            ¿Cuántas misiones quieres?
          </Text>
          <Text className="text-black text-lg">🗺️</Text>
        </View>

        <View className="bg-white/80 rounded-2xl p-4 shadow-md space-y-6 mb-10">

          {/* Botón 5 misiones */}
          <TouchableOpacity
            className="bg-white px-4 py-5 mb-6 rounded-xl border border-gray-200"
            style={{
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
            onPress={() => seleccionarCantidad(5)}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-black font-bold text-lg">5 Misiones</Text>
              <Text className="text-black text-xl">→</Text>
            </View>
            <Text className="text-black/60 text-sm">Explora lo esencial 🚶‍♂️</Text>
          </TouchableOpacity>

          {/* Botón 10 misiones */}
          <TouchableOpacity
            className="bg-white px-4 py-5 mb-6 rounded-xl border border-gray-200"
            style={{
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
            onPress={() => seleccionarCantidad(10)}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-black font-bold text-lg">10 Misiones</Text>
              <Text className="text-black text-xl">→</Text>
            </View>
            <Text className="text-black/60 text-sm">Para los exploradores 🌍</Text>
          </TouchableOpacity>

          {/* Botón 15 misiones */}
          <TouchableOpacity
            className="bg-white px-4 py-5 rounded-xl border border-gray-200"
            style={{
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
            onPress={() => seleccionarCantidad(15)}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-black font-bold text-lg">15 Misiones</Text>
              <Text className="text-black text-xl">→</Text>
            </View>
            <Text className="text-black/60 text-sm">El reto definitivo 🔥🔥🔥</Text>
          </TouchableOpacity>

        </View>
      </View>
    </ImageBackground>
  );
}
