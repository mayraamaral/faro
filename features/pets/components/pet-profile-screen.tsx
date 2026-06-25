import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useToggleFavorite } from "@/features/favorites/hooks/use-toggle-favorite";
import { formatPetAgeLabel } from "../utils/format-pet-age-label";

type PetProfileData = {
  id: string;
  name: string;
  species: string;
  sex: string;
  size: string;
  birthDate: string;
  city: string;
  state: string;
  distanceKm: number;
  photoUrl: string | null;
  healthNotes: string | null;
  behaviorNotes: string | null;
  interestingFacts: string | null;
  isVaccinated: boolean | null;
  isNeutered: boolean | null;
};

type PetProfileScreenProps = {
  animal: PetProfileData | null;
};

const detailFallbackByKey = {
  healthNotes: "Sem observações de saúde informadas.",
  behaviorNotes: "Comportamento ainda não informado.",
  interestingFacts: "Pronto para encontrar uma nova família.",
} as const;

const labelBySpecies: Record<string, string> = {
  DOG: "Cachorro",
  CAT: "Gato",
  BIRD: "Pássaro",
  RABBIT: "Coelho",
  OTHER: "Pet",
};

const labelBySize: Record<string, string> = {
  SMALL: "porte pequeno",
  MEDIUM: "porte médio",
  LARGE: "porte grande",
};

const labelBySex: Record<string, string> = {
  MALE: "macho",
  FEMALE: "fêmea",
  UNKNOWN: "sexo não informado",
};

const formatBooleanDetail = (value: boolean | null, positive: string, negative: string) => {
  if (value === null) return null;

  return value ? positive : negative;
};

const buildAboutItems = (animal: PetProfileData) => {
  const species = labelBySpecies[animal.species] ?? "Pet";
  const size = labelBySize[animal.size] ?? "porte não informado";
  const sex = labelBySex[animal.sex] ?? "sexo não informado";
  const roundedDistance = Math.max(1, Math.round(animal.distanceKm));
  const vaccinatedLabel = formatBooleanDetail(
    animal.isVaccinated,
    "Vacinas em dia",
    "Vacinação não confirmada"
  );
  const neuteredLabel = formatBooleanDetail(
    animal.isNeutered,
    "Castrado",
    "Ainda não castrado"
  );

  return [
    `${species}, ${sex}, ${size}`,
    `A ${roundedDistance} km de distância`,
    animal.healthNotes ?? detailFallbackByKey.healthNotes,
    animal.behaviorNotes ?? detailFallbackByKey.behaviorNotes,
    animal.interestingFacts ?? detailFallbackByKey.interestingFacts,
    vaccinatedLabel,
    neuteredLabel,
  ].filter((item): item is string => Boolean(item));
};

export function PetProfileScreen({ animal }: PetProfileScreenProps) {
  const router = useRouter();

  if (!animal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Pet não encontrado</Text>
          <Text style={styles.emptyDescription}>
            Volte para a busca e selecione um pet para ver o perfil completo.
          </Text>
          <Button
            label="VOLTAR"
            onPress={() => router.back()}
            variant="primary"
            containerStyle={styles.backButton}
            labelStyle={styles.secondaryButtonLabel}
          />
        </View>
      </SafeAreaView>
    );
  }

  const aboutItems = buildAboutItems(animal);
  const ageLabel = formatPetAgeLabel(animal.birthDate);

  const { isFavorited, isToggling, toggle } = useToggleFavorite(animal.id);

  const showInterestConfirmation = () => {
    Alert.alert(
      "Interesse registrado",
      `Que bom que você quer conhecer ${animal.name}! Em breve o responsável pelo pet poderá receber seu interesse.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil de {animal.name}</Text>
          <Pressable
            style={styles.favoriteButton}
            onPress={toggle}
            disabled={isToggling}
            accessibilityLabel={
              isFavorited
                ? `Remover ${animal.name} dos favoritos`
                : `Adicionar ${animal.name} aos favoritos`
            }
          >
            <MaterialCommunityIcons
              name={isFavorited ? "heart" : "heart-outline"}
              size={28}
              color={
                isFavorited
                  ? tokens.colors.red[500]
                  : tokens.colors.gray[400]
              }
            />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.heroImageContainer}>
            {animal.photoUrl ? (
              <>
                <Image
                  source={{ uri: animal.photoUrl }}
                  style={styles.heroImageBackdrop}
                  resizeMode="cover"
                  blurRadius={18}
                />
                <Image
                  source={{ uri: animal.photoUrl }}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </>
            ) : (
              <View style={styles.heroPlaceholder}>
                <MaterialCommunityIcons
                  name="paw"
                  size={72}
                  color={tokens.colors.white}
                />
              </View>
            )}

            <View style={styles.nameBadge}>
              <Text style={styles.nameBadgeText}>
                {animal.name}, {ageLabel}
              </Text>
            </View>
          </View>

          <View style={styles.aboutPanel}>
            <Text style={styles.aboutTitle}>Sobre {animal.name}:</Text>
            {aboutItems.map((item) => (
              <View key={item} style={styles.aboutItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.aboutText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label="QUERO CONHECER"
            onPress={showInterestConfirmation}
            variant="primary"
            size="md"
            fullWidth={false}
            uppercase={false}
            containerStyle={styles.interestButton}
            labelStyle={styles.primaryButtonLabel}
            accessibilityLabel={`Demonstrar interesse em conhecer ${animal.name}`}
          />
          <Button
            label="VOLTAR"
            onPress={() => router.back()}
            variant="primary"
            size="md"
            fullWidth={false}
            uppercase={false}
            containerStyle={styles.backButton}
            labelStyle={styles.secondaryButtonLabel}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export type { PetProfileData };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: tokens.spacing[8],
    backgroundColor: tokens.colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[8],
    backgroundColor: tokens.colors.white,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.gray[100],
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.gray[800],
  },
  profileCard: {
    marginHorizontal: tokens.spacing[4],
    borderRadius: tokens.radius.md,
    overflow: "hidden",
    backgroundColor: tokens.colors.gray[800],
  },
  heroImageContainer: {
    minHeight: 280,
    backgroundColor: tokens.colors.gray[300],
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 320,
    position: "relative",
    zIndex: 1,
  },
  heroImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.08 }],
    zIndex: 0,
  },
  heroPlaceholder: {
    height: 320,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.brand.primary,
  },
  nameBadge: {
    position: "absolute",
    left: tokens.spacing[5],
    right: tokens.spacing[5],
    bottom: tokens.spacing[3],
    alignItems: "center",
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.brand.orange,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    elevation: 4,
    zIndex: 4,
  },
  nameBadgeText: {
    fontFamily: Fonts.secondary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
  aboutPanel: {
    gap: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[5],
    backgroundColor: tokens.colors.gray[800],
  },
  aboutTitle: {
    marginBottom: tokens.spacing[1],
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.white,
  },
  aboutItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing[2],
  },
  bullet: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.sm,
    color: tokens.colors.white,
  },
  aboutText: {
    flex: 1,
    fontFamily: Fonts.secondary,
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.sm,
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
  actions: {
    gap: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[6],
  },
  primaryButtonLabel: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
  },
  interestButton: {
    backgroundColor: tokens.colors.red[500],
  },
  backButton: {
    backgroundColor: tokens.colors.gray[400],
  },
  secondaryButtonLabel: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.white,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing[4],
    padding: tokens.spacing[6],
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  emptyDescription: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    lineHeight: tokens.lineHeight.base,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
});
