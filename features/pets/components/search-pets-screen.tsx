import Slider from "@react-native-community/slider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/ui/top-bar";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import { AuthUserEntity } from "@/features/auth/domain/entities/auth-user.entity";
import {
  ANIMAL_SEARCH_RADIUS_MAX_KM,
  ANIMAL_SEARCH_RADIUS_MIN_KM,
  ANIMAL_SEARCH_RADIUS_STEP_KM,
  type AnimalAgeCategory,
  type AnimalCategory,
  type AnimalSearchOption,
  type AnimalSize,
} from "../domain/entities/animal-search-filter";
import type { AdopterAnimal } from "../domain/entities/adopter-animal.entity";
import { useSearchPets } from "../hooks/use-search-pets";
import { formatPetAgeLabel } from "../utils/format-pet-age-label";

type FilterSectionProps<TValue extends string> = {
  title: string;
  options: AnimalSearchOption<TValue>[];
  selectedValues: TValue[];
  onToggle: (value: TValue) => void;
};

function FilterSection<TValue extends string>({
  title,
  options,
  selectedValues,
  onToggle,
}: FilterSectionProps<TValue>) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipGrid}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onToggle(option.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SearchResultCard({ animal }: { animal: AdopterAnimal }) {
  const router = useRouter();

  const openProfile = () => {
    router.push({
      pathname: "/pet-profile",
      params: {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        sex: animal.sex,
        size: animal.size,
        birthDate: animal.birthDate,
        city: animal.city,
        state: animal.state,
        distanceKm: String(animal.distanceKm),
        photoUrl: animal.photoUrl ?? "",
        healthNotes: animal.healthNotes ?? "",
        behaviorNotes: animal.behaviorNotes ?? "",
        interestingFacts: animal.interestingFacts ?? "",
        isVaccinated: animal.isVaccinated === null ? "" : String(animal.isVaccinated),
        isNeutered: animal.isNeutered === null ? "" : String(animal.isNeutered),
      },
    });
  };

  return (
    <Pressable
      style={styles.resultCard}
      onPress={openProfile}
      accessibilityRole="button"
      accessibilityLabel={`Abrir perfil de ${animal.name}`}
    >
      {animal.photoUrl ? (
        <Image source={{ uri: animal.photoUrl }} style={styles.resultImage} resizeMode="cover" />
      ) : (
        <View style={styles.resultImagePlaceholder}>
          <MaterialCommunityIcons
            name="paw"
            size={32}
            color={tokens.colors.brand.primary}
          />
        </View>
      )}
      <View style={styles.resultBody}>
        <Text style={styles.resultName}>{animal.name}</Text>
        <Text style={styles.resultMeta}>
          {formatPetAgeLabel(animal.birthDate)} • {Math.max(1, Math.round(animal.distanceKm))} km
        </Text>
        <Text style={styles.resultLocation}>
          {animal.city}, {animal.state}
        </Text>
      </View>
    </Pressable>
  );
}

export function SearchPetsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userInitial = AuthUserEntity.fromSupabase(user).initial;
  const {
    options,
    filters,
    results,
    hasAppliedSearch,
    isLoadingOptions,
    isSearching,
    error,
    selectedFilterCount,
    setName,
    setRadiusKm,
    toggleCategory,
    toggleSize,
    toggleAgeCategory,
    clearFilters,
    applyFilters,
  } = useSearchPets();

  const resultLabel = results.length === 1 ? "pet encontrado" : "pets encontrados";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar
        userInitial={userInitial}
        onPressAvatar={() => router.push("/user-info" as never)}
        onPressSettings={() => router.push("/settings" as never)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.panel}>
          {isLoadingOptions ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={tokens.colors.brand.primary} size="large" />
              <Text style={styles.helperText}>Carregando filtros...</Text>
            </View>
          ) : (
            <>
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Nome:</Text>
                <View style={styles.nameInputWrapper}>
                  <TextInput
                    value={filters.name}
                    onChangeText={setName}
                    placeholder="Buscar por nome"
                    placeholderTextColor={tokens.colors.gray[500]}
                    style={styles.nameInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={() => {
                      void applyFilters();
                    }}
                    accessibilityLabel="Nome do pet"
                  />
                  <Pressable
                    onPress={() => {
                      void applyFilters();
                    }}
                    disabled={isLoadingOptions || isSearching}
                    style={({ pressed }) => [
                      styles.nameInputIcon,
                      pressed && !isSearching ? styles.nameInputIconPressed : undefined,
                      isSearching ? styles.nameInputIconDisabled : undefined,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Buscar por nome"
                  >
                    <MaterialCommunityIcons
                      name="magnify"
                      size={22}
                      color={tokens.colors.white}
                    />
                  </Pressable>
                </View>
              </View>

              <FilterSection<AnimalAgeCategory>
                title="Idade:"
                options={options.ageCategories}
                selectedValues={filters.ageCategories}
                onToggle={toggleAgeCategory}
              />
              <FilterSection<AnimalSize>
                title="Porte:"
                options={options.sizes}
                selectedValues={filters.sizes}
                onToggle={toggleSize}
              />
              <FilterSection<AnimalCategory>
                title="Animal:"
                options={options.categories}
                selectedValues={filters.categories}
                onToggle={toggleCategory}
              />

              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Distância:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={ANIMAL_SEARCH_RADIUS_MIN_KM}
                  maximumValue={ANIMAL_SEARCH_RADIUS_MAX_KM}
                  step={ANIMAL_SEARCH_RADIUS_STEP_KM}
                  value={filters.radiusKm}
                  onValueChange={setRadiusKm}
                  minimumTrackTintColor={tokens.colors.brand.primary}
                  maximumTrackTintColor={tokens.colors.gray[300]}
                  thumbTintColor={tokens.colors.brand.primary}
                  accessibilityLabel="Distância em quilômetros"
                />
                <Text style={styles.radiusLabel}>Até {filters.radiusKm}km</Text>
              </View>
            </>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button
            label="Limpar"
            onPress={clearFilters}
            disabled={isLoadingOptions || isSearching}
            variant="tertiary"
            size="sm"
            fullWidth={false}
            containerStyle={styles.secondaryActionButton}
            labelStyle={styles.secondaryActionLabel}
          />
          <Button
            label={isSearching ? "Buscando..." : "Aplicar"}
            onPress={() => {
              void applyFilters();
            }}
            disabled={isLoadingOptions || isSearching}
            variant="primary"
            size="sm"
            fullWidth={false}
            containerStyle={styles.primaryActionButton}
          />
        </View>

        <View style={styles.resultsSection}>
          {!hasAppliedSearch ? null : isSearching ? (
            <ActivityIndicator color={tokens.colors.brand.primary} size="large" />
          ) : results.length === 0 ? (
            <Text style={styles.helperText}>Nenhum pet encontrado com esses filtros.</Text>
          ) : (
            <>
              <Text style={styles.resultsTitle}>Resultado da busca</Text>
              <View style={styles.resultsList}>
                <Text style={styles.resultCount}>
                  {results.length} {resultLabel}
                  {selectedFilterCount > 0 ? ` • ${selectedFilterCount} filtro(s)` : ""}
                </Text>
                {results.map((animal) => (
                  <SearchResultCard key={animal.id} animal={animal} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  content: {
    paddingHorizontal: tokens.spacing[6],
    paddingTop: tokens.spacing[6],
    paddingBottom: tokens.spacing[16],
    gap: tokens.spacing[5],
  },
  panel: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[5],
    gap: tokens.spacing[5],
  },
  loadingState: {
    alignItems: "center",
    gap: tokens.spacing[3],
    paddingVertical: tokens.spacing[8],
  },
  filterSection: {
    gap: tokens.spacing[3],
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.brand.primary,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing[2],
  },
  chip: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    backgroundColor: tokens.colors.gray[50],
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
  },
  chipSelected: {
    borderColor: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.brand.primary,
  },
  chipText: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[700],
  },
  chipTextSelected: {
    color: tokens.colors.white,
  },
  nameInputWrapper: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: tokens.spacing[2],
  },
  nameInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    backgroundColor: tokens.colors.gray[100],
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[800],
  },
  nameInputIcon: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.brand.primary,
  },
  nameInputIconPressed: {
    opacity: 0.8,
  },
  nameInputIconDisabled: {
    opacity: 0.5,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  radiusLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[700],
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    gap: tokens.spacing[3],
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
  },
  secondaryActionLabel: {
    color: tokens.colors.brand.primary,
  },
  primaryActionButton: {
    flex: 1,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.red[500],
    textAlign: "center",
  },
  resultsSection: {
    gap: tokens.spacing[3],
  },
  resultsTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.brand.primary,
  },
  helperText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
  resultsList: {
    gap: tokens.spacing[3],
  },
  resultCount: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
  },
  resultImage: {
    width: 96,
    alignSelf: "stretch",
  },
  resultImagePlaceholder: {
    width: 96,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.gray[200],
  },
  resultBody: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.spacing[4],
    gap: tokens.spacing[1],
  },
  resultName: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.brand.primary,
    textTransform: "uppercase",
  },
  resultMeta: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.orange,
  },
  resultLocation: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
});
