import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { TopBar } from "@/components/ui/top-bar";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import {
  AuthUserEntity,
  type AuthUserListerType,
  type AuthUserRole,
} from "@/features/auth/domain/entities/auth-user.entity";
import { supabase } from "@/lib/supabase";

type ProfileInfo = {
  name: string | null;
  email: string | null;
  role: AuthUserRole;
  listerType: AuthUserListerType;
  roleLabel: string | null;
};

export function UserInfoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authUser = AuthUserEntity.fromSupabase(user);
  const userInitial = authUser.initial;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const { data, error: rpcError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        const role: AuthUserRole =
          data?.role === "ADOPTER" || data?.role === "LISTER"
            ? data.role
            : null;

        let profileName: string | null = null;
        let listerType: AuthUserListerType = null;
        if (role === "ADOPTER") {
          const { data: adopterRow } = await supabase
            .from("adopter_profiles")
            .select("name")
            .eq("user_id", user.id)
            .maybeSingle();
          profileName = adopterRow?.name ?? null;
        } else if (role === "LISTER") {
          const { data: listerRow } = await supabase
            .from("lister_profiles")
            .select("trade_name, name, lister_type")
            .eq("user_id", user.id)
            .maybeSingle();
          profileName = listerRow?.trade_name ?? listerRow?.name ?? null;
          listerType =
            listerRow?.lister_type === "INDIVIDUAL" ||
            listerRow?.lister_type === "SHELTER"
              ? listerRow.lister_type
              : null;
        }

        const trimmedProfileName = profileName?.trim() || null;
        const userEmail =
          typeof user.email === "string" && user.email.trim().length > 0
            ? user.email
            : null;
        setProfile({
          name: trimmedProfileName,
          email: userEmail,
          role,
          listerType,
          roleLabel: AuthUserEntity.resolveRoleLabel(role, listerType),
        });
      } catch (caught) {
        if (cancelled) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível carregar o usuário.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafeArea} edges={["top"]}>
        <TopBar
          userInitial={userInitial}
          onPressSettings={() => router.push("/settings" as never)}
          hideAvatar
        />
      </SafeAreaView>
      <SafeAreaView style={styles.bodySafeArea} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <Text style={styles.name}>
              {(
                profile?.name?.trim() ||
                authUser.displayName ||
                authUser.email ||
                ""
              )}
            </Text>
            {profile?.roleLabel ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{profile.roleLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conta</Text>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>E-mail</Text>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {profile?.email ?? authUser.email ?? "—"}
                </Text>
              </View>
            </View>
            {profile?.name ? (
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Nome</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {profile.name}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {profile?.role === "ADOPTER" ? (
            <View style={styles.section}>
              <Pressable
                style={styles.favoritesRow}
                onPress={() => router.push("/favorites" as never)}
              >
                <View style={styles.favoritesRowLeft}>
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={22}
                    color={tokens.colors.brand.primary}
                  />
                  <Text style={styles.favoritesRowLabel}>Favoritos</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={tokens.colors.gray[400]}
                />
              </Pressable>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={tokens.colors.brand.primary}
                size="small"
              />
            </View>
          ) : null}

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  topSafeArea: {
    backgroundColor: tokens.colors.white,
  },
  bodySafeArea: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  content: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[6],
  },
  headerCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing[6],
    paddingHorizontal: tokens.spacing[5],
    alignItems: "center",
    gap: tokens.spacing[3],
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.white,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.gray[900],
    textAlign: "center",
  },
  roleBadge: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
    backgroundColor: `${tokens.colors.brand.green}1A`,
  },
  roleBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.brand.green,
    textTransform: "uppercase",
  },
  section: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[4],
    gap: tokens.spacing[3],
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[700],
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[3],
  },
  rowText: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  rowLabel: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.gray[500],
    textTransform: "uppercase",
  },
  rowValue: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
  },
  loading: {
    alignItems: "center",
    padding: tokens.spacing[3],
  },
  errorText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.red[500],
    textAlign: "center",
  },
  favoritesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: tokens.spacing[1],
  },
  favoritesRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[3],
  },
  favoritesRowLabel: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
  },
});
