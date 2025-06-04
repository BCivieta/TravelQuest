import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../../lib/api";
import { useFocusEffect } from "@react-navigation/native";

type Mission = {
  id: number;
  title: string;
  difficulty: number;
  description: string;
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

  useFocusEffect(
    useCallback(() => {
      fetchChallenge();
    }, [])
  );

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
              const res = await apiFetch("/retos/activo", { method: "DELETE" });
;
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
        description: mission.description,
        difficulty: mission.difficulty,
      },
    });
  };

  const handleCrearReto = () => {
    router.push("/(tabs)/reto/retoNumero");
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
        {/* Botón flotante arriba izquierda para descartar */}
        {challenge && (
          <TouchableOpacity
            onPress={handleDescartarReto}
            className="absolute top-10 right-4 mt-10 z-10 bg-red-600 px-3 py-2 rounded-xl shadow-md"
            disabled={actionLoading}
          >
            <Text className="text-white font-bold text-sm">Descartar reto</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="black" />
        ) : !challenge ? (
          <>
            <Text className="text-black font-bold text-lg text-center mt-10">
              🛑 No hay ningún reto activo actualmente.
            </Text>

            <TouchableOpacity
              onPress={handleCrearReto}
              className="bg-blue-600 py-4 px-6 rounded-xl mt-10 mx-auto"
            >
              <Text className="text-white font-bold text-lg text-center">➕ Crear nuevo reto</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {allCompleted && (
              <View className="bg-white/90 p-6 rounded-2xl shadow-md mb-6">
                <Text className="text-black font-bold text-xl mb-2 text-center">
                  🎉 ¡Reto completado!
                </Text>
                <Text className="text-black text-base text-center mb-4">
                  Has ganado{" "}
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
              <View className="bg-white/80 px-4 py-2 rounded-xl shadow-md self-start mb-10 flex-row items-center gap-2">
                  <Text className="text-black text-lg font-semibold">🧩 Misiones del reto</Text>
                  <Text className="text-black text-lg">🗺️</Text>
              </View>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
              {challenge.missions.map((m, i) => renderMission(m, i))}
            </ScrollView>
          </>
        )}
      </View>
    </ImageBackground>
  );
}
