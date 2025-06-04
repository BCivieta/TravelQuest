import { useRouter } from "expo-router";
import { useCallback, useState} from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ImageBackground } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { apiFetch } from "../../../lib/api";
import { useFocusEffect } from "@react-navigation/native";
import { MotiView } from "moti";


// Tipo misión
type Mission = {
  id: number;
  title: string;
  description: string;
  status: "accepted" | "completed" | "discarded";
  created_at: string,
  completed_at: string | null;
  image_url?: string | null;
};

export default function MissionList() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);

  useFocusEffect(
    useCallback(() => {
    const fetchMissions = async () => {
      try {
        const res = await apiFetch("/misiones/mine");
        if (!res.ok) throw new Error("Error al cargar misiones");
        const data = await res.json();
        setMissions(data);
      } catch (err) {
        console.error("❌", err);
        Alert.alert("Error", "No se pudieron cargar las misiones");
      }
    };

    fetchMissions();
   }, [])
  );

  // Al pulsar una misión, decidir a qué pantalla ir
  const handlePressMission = (mission: Mission) => {
    if (mission.status === "completed") {
      router.push({
        pathname: "/misiones/detallesMision",
        params: { id: mission.id.toString() },
      });
    } else {
      router.push({
        pathname: "/crear/3misionGenerada",
        params: { 
          missionId: mission.id.toString(),
          title: mission.title,
          description: mission.description,
         },
      });
    }
  };
  const pending = missions.filter(m => m.status === "accepted")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const completed = missions.filter(m => m.status === "completed")
    .sort((a, b) => new Date(b.completed_at ?? '').getTime() - new Date(a.completed_at ?? '').getTime());

  const renderMission = (mission: Mission, index: number) => {
  const isCompleted = mission.status === "completed";
  const date = isCompleted ? mission.completed_at ?? mission.created_at : mission.created_at;
  const dateText = isCompleted 
    ? `Completada el ${new Date(date).toLocaleDateString("es-ES")}` 
    : `Asignada el ${new Date(date).toLocaleDateString("es-ES")}`;

  return (
    <View key={mission.id} className="mb-4">
      {/* Fondo gris claro envolvente */}
      <View className="bg-gray-300 p-3 rounded-xl">
        <TouchableOpacity
          onPress={() => handlePressMission(mission)}
          className="p-3 rounded-xl bg-white"
          style={{
            elevation: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
          }}
        >
          <View className="flex-row justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-bold text-base text-black">
                {mission.title}
              </Text>
              <Text className="text-black" numberOfLines={1}>
                {mission.description}
              </Text>
              <Text className="text-xs text-gray-500 mt-1 italic">{dateText}</Text>

              <View className="mt-2 flex-row items-center">
                <Text
                  className={`text-xs mr-1 ${isCompleted ? "text-[#699D81]" : "text-yellow-600"}`}
                >
                  {isCompleted ? "Completado" : "Pendiente"}
                </Text>
                <Ionicons
                  name={isCompleted ? "checkmark-circle" : "hourglass"}
                  size={14}
                  color={isCompleted ? "#699D81" : "#FACC15"}
                />
              </View>
            </View>

            {isCompleted && mission.image_url && (
              <Image
                source={{ uri: mission.image_url }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 10,
                  marginLeft: 4,
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};


  return (
  <ImageBackground
    source={require("../../../assets/images/fondo.png")}
    style={{ flex: 1 }}
    resizeMode="cover"
  >
    <View className="flex-1 px-4 pt-20">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta misiones pendientes (siempre visible) */}
        <View className="mb-8 bg-white/95 p-4 rounded-2xl shadow-md">
          <Text className="text-black font-bold text-base mb-4">
            🕒 Misiones pendientes ({pending.length})
          </Text>

          {pending.length > 0 ? (
            pending.map((m, i) => renderMission(m, i))
          ) : (
            <Text className="text-gray-500 italic">No tienes misiones pendientes.</Text>
          )}
        </View>

        {/* Tarjeta misiones completadas */}
        {completed.length > 0 && (
          <View className="bg-white/95 p-4 rounded-2xl shadow-md">
            <Text className="text-black font-bold text-base mb-4">
              ✅ Misiones completadas ({completed.length})
            </Text>
            {completed.map((m, i) => renderMission(m, i))}
          </View>
        )}
      </ScrollView>
    </View>
  </ImageBackground>
);

}