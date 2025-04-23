import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Ionicons } from "@expo/vector-icons";

export default function HistoriaMision() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams();
  const [historia, setHistoria] = useState<string | null>(null);
  const [titulo, setTitulo] = useState<string>("");
  const [loading, setLoading] = useState(true);

  console.log("📥 Obteniendo historia para missionId:", missionId);
  useEffect(() => {
    if (!missionId) {
      console.warn("⚠️ No se recibió missionId en los parámetros");
      return;
    }

    const fetchHistoria = async () => {
      try {
        console.log("📥 Fetching historia for missionId:", missionId);
        const res = await apiFetch(`/misiones/${missionId}/historia`);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error HTTP: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        console.log("📄 Historia obtenida:", data);

        if (typeof data.historia !== "string" || data.historia.trim().length === 0) {
          throw new Error("Historia vacía o malformada");
        }

        setHistoria(data.historia);
        if (data.title) setTitulo(data.title);
      } catch (error) {
        console.error("❌ Error obteniendo historia:", error);
        setHistoria(null);
      } finally {
        setLoading(false);
      }
    };

    if (missionId) {
      fetchHistoria();
    }else {
      console.warn("⚠️ No se recibió missionId en los parámetros");
    }
  }, [missionId]);

  return (
    <View className="flex-1 bg-[#F4EDE0] pt-10">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 80,
          paddingBottom: 140, // <- MÁS espacio para dejar ver el botón
        }}
      >
        {loading ? (
          <View className="mt-20 items-center justify-center">
            <ActivityIndicator size="large" color="#699D81" />
            <Text className="text-black mt-4">Cargando historia...</Text>
          </View>
        ) : historia ? (
          <>
            {titulo && (
              <Text className="text-xl font-bold text-black mb-4 text-center">{titulo}</Text>
            )}
            <Text className="text-base text-black leading-6 text-justify whitespace-pre-line">
              {historia}
            </Text>
          </>
        ) : (
          <Text className="text-black mt-10 text-center italic">
            No se pudo mostrar la historia para esta misión.
          </Text>
        )}

        <TouchableOpacity
          className="mt-10 bg-[#699D81] py-3 px-4 rounded-xl items-center"
          onPress={() => router.replace("/(tabs)/crear")}
        >
          <Text className="text-white font-semibold text-base">Seguir explorando</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
