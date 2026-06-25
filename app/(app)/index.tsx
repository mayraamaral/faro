import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { SplashLoader } from "@/components/ui/splash-loader";
import { useAuth } from "@/features/auth/context/auth.context";
import type { UserRole } from "@/features/pets/domain/entities/current-user.entity";
import { supabase } from "@/lib/supabase";

export default function AppIndexRoute() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolveRole = async () => {
      if (!user) {
        if (!cancelled) {
          setRole(null);
          setIsLoading(false);
        }
        return;
      }

      const metadataRole = user.user_metadata?.role;
      if (metadataRole === "ADOPTER" || metadataRole === "LISTER") {
        if (!cancelled) {
          setRole(metadataRole);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        if (error) {
          setRole("ADOPTER");
        } else {
          setRole(data.role as UserRole);
        }
        setIsLoading(false);
      }
    };

    void resolveRole();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) {
    return <SplashLoader />;
  }

  return <Redirect href={role === "LISTER" ? "/lister-home" : "/feed"} />;
}
