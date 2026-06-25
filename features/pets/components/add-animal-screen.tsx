import { AnimalForm } from "./animal-form";
import { useCreateAnimal } from "../hooks/use-create-animal";
import type { CreateAnimalFormData } from "../schemas/create-animal.schema";

export function AddAnimalScreen() {
  const { handleCreateAnimal, isLoading } = useCreateAnimal();

  return (
    <AnimalForm
      title="Cadastrar pet"
      submitLabel="SALVAR PET"
      submittingLabel="SALVANDO..."
      isLoading={isLoading}
      onSubmit={async ({ data }: { data: CreateAnimalFormData }) => {
        return handleCreateAnimal(data);
      }}
      cancelHref="/lister-home"
    />
  );
}
