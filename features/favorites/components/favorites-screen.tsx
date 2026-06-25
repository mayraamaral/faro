import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/ui/top-bar";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import { AuthUserEntity } from "@/features/auth/domain/entities/auth-user.entity";
import type { FavoriteAnimal } from "../domain/entities/favorite-animal.entity";
import { useFavorites } from "../hooks/use-favorites";

const speciesLabel: Record<string, string> = {
  DOG: "Cão",
  CAT: "Gato",
  BIRD: "Pássaro",
  RABBIT: "Coelho",
  OTHER: "Pet",
};

function AnimalCard({ animal }: { animal: FavoriteAnimal }) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/pet-profile" as never,
      params: {
        id: animal.animalId,
        name: animal.name,
        species: animal.species,
        sex: "",
        size: "",
        birthDate: animal.favoritedAt,
        city: animal.city ?? "",
        state: animal.state ?? "",
        distanceKm: "0",
        photoUrl: animal.photoUrl ?? "",
      },
    });
  };

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}
    >
      <View style={styles.cardImageContainer}>
        {animal.photoUrl ? (
          <Image
            source={{ uri: animal.photoUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <MaterialCommunityIcons
              name="paw"
              size={40}
              color={tokens.colors.white}
            />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardSpecies} numberOfLines={1}>
          {speciesLabel[animal.species] ?? animal.species}
        </Text>
        <Text style={styles.cardName} numberOfLines={1}>
          {animal.name}
        </Text>
        {(animal.city || animal.state) ? (
          <Text style={styles.cardLocation} numberOfLines={1}>
            {[animal.city, animal.state]
              .filter(Boolean)
              .join(", ")}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userInitial = AuthUserEntity.fromSupabase(user).initial;
  const result = useFavorites();

  const favorites = result.status === "ready" ? result.favorites : [];
  const errorMessage = result.status === "error" ? result.message : null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafeArea} edges={["top"]}>
        <TopBar
          userInitial={userInitial}
          onPressSettings={() => router.push("/settings" as never)}
          hideAvatar
        />
      </SafeAreaView>
      <SafeAreaView style={styles.bodySafeArea} edges={["bottom"]}>
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.animalId}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={
            favorites.length > 1 ? styles.columnWrapper : undefined
          }
          renderItem={({ item }) => <AnimalCard animal={item} />}
          refreshing={result.status === "loading"}
          onRefresh={result.refresh}
          ListHeaderComponent={
            <Text style={styles.title}>Seus favoritos</Text>
          }
          ListEmptyComponent={
            result.status === "loading" ? (
              <View style={styles.centered}>
                <ActivityIndicator
                  color={tokens.colors.brand.primary}
                  size="large"
                />
              </View>
            ) : result.status === "error" ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Button
                  label="TENTAR NOVAMENTE"
                  variant="primary"
                  onPress={result.refresh}
                  containerStyle={styles.retryButton}
                />
              </View>
            ) : (
              <View style={styles.centered}>
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={64}
                  color={tokens.colors.gray[400]}
                />
                <Text style={styles.emptyTitle}>
                  Nenhum pet favoritado ainda
                </Text>
                <Text style={styles.emptySubtitle}>
                  Explore o feed e favorite os pets que{"\n"}
                  você mais gostar para encontrá-los depois.
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const CARD_GAP = tokens.spacing[3];
const CARD_WIDTH = "47%" as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  topSafeArea: {
    backgroundColor: tokens.colors.white,
  },
  bodySafeArea: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  listContent: {
    padding: tokens.spacing[4],
    flexGrow: 1,
  },
  columnWrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.gray[900],
    marginBottom: tokens.spacing[5],
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: tokens.colors.gray[200],
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: tokens.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: tokens.spacing[3],
    gap: tokens.spacing[1],
  },
  cardSpecies: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.brand.secondary,
    textTransform: "uppercase",
  },
  cardName: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
  },
  cardLocation: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.gray[500],
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: tokens.spacing[16],
    paddingHorizontal: tokens.spacing[6],
  },
  errorText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.red[500],
    textAlign: "center",
    marginBottom: tokens.spacing[4],
  },
  retryButton: {
    marginTop: tokens.spacing[2],
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.gray[600],
    textAlign: "center",
    marginTop: tokens.spacing[4],
  },
  emptySubtitle: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[400],
    textAlign: "center",
    marginTop: tokens.spacing[2],
    lineHeight: tokens.lineHeight.sm,
  },
});
