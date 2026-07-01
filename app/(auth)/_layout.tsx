import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/features/auth/context/auth.context";

export default function AuthLayout() {
  const { session, isRecoveryFlow } = useAuth();

  if (session && !isRecoveryFlow) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="confirm-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-recovery-code" />
      <Stack.Screen name="new-password" />
    </Stack>
  );
}
