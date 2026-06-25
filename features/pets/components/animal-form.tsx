import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm, useWatch, type Control, type FieldErrors, type UseFormSetValue, type UseFormTrigger } from "react-hook-form";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { LogoWordmark } from "@/components/ui/logo-wordmark";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import {
  AnimalPhotoPickerError,
  useAnimalPhotoPicker,
} from "../hooks/use-animal-photo-picker";
import { useDeviceLocation } from "../hooks/use-device-location";
import { DeviceLocationError } from "../infrastructure/device-location.service";
import {
  createAnimalSchema,
  MAX_ANIMAL_PHOTOS,
  type CreateAnimalFormData,
} from "../schemas/create-animal.schema";

const SPECIES_OPTIONS = [
  { value: "DOG", label: "Cachorro" },
  { value: "CAT", label: "Gato" },
  { value: "BIRD", label: "Pássaro" },
  { value: "RABBIT", label: "Coelho" },
  { value: "OTHER", label: "Outro" },
] as const;

const SIZE_OPTIONS = [
  { value: "SMALL", label: "Pequeno" },
  { value: "MEDIUM", label: "Médio" },
  { value: "LARGE", label: "Grande" },
] as const;

const SEX_OPTIONS = [
  { value: "MALE", label: "Macho" },
  { value: "FEMALE", label: "Fêmea" },
  { value: "UNKNOWN", label: "Não sei" },
] as const;

const EMPTY_DEFAULTS: CreateAnimalFormData = {
  photoUris: [],
  name: "",
  species: "DOG",
  birthDate: "",
  latitude: "",
  longitude: "",
  city: "",
  state: "",
  country: "",
  healthNotes: "",
  behaviorNotes: "",
  interestingFacts: "",
  size: "MEDIUM",
  sex: "UNKNOWN",
  isNeutered: false,
  isVaccinated: false,
};

export type ExistingPhoto = {
  storagePath: string;
  signedUrl: string;
};

export type AnimalFormSubmitPayload = {
  data: CreateAnimalFormData;
  keptExistingPhotoStoragePaths: string[];
};

type AnimalFormProps = {
  title: string;
  submitLabel: string;
  submittingLabel: string;
  isLoading: boolean;
  initialValues?: Partial<CreateAnimalFormData>;
  initialExistingPhotos?: ExistingPhoto[];
  onSubmit: (payload: AnimalFormSubmitPayload) => Promise<boolean> | boolean;
  cancelHref: string;
};

