import type { AnimalPhotoRepository } from "../domain/repositories/animal-photo.repository";
import type { AnimalRepository } from "../domain/repositories/animal.repository";
import type { CreateAnimalFormData } from "../schemas/create-animal.schema";
import { AnimalRegistrationEntity } from "../domain/entities/animal-registration.entity";
import { CurrentUserEntity } from "../domain/entities/current-user.entity";

export type UpdateAnimalInput = {
  animalId: string;
  data: CreateAnimalFormData;
  keptExistingPhotoStoragePaths: string[];
};

export class UpdateAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly animalPhotoRepository: AnimalPhotoRepository,
  ) {}

  async execute(userId: string, input: UpdateAnimalInput): Promise<void> {
    const context = await this.animalRepository.getListerContextByUserId(userId);
    const currentUser = CurrentUserEntity.create(context);
    if (!currentUser.canCreateAnimal()) {
      if (!currentUser.isLister) {
        throw new Error("Somente doadores e abrigos podem editar pets.");
      }
      throw new Error("Perfil de doador/abrigo não encontrado.");
    }

    const existingDetail = await this.animalRepository.getAnimalDetailForLister(
      currentUser.listerProfileId,
      input.animalId,
    );
    if (!existingDetail) {
      throw new Error("Pet não encontrado.");
    }

    const newLocalUris = input.data.photoUris.filter(
      (uri) => !uri.startsWith("existing:"),
    );
    const uploadedPhotos = await Promise.all(
      newLocalUris.map((uri) =>
        this.animalPhotoRepository.uploadPhoto(uri, userId),
      ),
    );
    const newStoragePaths = uploadedPhotos.map((photo) => photo.storagePath);

    const finalPhotoPaths = [
      ...input.keptExistingPhotoStoragePaths,
      ...newStoragePaths,
    ];

    const entity = AnimalRegistrationEntity.create(input.data, finalPhotoPaths);

    try {
      await this.animalRepository.updateForLister(
        currentUser.listerProfileId,
        input.animalId,
        entity,
      );
      await this.animalRepository.replaceAnimalPhotos(
        input.animalId,
        finalPhotoPaths,
      );

      const removedPhotoPaths = existingDetail.existingPhotos
        .map((photo) => photo.storagePath)
        .filter((path) => !finalPhotoPaths.includes(path));
      await Promise.all(
        removedPhotoPaths.map((path) =>
          this.animalPhotoRepository.deletePhoto(path).catch((error) => {
            console.error("Falha ao remover foto antiga após edição.", {
              path,
              error,
            });
          }),
        ),
      );
    } catch (error) {
      await Promise.all(
        newStoragePaths.map((path) =>
          this.animalPhotoRepository.deletePhoto(path).catch((cleanupError) => {
            console.error("Falha ao remover foto após erro ao editar pet.", {
              path,
              cleanupError,
              originalError: error,
            });
          }),
        ),
      );
      throw error;
    }
  }
}
