import { supabase } from '@/lib/supabase';
import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';
import { AdoptionData, AdoptionProcessStatus } from '../schemas/adoption.schema';
import { AdoptionError } from '../domain/errors/adoption.error';

export class SupabaseAdoptionRepository implements AdoptionRepository {
  private mapToDomain(row: Record<string, any>): AdoptionData {
    return {
      id: row.id,
      animalId: row.animal_id,
      adopterProfileId: row.adopter_profile_id,
      status: row.status as AdoptionProcessStatus,
      adoptionDate: row.adoption_date,
      cancelReason: row.cancel_reason,
      notes: row.notes,
      decisionNotes: row.decision_notes,
      visitScheduledFor: row.visit_scheduled_for,
      visitedAt: row.visited_at,
      adaptationStartedAt: row.adaptation_started_at,
      adaptationEndedAt: row.adaptation_ended_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createAdoption(entity: AdoptionEntity): Promise<AdoptionEntity> {
    const data = entity.toPersistence();
    const payload = {
      animal_id: data.animalId,
      adopter_profile_id: data.adopterProfileId,
      status: data.status,
      notes: data.notes,
    };

    const { data: row, error } = await supabase
      .from('adoptions')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new AdoptionError(`Failed to create adoption: ${error.message}`, 'INVALID_INPUT', error);
    }

    return AdoptionEntity.create(this.mapToDomain(row));
  }

  async updateAdoption(entity: AdoptionEntity): Promise<AdoptionEntity> {
    const payload: Record<string, unknown> = {
      status: entity.status,
      updated_at: new Date().toISOString(),
      adoption_date: entity.adoptionDate,
      cancel_reason: entity.cancelReason,
      decision_notes: entity.decisionNotes,
      visit_scheduled_for: entity.visitScheduledFor,
      visited_at: entity.visitedAt,
      adaptation_started_at: entity.adaptationStartedAt,
      adaptation_ended_at: entity.adaptationEndedAt,
      notes: entity.notes,
    };

    const { data: row, error } = await supabase
      .from('adoptions')
      .update(payload)
      .eq('id', entity.id)
      .select('*')
      .single();

    if (error) {
      throw new AdoptionError(`Failed to update adoption status: ${error.message}`, 'INVALID_STATUS_TRANSITION', error);
    }

    return AdoptionEntity.create(this.mapToDomain(row));
  }

  async getAdoptionById(id: string): Promise<AdoptionEntity | null> {
    const { data: row, error } = await supabase
      .from('adoptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new AdoptionError(`Failed to fetch adoption: ${error.message}`, 'INVALID_INPUT', error);
    if (!row) return null;
    return AdoptionEntity.create(this.mapToDomain(row));
  }

  async getAdoptionsByAnimalId(animalId: string): Promise<AdoptionEntity[]> {
    const { data: rows, error } = await supabase
      .from('adoptions')
      .select('*')
      .eq('animal_id', animalId)
      .order('created_at', { ascending: false });

    if (error) throw new AdoptionError(`Failed to fetch adoptions: ${error.message}`, 'INVALID_INPUT', error);
    if (!rows) return [];
    return rows.map((row) => AdoptionEntity.create(this.mapToDomain(row)));
  }

  async getAdoptionsByAdopterId(adopterProfileId: string): Promise<AdoptionEntity[]> {
    const { data: rows, error } = await supabase
      .from('adoptions')
      .select('*')
      .eq('adopter_profile_id', adopterProfileId)
      .order('created_at', { ascending: false });

    if (error) throw new AdoptionError(`Failed to fetch adoptions: ${error.message}`, 'INVALID_INPUT', error);
    if (!rows) return [];
    return rows.map((row) => AdoptionEntity.create(this.mapToDomain(row)));
  }

  async getAdoptionsByListerId(listerProfileId: string): Promise<AdoptionEntity[]> {
    const { data: rows, error } = await supabase
      .from('adoptions')
      .select('*, animals!inner(lister_profile_id)')
      .eq('animals.lister_profile_id', listerProfileId)
      .order('created_at', { ascending: false });

    if (error) throw new AdoptionError(`Failed to fetch adoptions: ${error.message}`, 'INVALID_INPUT', error);
    if (!rows) return [];
    return rows.map((row) => AdoptionEntity.create(this.mapToDomain(row)));
  }
}
