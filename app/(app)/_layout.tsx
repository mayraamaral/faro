import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/features/auth/context/auth.context";

export default function AppLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pet-profile" />
      <Stack.Screen name="lister-home" />
      <Stack.Screen name="my-pets" />
      <Stack.Screen name="my-pets/edit/[animal_id]" />
      <Stack.Screen name="my-pets/[animal_id]/interested" />
      <Stack.Screen name="add-animal" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="user-info" />
      <Stack.Screen name="chat/[conversation_id]" />
      <Stack.Screen name="adoption-status/[adoption_id]" />
    </Stack>
  );
}
