import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, ImageBackground } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../../../lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";


// Tipo de entrada individual
type Entry = {
  id: number;
  description: string;
  image?: string | null;
  created_at: string;
};

export default function DayDetail() {
  const router = useRouter();
  const { idDay, bookId, city, image } = useLocalSearchParams();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const fetchEntries = async () => {
        try {
          setLoading(true);
          const res = await apiFetch(`/diarios/entradas/${idDay}`);
          if (!res.ok) throw new Error("Failed to fetch entries");

          const data = await res.json();
          setEntries(data);
        } catch (err) {
          console.error("❌ Error fetching entries:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchEntries();
    }, [idDay])
  );
  return (
    <ImageBackground
      source={require("../../../assets/images/fondo.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Flecha volver */}
      <TouchableOpacity
        onPress={() =>
          router.replace({
            pathname: "/diario/2ciudad",
            params: { bookId, city, image },
          })
        }
        className="absolute top-10 left-4 z-10 bg-white rounded-full p-2 shadow-md"
        >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View className="flex-1 px-6 pt-14 pb-20"> {/* espacio para botón fijo */}

        {/* Badge ciudad + fecha */}
        {entries.length > 0 && (
          <View className="bg-white px-4 py-2 rounded-xl shadow-md self-start mt-10 mb-6 flex-row items-center gap-2">
            <Text className="text-black text-lg font-semibold">
              {city} · {new Date(entries[0].created_at).toLocaleDateString("es-ES")}
            </Text>
            <Text className="text-black text-xl">🗓️</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }} // espaciado final
        >
          <View className="bg-white/95 p-4 rounded-2xl shadow-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-black font-bold text-base">
                Entradas del día ({entries.length})
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/crear/2.2entradaDiario",
                    params: { idDia: idDay },
                  })
                }
                className="bg-white px-3 py-1 rounded-xl flex-row items-center"
                style={{
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                }}
                 >
                <Text className="text-black text-sm font-semibold">➕ Añadir</Text>
              </TouchableOpacity>

            </View>


            {loading ? (
              <ActivityIndicator size="large" color="#699D81" />
            ) : (
              entries.map((entry) => (
                <View
                  key={entry.id}
                  className="mb-4 p-3 rounded-xl bg-white"
                  style={{
                    elevation: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}
                >
                  {entry.image ? (
                    <Image
                      source={{ uri: entry.image }}
                      resizeMode="cover"
                      className="w-full h-48 rounded-xl mb-3"
                    />
                  ) : (
                    <View className="w-full h-48 bg-gray-300 rounded-xl items-center justify-center mb-3">
                      <Text className="text-gray-600">Sin imagen</Text>
                    </View>
                  )}

                  <Text className="text-black text-base leading-relaxed">{entry.description}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}