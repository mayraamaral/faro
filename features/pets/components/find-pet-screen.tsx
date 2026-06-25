import { useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeableCard, SwipeableCardRef } from "./swipeable-card";

import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/ui/top-bar";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import { AuthUserEntity } from "@/features/auth/domain/entities/auth-user.entity";
import { useChatIdentity } from "@/features/chat/hooks/use-chat-identity";
import { useFindPets } from "../hooks/use-find-pets";
import { useStartAdoption } from "../hooks/use-start-adoption";
import { formatPetAgeLabel } from "../utils/format-pet-age-label";

const ANIMAL_CARD_SCREEN_RATIO = 0.9;

export function FindPetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userInitial = AuthUserEntity.fromSupabase(user).initial;
  const { width } = useWindowDimensions();
  const animalCardSize = Math.round(width * ANIMAL_CARD_SCREEN_RATIO);

  const { isLoading, error, currentAnimal, handleAccept, handleReject, retry } =
    useFindPets();

  const identity = useChatIdentity();
  const startAdoption = useStartAdoption(identity);
  const [startError, setStartError] = useState<string | null>(null);
  const isStartingRef = useRef(false);

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

  const handleStartAdoption = useCallback(async () => {
    if (!currentAnimal) return;
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setStartError(null);
    try {
      const conversationId = await startAdoption.start(currentAnimal.id);
      if (conversationId) {
        handleAcceptRef.current();
        router.push(`/chat/${conversationId}` as never);
      } else if (startAdoption.error) {
        setStartError(startAdoption.error);
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [currentAnimal, startAdoption, router]);

  const handleStartAdoptionRef = useRef(handleStartAdoption);
  handleStartAdoptionRef.current = handleStartAdoption;

  const openCurrentAnimalProfile = useCallback(() => {
    if (!currentAnimal) return;

    router.push({
      pathname: "/pet-profile",
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
          currentAnimal.isVaccinated === null
            ? ""
            : String(currentAnimal.isVaccinated),
        isNeutered:
          currentAnimal.isNeutered === null
            ? ""
            : String(currentAnimal.isNeutered),
      },
    });
  }, [currentAnimal, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar
        userInitial={userInitial}
        onPressAvatar={() => router.push("/user-info" as never)}
        onPressSettings={() => router.push("/settings" as never)}
      />

      <View style={styles.content}>
        <View style={styles.stack}>
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
              onSwipeRight={() => {
                void handleStartAdoptionRef.current();
              }}
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
                      <View
                        style={styles.photoLoadingOverlay}
                        pointerEvents="none"
                      >
                        <ActivityIndicator
                          size="large"
                          color={tokens.colors.gray[500]}
                        />
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

          {/* Footer Actions */}
          {currentAnimal ? (
            <View style={styles.footer}>
              {startError ? (
                <Text style={styles.startError}>{startError}</Text>
              ) : null}
              <View style={styles.footerButtons}>
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
                  onPress={() => {
                    void handleStartAdoption();
                  }}
                  disabled={actionsDisabled || startAdoption.isStarting}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  stack: {
    alignItems: "center",
    gap: tokens.spacing[10],
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
    paddingTop: 0,
    paddingBottom: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[6],
    backgroundColor: tokens.colors.brand.background,
    gap: tokens.spacing[2],
  },
  footerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing[12],
  },
  startError: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.red[500],
    textAlign: "center",
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
