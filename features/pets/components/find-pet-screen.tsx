import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SwipeableCard, SwipeableCardRef } from "./swipeable-card";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import { useFindPets } from "../hooks/use-find-pets";
import { formatPetAgeLabel } from "../utils/format-pet-age-label";

const ANIMAL_CARD_SCREEN_RATIO = 0.9;
const SWIPE_DURATION_MS = 320;
const SWIPE_ROTATION_DEG = 14;

export function FindPetScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const animalCardSize = Math.round(width * ANIMAL_CARD_SCREEN_RATIO);
  const swipeDistance = Math.max(width, animalCardSize) * 1.35;

  const { isLoading, error, currentAnimal, handleAccept, handleReject, retry } =
    useFindPets();

  const cardRef = useRef<SwipeableCardRef>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const handleAcceptRef = useRef(handleAccept);
  const handleRejectRef = useRef(handleReject);

  handleAcceptRef.current = handleAccept;
  handleRejectRef.current = handleReject;

  useLayoutEffect(() => {
    if (!currentAnimal) {
      setIsPhotoLoading(false);
      return;
    }
    setIsPhotoLoading(Boolean(currentAnimal.photoUrl));
  }, [currentAnimal]);

  const actionsDisabled = isLoading || !currentAnimal;

  const openCurrentAnimalProfile = useCallback(() => {
    if (!currentAnimal) return;

    router.push({
      pathname: "./pet-profile",
      params: {
        id: currentAnimal.id,
        name: currentAnimal.name,
        species: currentAnimal.species,
        sex: currentAnimal.sex,
        size: currentAnimal.size,
        birthDate: currentAnimal.birthDate,
        city: currentAnimal.city,
        state: currentAnimal.state,
        distanceKm: String(currentAnimal.distanceKm),
        photoUrl: currentAnimal.photoUrl ?? "",
        healthNotes: currentAnimal.healthNotes ?? "",
        behaviorNotes: currentAnimal.behaviorNotes ?? "",
        interestingFacts: currentAnimal.interestingFacts ?? "",
        isVaccinated:
          currentAnimal.isVaccinated === null ? "" : String(currentAnimal.isVaccinated),
        isNeutered:
          currentAnimal.isNeutered === null ? "" : String(currentAnimal.isNeutered),
      },
    });
  }, [currentAnimal, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={tokens.colors.brand.orange}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Encontre seu pet</Text>
        <Pressable
          onPress={() => {
            void logout();
          }}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Sair"
        >
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={tokens.colors.brand.green} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <Button
              label="Tentar novamente"
              onPress={retry}
              variant="primary"
            />
          </View>
        ) : !currentAnimal ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Não há mais pets na sua região no momento.
            </Text>
            <Button label="Atualizar" onPress={retry} variant="primary" />
          </View>
        ) : (
          <SwipeableCard
            key={currentAnimal.id}
            ref={cardRef}
            onSwipeLeft={() => handleRejectRef.current()}
            onSwipeRight={() => handleAcceptRef.current()}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${currentAnimal.name}`}
              onPress={openCurrentAnimalProfile}
              style={[
                styles.card,
                { width: animalCardSize, height: animalCardSize },
              ]}
            >
              {currentAnimal.photoUrl ? (
                <>
                  <Image
                    key={`${currentAnimal.id}-${currentAnimal.photoUrl}-backdrop`}
                    source={{ uri: currentAnimal.photoUrl }}
                    style={styles.animalImageBackdrop}
                    resizeMode="cover"
                    blurRadius={18}
                  />
                  <Image
                    key={`${currentAnimal.id}-${currentAnimal.photoUrl}`}
                    source={{ uri: currentAnimal.photoUrl }}
                    style={[
                      styles.animalImage,
                      isPhotoLoading && styles.animalImageHidden,
                    ]}
                    resizeMode="contain"
                    onLoadEnd={() => setIsPhotoLoading(false)}
                    onError={() => setIsPhotoLoading(false)}
                  />
                  {isPhotoLoading ? (
                    <View style={styles.photoLoadingOverlay} pointerEvents="none">
                      <ActivityIndicator size="large" color={tokens.colors.gray[500]} />
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.animalImagePlaceholder} />
              )}

              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {currentAnimal.name.toUpperCase()},{" "}
                  {formatPetAgeLabel(currentAnimal.birthDate)} •{" "}
                  {Math.max(1, Math.round(currentAnimal.distanceKm))} KM
                </Text>
              </View>
            </Pressable>
          </SwipeableCard>
        )}
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          variant="icon"
          iconName="close"
          size="lg"
          shape="rounded"
          containerStyle={[styles.actionButton, styles.rejectButton]}
          iconColor={tokens.colors.white}
          onPress={() => cardRef.current?.swipeLeft()}
          disabled={actionsDisabled}
        />
        <Button
          variant="icon"
          iconName="heart"
          size="lg"
          shape="rounded"
          containerStyle={[styles.actionButton, styles.acceptButton]}
          iconColor={tokens.colors.white}
          onPress={() => cardRef.current?.swipeRight()}
          disabled={actionsDisabled}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.white,
  },
  backButton: {
    padding: tokens.spacing[2],
    marginLeft: -tokens.spacing[2],
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  logoutButton: {
    minWidth: 28 + tokens.spacing[2] * 2,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing[2],
  },
  logoutText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
    paddingVertical: tokens.spacing[10],
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  card: {
    backgroundColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.xl,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  animalImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 1,
  },
  animalImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.08 }],
    zIndex: 0,
  },
  animalImageHidden: {
    opacity: 0,
  },
  photoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colors.white,
  },
  animalImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: tokens.colors.gray[300],
    position: "absolute",
  },
  badgeContainer: {
    position: "absolute",
    bottom: tokens.spacing[4],
    backgroundColor: tokens.colors.brand.orange,
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.radius.sm,
    elevation: 4,
    zIndex: 4,
  },
  badgeText: {
    fontFamily: Fonts.secondary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: tokens.spacing[12],
    paddingHorizontal: tokens.spacing[6],
    backgroundColor: tokens.colors.white,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.xl,
  },
  rejectButton: {
    backgroundColor: tokens.colors.gray[400],
  },
  acceptButton: {
    backgroundColor: tokens.colors.red[500],
  },
});
