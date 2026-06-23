import {
  AdoptionData,
  AdoptionProcessStatus,
  adoptionSchema,
} from "../../schemas/adoption.schema";
import { AdoptionError } from "../errors/adoption.error";

export class AdoptionEntity {
  private constructor(private data: AdoptionData) {}

  static create(data: AdoptionData): AdoptionEntity {
    const parsedData = adoptionSchema.parse(data);
    return new AdoptionEntity(parsedData);
  }

  get id(): string | undefined {
    return this.data.id;
  }
  get animalId(): string {
    return this.data.animalId;
  }
  get adopterProfileId(): string | null | undefined {
    return !this.isUnderReview ? this.data.adopterProfileId : undefined;
  }
  get status(): AdoptionProcessStatus {
    return this.data.status;
  }
  get adoptionDate(): string | null | undefined {
    return this.isAdopted && 'adoptionDate' in this.data ? this.data.adoptionDate : undefined;
  }
  get cancelReason(): string | null | undefined {
    return (this.isCanceled || this.isRejected) && 'cancelReason' in this.data ? this.data.cancelReason : undefined;
  }
  get notes(): string | null | undefined {
    return this.data.notes;
  }
  get decisionNotes(): string | null | undefined {
    return this.isTerminal && 'decisionNotes' in this.data 
      ? this.data.decisionNotes 
      : undefined;
  }
  get visitScheduledFor(): string | null | undefined {
    return 'visitScheduledFor' in this.data ? this.data.visitScheduledFor : undefined;
  }
  get visitedAt(): string | null | undefined {
    return 'visitedAt' in this.data ? this.data.visitedAt : undefined;
  }
  get adaptationStartedAt(): string | null | undefined {
    return 'adaptationStartedAt' in this.data ? this.data.adaptationStartedAt : undefined;
  }
  get adaptationEndedAt(): string | null | undefined {
    return 'adaptationEndedAt' in this.data ? this.data.adaptationEndedAt : undefined;
  }
  get createdAt(): string | undefined {
    return this.data.createdAt;
  }
  get updatedAt(): string | undefined {
    return this.data.updatedAt;
  }

  get isUnderReview(): boolean {
    return this.status === "UNDER_REVIEW";
  }
  get isInProgress(): boolean {
    return this.status === "IN_PROGRESS";
  }
  get isVisitPending(): boolean {
    return this.status === "VISIT_PENDING";
  }
  get isVisited(): boolean {
    return this.status === "VISITED";
  }
  get isInAdaptation(): boolean {
    return this.status === "IN_ADAPTATION";
  }
  get isAdopted(): boolean {
    return this.status === "ADOPTED";
  }
  get isCanceled(): boolean {
    return this.status === "CANCELED";
  }
  get isRejected(): boolean {
    return this.status === "REJECTED";
  }

  get isTerminal(): boolean {
    return this.isAdopted || this.isCanceled || this.isRejected;
  }

  scheduleVisit(scheduledFor: string): void {
    if (this.isTerminal) {
      throw new AdoptionError("Cannot update a terminal adoption", "INVALID_STATUS_TRANSITION");
    }
    
    const nextData = {
      ...this.data,
      status: "VISIT_PENDING",
      visitScheduledFor: scheduledFor,
    };
    this.data = adoptionSchema.parse(nextData);
  }

  registerVisit(visitedAt: string): void {
    if (this.isTerminal) {
      throw new AdoptionError("Cannot update a terminal adoption", "INVALID_STATUS_TRANSITION");
    }
    
    const nextData = {
      ...this.data,
      status: "VISITED",
      visitedAt,
    };
    this.data = adoptionSchema.parse(nextData);
  }

  startAdaptation(startedAt: string): void {
    if (this.isTerminal) {
      throw new AdoptionError("Cannot update a terminal adoption", "INVALID_STATUS_TRANSITION");
    }
    
    const nextData = {
      ...this.data,
      status: "IN_ADAPTATION",
      adaptationStartedAt: startedAt,
    };
    this.data = adoptionSchema.parse(nextData);
  }

  finalizeAdoption(adoptionDate: string, adopterProfileId: string): void {
    if (this.isTerminal) {
      throw new AdoptionError("Cannot update a terminal adoption", "INVALID_STATUS_TRANSITION");
    }
    
    const nextData = {
      ...this.data,
      status: "ADOPTED",
      adoptionDate,
      adopterProfileId,
    };
    this.data = adoptionSchema.parse(nextData);
  }

  cancel(reason: string): void {
    if (this.isTerminal) {
      throw new AdoptionError("Cannot update a terminal adoption", "INVALID_STATUS_TRANSITION");
    }
    
    const nextData = {
      ...this.data,
      status: "CANCELED",
      cancelReason: reason,
    };
    this.data = adoptionSchema.parse(nextData);
  }

  reject(reason: string, decisionNotes?: string | null): void {
    if (this.isTerminal) {
      throw new AdoptionError("Cannot update a terminal adoption", "INVALID_STATUS_TRANSITION");
    }
    
    const nextData = {
      ...this.data,
      status: "REJECTED" as const,
      cancelReason: reason,
      ...(decisionNotes !== undefined ? { decisionNotes } : {})
    };
    
    this.data = adoptionSchema.parse(nextData);
  }

  toPersistence(): AdoptionData {
    return { ...this.data };
  }
}
