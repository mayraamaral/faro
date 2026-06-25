import { Redirect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAnimalDetail } from "../hooks/use-animal-detail";
import { useUpdateAnimal } from "../hooks/use-update-animal";
import type { CreateAnimalFormData } from "../schemas/create-animal.schema";
import {
  AnimalForm,
  type ExistingPhoto,
} from "./animal-form";

const formatCoordinate = (value: number): string =>
  value.toString().replace(".", ",");

const toInitialValues = (
  detail: NonNullable<ReturnType<typeof useAnimalDetail>["detail"]>,
): Partial<CreateAnimalFormData> & { photoUris: string[] } => ({
  name: detail.name,
  species: detail.species as CreateAnimalFormData["species"],
  sex: detail.sex as CreateAnimalFormData["sex"],
  size: detail.size as CreateAnimalFormData["size"],
  birthDate: detail.birthDate,
  latitude: formatCoordinate(detail.latitude),
  longitude: formatCoordinate(detail.longitude),
  city: detail.city,
  state: detail.state,
  country: detail.country,
  healthNotes: detail.healthNotes ?? "",
  behaviorNotes: detail.behaviorNotes ?? "",
  interestingFacts: detail.interestingFacts ?? "",
  isNeutered: detail.isNeutered,
  isVaccinated: detail.isVaccinated,
  photoUris: detail.existingPhotos.map((photo) => photo.signedUrl),
});

export function EditAnimalScreen() {
  const params = useLocalSearchParams<{ animal_id: string }>();
  const animalId = typeof params.animal_id === "string" ? params.animal_id : null;
  const { status, message, detail } = useAnimalDetail(animalId);
  const { handleUpdateAnimal, isLoading } = useUpdateAnimal("/my-pets");

  if (status === "loading" || (status === "ready" && !detail)) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator
            color={tokens.colors.brand.green}
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (status === "error" || !detail) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Não foi possível carregar o pet</Text>
          <Text style={styles.errorMessage}>
            {message ?? "Tente novamente em instantes."}
          </Text>
          <Redirect href="/my-pets" />
        </View>
      </SafeAreaView>
    );
  }

  const initialValues = toInitialValues(detail);
  const initialExistingPhotos: ExistingPhoto[] = detail.existingPhotos.map(
    (photo) => ({
      storagePath: photo.storagePath,
      signedUrl: photo.signedUrl,
    }),
  );

  return (
    <AnimalForm
      title="Editar pet"
      submitLabel="SALVAR ALTERAÇÕES"
      submittingLabel="SALVANDO..."
      isLoading={isLoading}
      initialValues={initialValues}
      initialExistingPhotos={initialExistingPhotos}
      onSubmit={async ({ data, keptExistingPhotoStoragePaths }) => {
        if (!animalId) return false;
        return handleUpdateAnimal(
          animalId,
          data,
          keptExistingPhotoStoragePaths,
        );
      }}
      cancelHref="/my-pets"
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  errorTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.brand.primary,
    textAlign: "center",
  },
  errorMessage: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
});
