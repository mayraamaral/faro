-- Verification Script for Adoptions Lifecycle & Availability Security
-- Demonstrates full happy path, cancellation behavior, and concurrent adoption safeguards.

BEGIN;

-- 1. Setup Test Data
DO $$
DECLARE
  lister_user_id UUID := gen_random_uuid();
  adopter_user_id UUID := gen_random_uuid();
  adopter2_user_id UUID := gen_random_uuid();
  lister_profile_id UUID := gen_random_uuid();
  adopter_profile_id UUID := gen_random_uuid();
  adopter2_profile_id UUID := gen_random_uuid();
  animal_id UUID := gen_random_uuid();
  adoption1_id UUID := gen_random_uuid();
  adoption2_id UUID := gen_random_uuid();
BEGIN
  -- Insert mock users
  INSERT INTO auth.users (id, role, email) VALUES (lister_user_id, 'authenticated', 'lister@test.com');
  INSERT INTO auth.users (id, role, email) VALUES (adopter_user_id, 'authenticated', 'adopter@test.com');
  INSERT INTO auth.users (id, role, email) VALUES (adopter2_user_id, 'authenticated', 'adopter2@test.com');

  INSERT INTO public.users (id, role, email) VALUES (lister_user_id, 'LISTER', 'lister@test.com');
  INSERT INTO public.users (id, role, email) VALUES (adopter_user_id, 'ADOPTER', 'adopter@test.com');
  INSERT INTO public.users (id, role, email) VALUES (adopter2_user_id, 'ADOPTER', 'adopter2@test.com');

  INSERT INTO public.lister_profiles (id, user_id, lister_type, full_name, phone_number, document_number) 
  VALUES (lister_profile_id, lister_user_id, 'INDIVIDUAL', 'Test Lister', '123', '123');

  INSERT INTO public.adopter_profiles (id, user_id, full_name, phone_number, document_number, birth_date) 
  VALUES (adopter_profile_id, adopter_user_id, 'Test Adopter', '123', '123', '2000-01-01');
  
  INSERT INTO public.adopter_profiles (id, user_id, full_name, phone_number, document_number, birth_date) 
  VALUES (adopter2_profile_id, adopter2_user_id, 'Test Adopter 2', '123', '123', '2000-01-01');

  -- Insert animal (is_available defaults to true)
  INSERT INTO public.animals (id, lister_profile_id, name, species, photo_url, birth_date, latitude, longitude)
  VALUES (animal_id, lister_profile_id, 'Fluffy', 'DOG', 'http://photo', '2023-01-01', 0, 0);

  -- Assert initial state
  ASSERT (SELECT is_available FROM public.animals WHERE id = animal_id) = true, 'Animal should be available initially';

  -- 2. First Adoption Process
  INSERT INTO public.adoptions (id, animal_id, adopter_profile_id, status)
  VALUES (adoption1_id, animal_id, adopter_profile_id, 'IN_PROGRESS');

  UPDATE public.adoptions SET status = 'IN_ADAPTATION', adaptation_started_at = NOW() WHERE id = adoption1_id;
  ASSERT (SELECT is_available FROM public.animals WHERE id = animal_id) = false, 'Animal should be unavailable during adaptation';

  -- 3. Concurrent Adoption Process
  -- Another adopter starts a process while the first is in adaptation
  INSERT INTO public.adoptions (id, animal_id, adopter_profile_id, status)
  VALUES (adoption2_id, animal_id, adopter2_profile_id, 'IN_PROGRESS');

  -- 4. Cancellation Safeguard
  -- The second adoption is canceled. Since the first one is still IN_ADAPTATION, the animal MUST NOT become available.
  UPDATE public.adoptions SET status = 'CANCELED', cancel_reason = 'Decided not to' WHERE id = adoption2_id;
  ASSERT (SELECT is_available FROM public.animals WHERE id = animal_id) = false, 'Animal should STILL be unavailable after concurrent cancellation';

  -- 5. Primary Cancellation (Restores Availability)
  -- The first adoption (in adaptation) is canceled. Now no blocking adoptions exist, so animal should become available.
  UPDATE public.adoptions SET status = 'CANCELED', cancel_reason = 'Did not adapt' WHERE id = adoption1_id;
  ASSERT (SELECT is_available FROM public.animals WHERE id = animal_id) = true, 'Animal should be available again after primary cancellation';

  -- 6. Successful Adoption
  -- Start a new adoption and finalize it
  UPDATE public.adoptions SET status = 'IN_PROGRESS' WHERE id = adoption2_id; -- Re-open (just for test flow)
  UPDATE public.adoptions SET status = 'ADOPTED', adoption_date = NOW() WHERE id = adoption2_id;
  ASSERT (SELECT is_available FROM public.animals WHERE id = animal_id) = false, 'Animal should be unavailable after successful adoption';

  -- 7. History check
  ASSERT (SELECT COUNT(*) FROM public.adoption_status_history WHERE adoption_id = adoption1_id) >= 2, 'History rows should be generated';

  RAISE NOTICE 'ALL LIFECYCLE TESTS PASSED SUCCESSFULLY';
END $$;

ROLLBACK;