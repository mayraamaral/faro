export const ADOPTION_ACTIVE_STATUSES = ["IN_PROGRESS", "UNDER_REVIEW"] as const;

export type AdoptionActiveStatus = (typeof ADOPTION_ACTIVE_STATUSES)[number];

export type Adoption = {
  id: string;
  animalId: string;
  adopterProfileId: string | null;
  status: string;
  createdAt: string;
};

export class AdoptionEntity {
  private constructor(
    public readonly id: string,
    public readonly animalId: string,
    public readonly adopterProfileId: string | null,
    public readonly status: string,
    public readonly createdAt: string
  ) {}

  static create(props: {
    id: string;
    animalId: string;
    adopterProfileId: string | null;
    status: string;
    createdAt: string;
  }): AdoptionEntity {
    if (!props.id) throw new Error("Adoption must have an id.");
    if (!props.animalId) throw new Error("Adoption must reference an animal.");
    if (!props.createdAt) throw new Error("Adoption must have a createdAt timestamp.");

    return new AdoptionEntity(
      props.id,
      props.animalId,
      props.adopterProfileId,
      props.status,
      props.createdAt
    );
  }
}