export function AnimalForm({
  title,
  submitLabel,
  submittingLabel,
  isLoading,
  initialValues,
  initialExistingPhotos = [],
  onSubmit,
  cancelHref,
}: AnimalFormProps) {
  const router = useRouter();
  const { isPickingPhoto, pickPhotoFromLibrary } = useAnimalPhotoPicker();
  const { isResolvingLocation, resolveCurrentLocation } = useDeviceLocation();

  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(
    initialExistingPhotos,
  );
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>(
    () => initialValues?.photoUris ?? [],
  );

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateAnimalFormData>({
    resolver: zodResolver(createAnimalSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...initialValues },
  });

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [pendingBirthDate, setPendingBirthDate] = useState<Date>(new Date());
  const photoUrisValue = useWatch({ control, name: "photoUris" }) || [];
  const birthDateValue = useWatch({ control, name: "birthDate" });
  const cityValue = useWatch({ control, name: "city" });
  const stateValue = useWatch({ control, name: "state" });
  const countryValue = useWatch({ control, name: "country" });

  const totalPhotos = existingPhotos.length + newPhotoUris.length;
  const photoPreviewEntries: Array<{
    kind: "existing" | "new";
    index: number;
    uri: string;
  }> = [
    ...existingPhotos.map((photo, index) => ({
      kind: "existing" as const,
      index,
      uri: photo.signedUrl,
    })),
    ...newPhotoUris.map((uri, index) => ({
      kind: "new" as const,
      index,
      uri,
    })),
  ];

  const syncPhotoUrisField = useCallback(
    (nextExisting: ExistingPhoto[], nextNew: string[]) => {
      const displayUris = [
        ...nextExisting.map((photo) => photo.signedUrl),
        ...nextNew,
      ];
      setValue("photoUris", displayUris, {
        shouldDirty: true,
        shouldValidate: true,
      });
      void trigger("photoUris");
    },
    [setValue, trigger],
  );

  const getCurrentBirthDateValue = () =>
    birthDateValue ? new Date(`${birthDateValue}T00:00:00`) : new Date();

  const getBirthDateDisplayValue = (rawBirthDate: string) => {
    const [year, month, day] = rawBirthDate.split("-");
    if (!year || !month || !day) return rawBirthDate;
    return `${day}/${month}/${year}`;
  };

  const applyBirthDateValue = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    setValue("birthDate", `${year}-${month}-${day}`, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleDateValueChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) return;
    setPendingBirthDate(selectedDate);
  };

  const openBirthDatePicker = () => {
    setPendingBirthDate(getCurrentBirthDateValue());
    setIsDatePickerVisible(true);
  };

  const confirmBirthDate = () => {
    applyBirthDateValue(pendingBirthDate);
    setIsDatePickerVisible(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      const location = await resolveCurrentLocation();

      setValue("latitude", location.latitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("longitude", location.longitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("city", location.city, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("state", location.state, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("country", location.country, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (!location.hasCompleteAddress) {
        Alert.alert(
          "Endereço incompleto",
          "Não foi possível identificar cidade, estado e país completos com a localização atual. Tente novamente em uma área com melhor precisão.",
        );
      }

      await trigger(["latitude", "longitude", "city", "state", "country"]);
    } catch (error) {
      if (
        error instanceof DeviceLocationError &&
        error.code === "PERMISSION_DENIED"
      ) {
        Alert.alert(
          "Permissão necessária",
          "Permita acesso à localização para preencher latitude e longitude.",
        );
        return;
      }
      Alert.alert(
        "Não foi possível obter localização",
        "Verifique as permissões do dispositivo e tente novamente.",
      );
    }
  };

  const handlePickPhoto = async () => {
    try {
      const remainingSlots = MAX_ANIMAL_PHOTOS - totalPhotos;
      if (remainingSlots <= 0) return;

      const result = await pickPhotoFromLibrary(remainingSlots);

      if (!result.uris.length) {
        return;
      }

      const nextNew = [...newPhotoUris, ...result.uris];
      setNewPhotoUris(nextNew);
      syncPhotoUrisField(existingPhotos, nextNew);
    } catch (error) {
      if (
        error instanceof AnimalPhotoPickerError &&
        error.code === "PERMISSION_DENIED"
      ) {
        Alert.alert(
          "Permissão necessária",
          "Permita acesso à galeria para selecionar a foto do pet.",
        );
        return;
      }
      Alert.alert(
        "Não foi possível selecionar foto",
        "Não foi possível abrir a galeria. Tente novamente.",
      );
    }
  };

  const handleRemovePhoto = (entry: {
    kind: "existing" | "new";
    index: number;
  }) => {
    if (entry.kind === "existing") {
      const nextExisting = existingPhotos.filter(
        (_, index) => index !== entry.index,
      );
      setExistingPhotos(nextExisting);
      syncPhotoUrisField(nextExisting, newPhotoUris);
      return;
    }
    const nextNew = newPhotoUris.filter((_, index) => index !== entry.index);
    setNewPhotoUris(nextNew);
    syncPhotoUrisField(existingPhotos, nextNew);
  };

  const handleFormSubmit = handleSubmit(async (data) => {
    const keptExistingPhotoStoragePaths = existingPhotos.map(
      (photo) => photo.storagePath,
    );
    const submissionData: CreateAnimalFormData = {
      ...data,
      photoUris: [...newPhotoUris],
    };
    const success = await onSubmit({
      data: submissionData,
      keptExistingPhotoStoragePaths,
    });
    if (!success) {
      syncPhotoUrisField(existingPhotos, newPhotoUris);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <LogoWordmark size="sm" />
              <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Fotos do pet ({totalPhotos}/{MAX_ANIMAL_PHOTOS})
                </Text>

                {photoPreviewEntries.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.photosScroll}
                  >
                    {photoPreviewEntries.map((entry) => {
                      const key = `${entry.kind}-${entry.index}-${entry.uri}`;
                      return (
                        <View key={key} style={styles.photoPreviewContainer}>
                          <Image
                            source={{ uri: entry.uri }}
                            style={styles.photoPreviewSmall}
                          />
                          <Pressable
                            style={styles.removePhotoButton}
                            onPress={() => handleRemovePhoto(entry)}
                          >
                            <Text style={styles.removePhotoText}>X</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={styles.photoHelperText}>
                    Pelo menos uma foto é obrigatória para cadastrar o pet.
                  </Text>
                )}

                {totalPhotos < MAX_ANIMAL_PHOTOS ? (
                  <Pressable
                    style={[
                      styles.locationButton,
                      isPickingPhoto && styles.locationButtonDisabled,
                    ]}
                    disabled={isPickingPhoto}
                    onPress={() => {
                      void handlePickPhoto();
                    }}
                  >
                    <Text style={styles.locationButtonText}>
                      {isPickingPhoto
                        ? "Selecionando foto..."
                        : "Adicionar foto"}
                    </Text>
                  </Pressable>
                ) : null}

                {errors.photoUris ? (
                  <Text style={styles.errorText}>
                    {errors.photoUris.message}
                  </Text>
                ) : null}
              </View>

              <FormInput
                control={control}
                name="name"
                label="Nome do pet"
                placeholder="Ex: Mel"
                error={errors.name?.message}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo do animal</Text>
                <Controller
                  control={control}
                  name="species"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.optionsWrap}>
                      {SPECIES_OPTIONS.map((option) => (
                        <SelectChip
                          key={option.value}
                          label={option.label}
                          isActive={value === option.value}
                          onPress={() => onChange(option.value)}
                        />
                      ))}
                    </View>
                  )}
                />
                {errors.species ? (
                  <Text style={styles.errorText}>{errors.species.message}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data de nascimento</Text>
                <Pressable
                  style={[styles.input, errors.birthDate && styles.inputError]}
                  onPress={openBirthDatePicker}
                >
                  <Text
                    style={[
                      styles.inputValueText,
                      !birthDateValue && styles.inputPlaceholderText,
                    ]}
                  >
                    {birthDateValue
                      ? getBirthDateDisplayValue(birthDateValue)
                      : "Selecione a data"}
                  </Text>
                </Pressable>
                {isDatePickerVisible ? (
                  <View style={styles.datePickerWrapper}>
                    <DateTimePicker
                      value={pendingBirthDate}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      onChange={handleDateValueChange}
                      {...(Platform.OS === "ios"
                        ? { textColor: tokens.colors.gray[900] }
                        : {})}
                    />
                    <View style={styles.datePickerActions}>
                      <Pressable
                        style={styles.datePickerActionButton}
                        onPress={() => setIsDatePickerVisible(false)}
                      >
                        <Text style={styles.datePickerActionText}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.datePickerActionButton,
                          styles.datePickerActionButtonPrimary,
                        ]}
                        onPress={confirmBirthDate}
                      >
                        <Text
                          style={[
                            styles.datePickerActionText,
                            styles.datePickerActionTextPrimary,
                          ]}
                        >
                          Confirmar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
                {errors.birthDate ? (
                  <Text style={styles.errorText}>
                    {errors.birthDate.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Localização atual</Text>
                <Pressable
                  style={[
                    styles.locationButton,
                    isResolvingLocation && styles.locationButtonDisabled,
                  ]}
                  disabled={isResolvingLocation}
                  onPress={() => {
                    void handleGetCurrentLocation();
                  }}
                >
                  <Text style={styles.locationButtonText}>
                    {isResolvingLocation
                      ? "Obtendo localização..."
                      : "Usar localização do dispositivo"}
                  </Text>
                </Pressable>
                <Text style={styles.locationHelperText}>
                  A localização será preenchida automaticamente.
                </Text>
                {errors.latitude ? (
                  <Text style={styles.errorText}>
                    {errors.latitude.message}
                  </Text>
                ) : null}
                {errors.longitude ? (
                  <Text style={styles.errorText}>
                    {errors.longitude.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <ReadonlyField label="Cidade" value={cityValue} />
                  {errors.city ? (
                    <Text style={styles.errorText}>{errors.city.message}</Text>
                  ) : null}
                </View>
                <View style={styles.rowItem}>
                  <ReadonlyField label="Estado" value={stateValue} />
                  {errors.state ? (
                    <Text style={styles.errorText}>
                      {errors.state.message}
                    </Text>
                  ) : null}
                </View>
              </View>

              <ReadonlyField label="País" value={countryValue} />
              {errors.country ? (
                <Text style={styles.errorText}>
                  {errors.country.message}
                </Text>
              ) : null}

              <RequiredSelectGroup
                control={control}
                name="size"
                label="Porte"
                options={SIZE_OPTIONS}
                error={errors.size?.message}
              />

              <RequiredSelectGroup
                control={control}
                name="sex"
                label="Sexo"
                options={SEX_OPTIONS}
                error={errors.sex?.message}
              />

              <ToggleField
                control={control}
                name="isVaccinated"
                label="Vacinado"
              />
              <ToggleField
                control={control}
                name="isNeutered"
                label="Castrado"
              />

              <FormInput
                control={control}
                name="healthNotes"
                label="Dados de saúde (opcional)"
                placeholder="Ex: Vermifugado e saudável"
                error={errors.healthNotes?.message}
                multiline
              />

              <FormInput
                control={control}
                name="behaviorNotes"
                label="Comportamento (opcional)"
                placeholder="Ex: Calmo e sociável"
                error={errors.behaviorNotes?.message}
                multiline
              />

              <FormInput
                control={control}
                name="interestingFacts"
                label="Fatos interessantes (opcional)"
                placeholder="Ex: Adora brincar com bolinhas"
                error={errors.interestingFacts?.message}
                multiline
              />

              <Button
                label={isLoading ? submittingLabel : submitLabel}
                variant="primary"
                size="md"
                onPress={handleFormSubmit}
                disabled={isLoading}
                containerStyle={styles.buttonContainer}
              />

              <Pressable
                onPress={() => router.replace(cancelHref as never)}
                style={styles.linkContainer}
              >
                <Text style={styles.linkText}>Voltar</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormInputProps = {
  control: Control<CreateAnimalFormData>;
  name: keyof CreateAnimalFormData;
  label: string;
  placeholder: string;
  error?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
};

function FormInput({
  control,
  name,
  label,
  placeholder,
  error,
  keyboardType = "default",
  multiline = false,
}: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              multiline && styles.multilineInput,
              error && styles.inputError,
            ]}
            placeholder={placeholder}
            placeholderTextColor={tokens.colors.gray[500]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={(value ?? "") as string}
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
          />
        )}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type ReadonlyFieldProps = {
  label: string;
  value?: string;
};

function ReadonlyField({ label, value }: ReadonlyFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readonlyField}>
        <Text
          style={[
            styles.readonlyFieldText,
            !value && styles.readonlyFieldPlaceholderText,
          ]}
        >
          {value || "Preenchido pela localização"}
        </Text>
      </View>
    </View>
  );
}

type RequiredSelectGroupProps = {
  control: Control<CreateAnimalFormData>;
  name: "size" | "sex";
  label: string;
  options: readonly { value: string; label: string }[];
  error?: string;
};

function RequiredSelectGroup({
  control,
  name,
  label,
  options,
  error,
}: RequiredSelectGroupProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <View style={styles.optionsWrap}>
            {options.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                isActive={value === option.value}
                onPress={() => onChange(option.value)}
              />
            ))}
          </View>
        )}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type ToggleFieldProps = {
  control: Control<CreateAnimalFormData>;
  name: "isVaccinated" | "isNeutered";
  label: string;
};

function ToggleField({ control, name, label }: ToggleFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.toggle, value && styles.toggleActive]}>
              <Text
                style={[styles.toggleText, value && styles.toggleTextActive]}
              >
                {value ? "Sim" : "Não"}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

type SelectChipProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

function SelectChip({ label, isActive, onPress }: SelectChipProps) {
  return (
    <Pressable
      style={[styles.selectChip, isActive && styles.selectChipActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.selectChipText, isActive && styles.selectChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: tokens.spacing[6],
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[6],
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[5],
    marginTop: tokens.spacing[2],
    position: "relative",
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.brand.primary,
  },
  subtitle: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
  formContainer: {
    gap: tokens.spacing[4],
  },
  inputGroup: {
    gap: tokens.spacing[2],
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[700],
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
    backgroundColor: tokens.colors.white,
  },
  inputValueText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
  },
  inputPlaceholderText: {
    color: tokens.colors.gray[500],
  },
  multilineInput: {
    minHeight: 92,
  },
  readonlyField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[4],
    justifyContent: "center",
    backgroundColor: tokens.colors.gray[100],
  },
  readonlyFieldText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
  },
  readonlyFieldPlaceholderText: {
    color: tokens.colors.gray[500],
  },
  inputError: {
    borderColor: tokens.colors.red[500],
  },
  errorText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.red[500],
  },
  row: {
    flexDirection: "row",
    gap: tokens.spacing[3],
  },
  rowItem: {
    flex: 1,
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing[2],
  },
  locationButton: {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.brand.green,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing[4],
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    fontFamily: Fonts.bold,
    color: tokens.colors.white,
    fontSize: tokens.fontSize.sm,
    textTransform: "uppercase",
    textAlign: "center",
  },
  locationHelperText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  photoHelperText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  photosScroll: {
    flexDirection: "row",
    marginBottom: tokens.spacing[2],
  },
  photoPreviewContainer: {
    position: "relative",
    marginRight: tokens.spacing[3],
  },
  photoPreviewSmall: {
    width: 100,
    height: 100,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.gray[100],
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: tokens.colors.red[500],
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: tokens.colors.white,
  },
  removePhotoText: {
    color: tokens.colors.white,
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xs,
  },
  datePickerWrapper: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[2],
    backgroundColor: tokens.colors.white,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[2],
    paddingBottom: tokens.spacing[2],
  },
  datePickerActionButton: {
    minHeight: 36,
    paddingHorizontal: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colors.white,
  },
  datePickerActionButtonPrimary: {
    backgroundColor: tokens.colors.brand.green,
    borderColor: tokens.colors.brand.green,
  },
  datePickerActionText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[700],
  },
  datePickerActionTextPrimary: {
    color: tokens.colors.white,
  },
  selectChip: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    backgroundColor: tokens.colors.white,
  },
  selectChipActive: {
    borderColor: tokens.colors.brand.green,
    backgroundColor: `${tokens.colors.brand.green}10`,
  },
  selectChipText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  selectChipTextActive: {
    color: tokens.colors.brand.green,
    fontFamily: Fonts.bold,
  },
  toggleRow: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggle: {
    minWidth: 56,
    minHeight: 32,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.white,
  },
  toggleActive: {
    borderColor: tokens.colors.brand.green,
    backgroundColor: tokens.colors.brand.green,
  },
  toggleText: {
    fontFamily: Fonts.medium,
    color: tokens.colors.gray[600],
    fontSize: tokens.fontSize.sm,
  },
  toggleTextActive: {
    color: tokens.colors.white,
  },
  buttonContainer: {
    marginTop: tokens.spacing[2],
  },
  linkContainer: {
    alignItems: "center",
    marginTop: tokens.spacing[1],
    paddingVertical: tokens.spacing[2],
  },
  linkText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.primary,
  },
});
