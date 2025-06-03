import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../../lib/api";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";

export default function DetalleMisionReto() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams();
  const numericMissionId = Number(missionId);

  const [mission, setMission] = useState<null | {
    title: string;
    description: string;
    difficulty: number;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // 🧹 Limpiar imagen cada vez que entras a la pantalla
  useEffect(() => {
    setImageUri(null);
  }, [numericMissionId]);

  useEffect(() => {
    const fetchMission = async () => {
      try {
        const res = await apiFetch(`/misiones/${numericMissionId}`);
        if (!res.ok) throw new Error("No se pudo obtener la misión");
        const data = await res.json();
        setMission(data);
      } catch (err: unknown) {
        console.error("❌ Error al cargar misión:", err);
        Alert.alert("Error", "No se pudo cargar la misión");
      } finally {
        setLoading(false);
      }
    };
    fetchMission();
  }, [numericMissionId]);

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert("Misión vacía", "Agrega al menos una imagen para completar la misión.");
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await apiFetch(`/misiones/${missionId}/validate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUri }),
      });

      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Imagen no válida", err.message || "La imagen no es adecuada para esta misión.");
        return;
      }

      const update = await apiFetch(`/misiones/usuario/${numericMissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
          image_url: imageUri,
        }),
      });

      if (!update.ok) throw new Error("Error al guardar la misión");

      router.push({
        pathname: "/misiones/completadaMision",
        params: {
          missionId: numericMissionId.toString(),
          difficulty: mission?.difficulty?.toString(),
        },
      });
    } catch (err) {
      Alert.alert("Error", "No se pudo completar la misión.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "No se puede acceder a la cámara.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/fondo.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View className="flex-1 pt-10 px-4">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/reto/retoGenerado")}
          className="absolute top-10 left-4 z-10 bg-white/70 rounded-full p-2 shadow-md"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 100 }} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="bg-white/80 p-4 mt-16 rounded-2xl shadow-md mb-4">
              <Text className="text-black font-bold text-xl text-center">
                🧭 {mission?.title ?? "Misión sin título"}
              </Text>
            </View>

            <View className="bg-white/80 p-4 rounded-2xl shadow-md mb-8">
              <Text className="text-black text-base leading-relaxed">
                {mission?.description ?? "Descripción no disponible"}
              </Text>
            </View>

            <View className="bg-white/80 rounded-2xl shadow-xl items-center justify-center p-6 mb-10">
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: 140, height: 140, marginBottom: 10, borderRadius: 12 }}
                />
              ) : (
                <Text className="text-4xl mb-4">📷</Text>
              )}

              <View className="flex-row space-x-4">
                <TouchableOpacity
                  className="bg-white/90 px-4 py-3 rounded-2xl shadow-md"
                  onPress={handleTakePhoto}
                >
                  <Text className="text-black font-semibold">Tomar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white/90 px-4 py-3 rounded-2xl shadow-md"
                  onPress={handlePickImage}
                >
                  <Text className="text-black font-semibold">Subir imagen</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="bg-green-600 px-6 py-4 rounded-2xl shadow-md mb-10 flex-row items-center justify-center"
              onPress={handleSubmit}
              disabled={loadingSubmit}
            >
              {loadingSubmit ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">✅ Enviar misión</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
}
