import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ImageBackground, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../../lib/api";

type Mission = {
  id: number;
  title: string;
  difficulty: number;
  status: "accepted" | "completed";
  created_at: string;
  completed_at: string | null;
};

type Challenge = {
  id: number;
  missions: Mission[];
};

export default function RetoGenerado() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/retos/activo");
      if (res.status === 404) {
        setChallenge(null);
      } else if (!res.ok) {
        throw new Error("Error al cargar reto");
      } else {
        const data = await res.json();
        setChallenge(data);
      }
    } catch (err) {
      console.error("❌", err);
      Alert.alert("Error", "No se pudo cargar el reto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  const getPoints = (missions: Mission[]) =>
    missions.reduce((total, m) => total + m.difficulty * 10, 0);

  const allCompleted = challenge?.missions?.every((m) => m.status === "completed");

  const handleAceptarRetoFinalizado = async () => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/retos/${challenge?.id}/finalizar`, { method: "POST" });
      if (!res.ok) throw new Error("No se pudo finalizar el reto");
      setChallenge(null);
    } catch (err) {
      Alert.alert("Error", "No se pudo finalizar el reto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDescartarReto = async () => {
    Alert.alert(
      "¿Seguro que quieres descartar este reto?",
      "Se eliminarán todas las misiones asociadas.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiFetch(`/retos/${challenge?.id}/descartar`, { method: "POST" });
              if (!res.ok) throw new Error("No se pudo descartar el reto");
              setChallenge(null);
            } catch (err) {
              Alert.alert("Error", "No se pudo descartar el reto");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePress = (mission: Mission) => {
    router.push({
      pathname: "/(tabs)/reto/detalleMisionReto",
      params: {
        missionId: mission.id.toString(),
        title: mission.title,
      },
    });
  };

  const renderMission = (mission: Mission, index: number) => {
    const isCompleted = mission.status === "completed";
    const date = isCompleted ? mission.completed_at ?? mission.created_at : mission.created_at;

    return (
      <View key={mission.id} className="mb-4">
        <View className="bg-gray-300 p-3 rounded-xl">
          <TouchableOpacity
            onPress={() => handlePress(mission)}
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
                  Misión {index + 1}: {mission.title}
                </Text>
                <Text className="text-black text-sm mt-1">🎯 Dificultad: {mission.difficulty}</Text>
                <Text className="text-black text-sm">⭐ Puntos: {mission.difficulty * 10}</Text>
                <Text className="text-xs text-gray-500 mt-1 italic">
                  {isCompleted
                    ? `Completada el ${new Date(date).toLocaleDateString("es-ES")}`
                    : `Pendiente desde el ${new Date(date).toLocaleDateString("es-ES")}`}
                </Text>
                <View className="mt-2 flex-row items-center">
                  <Text
                    className={`text-xs mr-1 ${isCompleted ? "text-green-600" : "text-yellow-600"}`}
                  >
                    Estado: {isCompleted ? "Completada" : "Pendiente"}
                  </Text>
                  <Ionicons
                    name={isCompleted ? "checkmark-circle" : "hourglass"}
                    size={14}
                    color={isCompleted ? "#699D81" : "#FACC15"}
                  />
                </View>
              </View>
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
        {loading ? (
          <ActivityIndicator size="large" color="black" />
        ) : !challenge ? (
          <Text className="text-black font-bold text-lg text-center mt-10">
            🛑 No hay ningún reto activo actualmente.
          </Text>
        ) : (
          <>
            {allCompleted && (
              <View className="bg-white/90 p-6 rounded-2xl shadow-md mb-6">
                <Text className="text-black font-bold text-xl mb-2 text-center">
                  🎉 ¡Reto completado!
                </Text>
                <Text className="text-black text-base text-center mb-4">
                  Has ganado {" "}
                  <Text className="font-bold text-green-700">
                    {getPoints(challenge.missions)} puntos
                  </Text>
                  . ¡Gran trabajo!
                </Text>
                <TouchableOpacity
                  onPress={handleAceptarRetoFinalizado}
                  className="bg-green-600 py-3 rounded-xl"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-bold">Aceptar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <Text className="text-black font-bold text-xl mb-4">🧩 Misiones del reto</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
              {challenge.missions.map((m, i) => renderMission(m, i))}
            </ScrollView>
            <TouchableOpacity
              onPress={handleDescartarReto}
              className="bg-red-600 py-3 px-4 rounded-xl mt-4"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-bold">Descartar reto</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ImageBackground>
  );
}

