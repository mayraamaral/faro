import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/context/auth.context";
import { CurrentUserEntity } from "@/features/pets/domain/entities/current-user.entity";
import type { MessageSenderType } from "../domain/entities/message.entity";

export type ChatIdentity =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string }
  | { status: "ready"; viewer: CurrentUserEntity };

const fetchProfileIds = async (
  userId: string,
  role: MessageSenderType
): Promise<{ adopterProfileId: string | null; listerProfileId: string | null }> => {
  if (role === "ADOPTER") {
    const { data, error } = await supabase
      .from("adopter_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return { adopterProfileId: data?.id ?? null, listerProfileId: null };
  }

  const { data, error } = await supabase
    .from("lister_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return { adopterProfileId: null, listerProfileId: data?.id ?? null };
};

export function useChatIdentity(): ChatIdentity {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<ChatIdentity>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!user) {
        setIdentity({ status: "unauthenticated" });
        return;
      }

      setIdentity({ status: "loading" });

      try {
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;
        if (!userRow) throw new Error("Usuário não encontrado.");

        const role = userRow.role as MessageSenderType;
        const profileIds = await fetchProfileIds(user.id, role);

        if (cancelled) return;
        const viewer = CurrentUserEntity.create({
          userId: user.id,
          role,
          adopterProfileId: profileIds.adopterProfileId,
          listerProfileId: profileIds.listerProfileId,
        });
        setIdentity({ status: "ready", viewer });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Falha ao identificar usuário.";
        setIdentity({ status: "error", message });
      }
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return identity;
}
