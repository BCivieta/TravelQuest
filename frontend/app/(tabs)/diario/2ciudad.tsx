import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, ImageBackground} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons"; // Íconos decorativos
import {useState,  useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../../../lib/api";

// Tipo Día para simular mejor la estructura real
type TravelDay = {
  id: number;
  travel_date: string;
  image?: string | null;
};

export default function CityDetail() {
  const router = useRouter();
  const { bookId, city, image } = useLocalSearchParams();

  const [days, setDays] = useState<TravelDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar días cada vez que se entra en esta pantalla (tab focus)
  useFocusEffect(
    useCallback(() => {
      const loadDays = async () => {
        try {
          setLoading(true);
          const res = await apiFetch(`/diarios/dias/${bookId}`);
          if (!res.ok) throw new Error("Failed to fetch travel days");
          const data = await res.json();
          setDays(data);
        } catch (err) {
          console.error("❌ Error loading days:", err);
        } finally {
          setLoading(false);
        }
      };

      loadDays();
    }, [bookId])
  );

  // Navegar al detalle del día
  const handleViewDay = (dayId: string) => {
    router.push({
      pathname: "/diario/3dia",
      params: {
        idDay: dayId,
        bookId: bookId?.toString(),
        city: city?.toString(),
        image: image?.toString(),
      },
    });
  };
 return (
  <ImageBackground
    source={require("../../../assets/images/fondo.png")}
    style={{ flex: 1 }}
    resizeMode="cover"
  >
    {/* Flecha volver con fondo blanco sólido */}
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/diario/diario")}
      className="absolute top-10 left-4 z-10 bg-white rounded-full p-2 shadow-md"
    >
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>

    <View className="flex-1 px-6 pt-14">

      {/* Encabezado ciudad */}
      <View className="bg-white px-4 mt-10 py-2 rounded-xl shadow-md self-start flex-row items-center gap-2">
        <Text className="text-black text-lg font-semibold">{city}</Text>
        <Text className="text-black text-xl">🏙️</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 28 }}
      >
        {/* Gran card blanca envolvente */}
        <View className="bg-white/95 p-4 rounded-2xl shadow-md">
          <Text className="text-black font-bold text-base mb-4">
            Días del viaje ({days.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#699D81" />
          ) : (
            days.map((day) => {
              const formattedDate = day.travel_date
                ? new Date(`${day.travel_date}T00:00:00Z`).toLocaleDateString("es-ES")
                : "Fecha no disponible";

              return (
                <View key={day.id} className="mb-3 bg-gray-300 p-3 rounded-xl">
                  <TouchableOpacity
                    onPress={() => handleViewDay(day.id.toString())}
                    className="p-2 rounded-xl bg-white"
                    style={{
                      elevation: 6,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      {/* Imagen + fecha */}
                      <View className="flex-row items-center flex-1">
                        {day.image ? (
                          <Image
                            source={{ uri: day.image }}
                            className="w-16 h-16 rounded-xl mr-3"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-16 h-16 bg-gray-300 rounded-xl mr-3 items-center justify-center">
                            <Text className="text-xs text-gray-500 text-center">Sin imagen</Text>
                          </View>
                        )}
                        <Text className="text-black font-bold text-base">{formattedDate}</Text>
                      </View>

                      {/* Icono libro */}
                      <Text className="text-xl me-2">📖</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  </ImageBackground>
);



}