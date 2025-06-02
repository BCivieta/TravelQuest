import { View, Text, TouchableOpacity, Alert, ImageBackground, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../../store/auth";
import { apiFetch } from "../../../lib/api";
import { useUbicacion } from "../../../hooks/useUbicacion";
import React, { useState } from 'react';

export default function RetoNumero() {
  const router = useRouter();
  const { cityId: paramCityId } = useLocalSearchParams();
  const { ubicacion } = useUbicacion();

  const cityId = paramCityId ?? ubicacion?.cityId;
  const userId = useAuthStore((state) => state.userId);

  const [loading, setLoading] = useState(false);
  const [loadingOption, setLoadingOption] = useState<number | null>(null);

  const generarReto = async (cantidad: number) => {
    try {
      setLoading(true);
      setLoadingOption(cantidad);

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

      if (!reto?.id) {
        throw new Error("La respuesta del servidor no contiene un reto válido");
      }

      console.log("🎯 Reto generado:", JSON.stringify(reto, null, 2));

      router.push({
        pathname: "./retoGenerado",
        params: {
          retoId: reto.id.toString(),
        },
      });
    } catch (err) {
      console.error("Error generando reto:", err);
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo generar el reto.");
    } finally {
      setLoading(false);
      setLoadingOption(null);
    }
  };

  const seleccionarCantidad = async (cantidad: number) => {
    if (!userId) return Alert.alert("Error", "Usuario no identificado.");
    if (!cityId) return Alert.alert("Error", "Ciudad no especificada.");

    try {
      const res = await apiFetch("/retos/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: Number(cityId),
          userId,
          totalMissions: cantidad,
        }),
      });

      if (res.status === 409) {
        Alert.alert(
          "Reto ya existente",
          "Ya tienes un reto activo. Si generas uno nuevo, el anterior se eliminará. ¿Deseas continuar?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Sí, reemplazar",
              style: "destructive",
              onPress: async () => {
                try {
                  setLoading(true);
                  setLoadingOption(cantidad);

                  const delRes = await apiFetch("/retos/activo", {
                    method: "DELETE",
                  });

                  if (!delRes.ok) throw new Error("No se pudo descartar el reto activo.");

                  await generarReto(cantidad);
                } catch (err) {
                  console.error("❌ Error descartando reto:", err);
                  Alert.alert("Error", "No se pudo eliminar el reto actual.");
                  setLoading(false);
                  setLoadingOption(null);
                }
              },
            },
          ]
        );
        return;
      }

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const reto = await res.json();

      if (!reto?.id) {
        throw new Error("La respuesta del servidor no contiene un reto válido");
      }

      router.push({
        pathname: "./retoGenerado",
        params: {
          retoId: reto.id.toString(),
        },
      });
    } catch (err) {
      console.error("Error generando reto:", err);
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo generar el reto.");
    } finally {
      setLoading(false);
      setLoadingOption(null);
    }
  };

  const BotonReto = ({ cantidad, label, emoji }: { cantidad: number; label: string; emoji: string }) => (
    <TouchableOpacity
      disabled={loading}
      onPress={() => seleccionarCantidad(cantidad)}
      className="bg-white px-4 py-5 mb-6 rounded-xl border border-gray-200"
      style={{
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-black font-bold text-lg">{cantidad} Misiones</Text>
        {loadingOption === cantidad ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text className="text-black text-xl">→</Text>
        )}
      </View>
      <Text className="text-black/60 text-sm">
        {label} {emoji}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("../../../assets/images/fondo.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View className="flex-1 px-6 pt-12 justify-start">
        <View className="bg-white/80 px-4 py-2 rounded-xl shadow-md self-start mb-10 flex-row items-center gap-2">
          <Text className="text-black text-lg font-semibold">¿Cuántas misiones quieres?</Text>
          <Text className="text-black text-lg">🗺️</Text>
        </View>

        <View className="bg-white/80 rounded-2xl p-4 shadow-md space-y-6 mb-10">
          <BotonReto cantidad={5} label="Explora lo esencial" emoji="🚶‍♂️" />
          <BotonReto cantidad={10} label="Para los exploradores" emoji="🌍" />
          <BotonReto cantidad={15} label="El reto definitivo" emoji="🔥🔥🔥" />
        </View>
      </View>
    </ImageBackground>
  );
}
