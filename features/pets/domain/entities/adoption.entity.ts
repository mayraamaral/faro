export const ADOPTION_STATUS_VALUES = [
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "VISIT_PENDING",
  "VISITED",
  "IN_ADAPTATION",
  "ADOPTED",
  "CANCELED",
  "REJECTED",
] as const;

export type AdoptionStatus = (typeof ADOPTION_STATUS_VALUES)[number];

export const ADOPTION_STATUS_LABELS: Record<AdoptionStatus, string> = {
  UNDER_REVIEW: "Em análise",
  IN_PROGRESS: "Em andamento",
  VISIT_PENDING: "Visita agendada",
  VISITED: "Visita realizada",
  IN_ADAPTATION: "Em adaptação",
  ADOPTED: "Adotado",
  CANCELED: "Cancelado",
  REJECTED: "Recusado",
};

export const ADOPTION_ACTIVE_STATUSES = [
  "UNDER_REVIEW",
  "IN_PROGRESS",
] as const;

export type AdoptionActiveStatus = (typeof ADOPTION_ACTIVE_STATUSES)[number];

export const isAdoptionStatus = (value: string): value is AdoptionStatus =>
  ADOPTION_STATUS_VALUES.includes(value as AdoptionStatus);

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
