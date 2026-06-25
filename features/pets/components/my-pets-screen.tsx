import { Redirect, useRouter } from "expo-router";
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

import AddAnimalSvg from "@/assets/images/add-animal.svg";
import { LogoWordmark } from "@/components/ui/logo-wordmark";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import type { ListerAnimal } from "../domain/entities/lister-animal.entity";
import { useListerHome } from "../hooks/use-lister-home";

const SPECIES_MAP: Record<string, string> = {
  DOG: "Cachorro",
  CAT: "Gato",
  BIRD: "Pássaro",
  RABBIT: "Coelho",
  OTHER: "Outro",
};

const STATUS_MAP: Record<string, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  ADOPTED: "Adotado",
};

const statusBadgeStyle = (status: string) => {
  if (status === "AVAILABLE") return styles.statusBadgeAvailable;
  if (status === "RESERVED") return styles.statusBadgeReserved;
  if (status === "ADOPTED") return styles.statusBadgeAdopted;
  return styles.statusBadgeAvailable;
};

const statusTextStyle = (status: string) => {
  if (status === "AVAILABLE") return styles.statusTextAvailable;
  if (status === "RESERVED") return styles.statusTextReserved;
  if (status === "ADOPTED") return styles.statusTextAdopted;
  return styles.statusTextAvailable;
};

type MyPetCardProps = {
  animal: ListerAnimal;
  onEdit: (animalId: string) => void;
  onViewInterested: (animalId: string) => void;
};

function MyPetCard({ animal, onEdit, onViewInterested }: MyPetCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {animal.photoUrl ? (
          <Image
            source={{ uri: animal.photoUrl }}
            style={styles.photo}
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]} />
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {animal.name}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {SPECIES_MAP[animal.species] || animal.species} • {animal.age}
          </Text>
          <Text style={styles.cardLocation} numberOfLines={1}>
            {animal.city}, {animal.state}
          </Text>
          <View style={[styles.statusBadge, statusBadgeStyle(animal.adoptionStatus)]}>
            <Text
              style={[styles.statusText, statusTextStyle(animal.adoptionStatus)]}
            >
              {STATUS_MAP[animal.adoptionStatus] || animal.adoptionStatus}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => onEdit(animal.id)}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${animal.name}`}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.interestedButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => onViewInterested(animal.id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver interessados em ${animal.name}`}
        >
          <Text style={styles.interestedButtonText}>Ver interessados</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MyPetsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isLoading, isLister, hasAnimals, animals, refresh } = useListerHome();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator color={tokens.colors.brand.green} size="large" />
      </SafeAreaView>
    );
  }

  if (!isLister) {
    return <Redirect href="/find-pet" />;
  }

  const handleEdit = (animalId: string) => {
    router.push(`/my-pets/edit/${animalId}` as never);
  };

  const handleViewInterested = (animalId: string) => {
    router.push(`/my-pets/${animalId}/interested` as never);
  };

  const renderItem = ({ item }: { item: ListerAnimal }) => (
    <MyPetCard
      animal={item}
      onEdit={handleEdit}
      onViewInterested={handleViewInterested}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <LogoWordmark size="sm" />
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
      </View>

      <View style={styles.content}>
        {hasAnimals ? (
          <FlatList
            data={animals}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onRefresh={() => {
              void refresh();
            }}
            refreshing={isLoading}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.listTitle}>Meus pets</Text>
                  <Text style={styles.listSubtitle}>
                    {animals.length} {animals.length === 1 ? "pet cadastrado" : "pets cadastrados"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/add-animal" as never)}
                  style={styles.headerAddButton}
                  accessibilityRole="button"
                  accessibilityLabel="Cadastrar novo pet"
                >
                  <Text style={styles.headerAddButtonText}>+ Novo pet</Text>
                </Pressable>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateTextWrapper}>
              <Text style={styles.emptyTitle}>Você ainda não tem pets cadastrados.</Text>
              <Text style={styles.emptySubtitle}>
                Cadastre um pet para começar a receber propostas de adoção.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/add-animal" as never)}
              style={styles.addCard}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar pet"
            >
              <AddAnimalSvg width={52} height={52} />
              <Text style={styles.addCardText}>Cadastrar pet</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colors.brand.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  headerWrapper: {
    backgroundColor: tokens.colors.white,
  },
  header: {
    paddingVertical: tokens.spacing[4],
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoutButton: {
    position: "absolute",
    right: tokens.spacing[5],
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
  },
  logoutText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  listContainer: {
    padding: tokens.spacing[5],
    gap: tokens.spacing[4],
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing[2],
  },
  listTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  listSubtitle: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[500],
    marginTop: tokens.spacing[1],
  },
  headerAddButton: {
    backgroundColor: tokens.colors.brand.green,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.full,
  },
  headerAddButtonText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    gap: tokens.spacing[4],
    alignItems: "flex-start",
  },
  photoWrapper: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.gray[100],
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.gray[100],
  },
  photoPlaceholder: {
    backgroundColor: tokens.colors.gray[200],
  },
  cardInfo: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  cardName: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.gray[900],
  },
  cardMeta: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  cardLocation: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.gray[500],
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
    marginTop: tokens.spacing[1],
  },
  statusBadgeAvailable: {
    backgroundColor: `${tokens.colors.brand.green}1A`,
  },
  statusBadgeReserved: {
    backgroundColor: `${tokens.colors.brand.orange}1A`,
  },
  statusBadgeAdopted: {
    backgroundColor: `${tokens.colors.gray[500]}1A`,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xs,
    textTransform: "uppercase",
  },
  statusTextAvailable: {
    color: tokens.colors.brand.green,
  },
  statusTextReserved: {
    color: tokens.colors.brand.orange,
  },
  statusTextAdopted: {
    color: tokens.colors.gray[500],
  },
  actionRow: {
    flexDirection: "row",
    gap: tokens.spacing[3],
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: tokens.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing[3],
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  editButton: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.brand.primary,
  },
  editButtonText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.primary,
    textTransform: "uppercase",
  },
  interestedButton: {
    backgroundColor: tokens.colors.brand.primary,
  },
  interestedButtonText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing[5],
  },
  emptyStateTextWrapper: {
    alignItems: "center",
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[6],
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.gray[700],
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[500],
    textAlign: "center",
    maxWidth: 320,
  },
  addCard: {
    width: "85%",
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing[6],
    paddingHorizontal: tokens.spacing[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing[4],
  },
  addCardText: {
    fontFamily: Fonts.secondary,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.green,
    textTransform: "uppercase",
  },
});
