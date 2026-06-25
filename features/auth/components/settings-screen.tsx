import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/ui/top-bar";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import { AuthUserEntity } from "@/features/auth/domain/entities/auth-user.entity";

export function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const userInitial = AuthUserEntity.fromSupabase(user).initial;

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as never);
  };

  const handleOpenUserInfo = () => {
    router.push("/user-info" as never);
  };

  return (
    <View style={styles.root}>
      {user ? (
        <SafeAreaView style={styles.topSafeArea} edges={["top"]}>
          <TopBar
            userInitial={userInitial}
            onPressAvatar={handleOpenUserInfo}
            hideSettingsIcon
          />
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.topSafeArea} edges={["top"]} />
      )}
      <SafeAreaView style={styles.bodySafeArea} edges={["bottom"]}>
        {user ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Configurações</Text>
            </View>

            <View style={styles.actions}>
              <Button
                label="Sair"
                variant="iconText"
                iconName="logout"
                size="md"
                onPress={() => {
                  void handleLogout();
                }}
                containerStyle={styles.logoutButton}
                labelStyle={styles.logoutButtonLabel}
                iconColor={tokens.colors.brand.primary}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator
              color={tokens.colors.brand.primary}
              size="large"
            />
          </View>
        )}
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
  header: {
    gap: tokens.spacing[1],
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    alignItems: "flex-start",
  },
  logoutButton: {
    alignSelf: "flex-start",
    backgroundColor: tokens.colors.white,
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonLabel: {
    color: tokens.colors.brand.primary,
  },
});
