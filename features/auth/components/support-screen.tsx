import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/ui/top-bar";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useAuth } from "@/features/auth/context/auth.context";
import { AuthUserEntity } from "@/features/auth/domain/entities/auth-user.entity";

type FaqItem = {
  question: string;
  answer: string;
};

const SUPPORT_EMAIL = "faro@mayra.dev";
const SUPPORT_EMAIL_SUBJECT = "Suporte Faro";
const SUPPORT_EMAIL_BODY =
  "Olá, equipe Faro!\n\nPreciso de ajuda com:\n\n";

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Como funciona o Faro?",
    answer:
      "O Faro conecta pessoas que querem adotar animais a quem oferece pets para adoção. Você pode buscar, favoritar e conversar com o responsável pelo animal dentro do app.",
  },
  {
    question: "Como adoto um animal?",
    answer:
      "Na aba Busca, deslize o card para a direita (ou toque no coração) para demonstrar interesse em um pet. Você também pode abrir o perfil do animal e tocar em 'QUERO CONHECER' para registrar seu interesse — em seguida, entre em contato com o responsável para combinar os próximos passos.",
  },
  {
    question: "Como cadastro um animal para adoção?",
    answer:
      "Na sua conta de doador, abra 'Meus pets' e toque em '+ Novo pet' para adicionar um animal com fotos, descrição e informações de contato.",
  },
  {
    question: "O serviço é gratuito?",
    answer:
      "Sim. O Faro é uma iniciativa sem fins lucrativos e não cobra taxa de listagem ou adoção.",
  },
  {
    question: "Como entro em contato com o suporte?",
    answer:
      "Role até o final desta tela e toque em 'Falar com o suporte'. Você será redirecionado para o seu aplicativo de e-mail para enviar uma mensagem para a equipe.",
  },
];

const tryOpenMailto = async (url: string): Promise<boolean> => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
};

export function SupportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userInitial = AuthUserEntity.fromSupabase(user).initial;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleOpenUserInfo = useCallback(() => {
    router.push("/user-info" as never);
  }, [router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContactSupport = useCallback(async () => {
    const composedUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      SUPPORT_EMAIL_SUBJECT,
    )}&body=${encodeURIComponent(SUPPORT_EMAIL_BODY)}`;

    const opened = await tryOpenMailto(composedUrl);
    if (opened) return;

    await tryOpenMailto(`mailto:${SUPPORT_EMAIL}`);
  }, []);

  const toggleFaq = useCallback((index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  }, []);

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
            <View style={styles.headerRow}>
              <Pressable
                onPress={handleGoBack}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={tokens.colors.brand.primary}
                />
              </Pressable>
              <Text style={styles.title}>Suporte</Text>
            </View>

            <Text style={styles.subtitle}>
              Estamos aqui para ajudar. Encontre respostas rápidas nas perguntas
              frequentes abaixo ou fale com a nossa equipe.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Perguntas frequentes</Text>
              <Text style={styles.sectionDescription}>
                Primeiros passos e dúvidas comuns.
              </Text>

              <View style={styles.faqList}>
                {FAQ_ITEMS.map((item, index) => {
                  const isOpen = openIndex === index;
                  const isLast = index === FAQ_ITEMS.length - 1;
                  return (
                    <View
                      key={item.question}
                      style={[styles.faqItem, isLast && styles.faqItemLast]}
                    >
                      <Pressable
                        onPress={() => {
                          toggleFaq(index);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={item.question}
                        accessibilityState={{ expanded: isOpen }}
                        style={({ pressed }) => [
                          styles.faqQuestion,
                          pressed && styles.faqQuestionPressed,
                        ]}
                      >
                        <Text style={styles.faqQuestionText}>
                          {item.question}
                        </Text>
                        <MaterialCommunityIcons
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={22}
                          color={tokens.colors.brand.primary}
                        />
                      </Pressable>
                      {isOpen ? (
                        <View style={styles.faqAnswer}>
                          <Text style={styles.faqAnswerText}>
                            {item.answer}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Ainda precisa de ajuda?</Text>
              <Text style={styles.sectionDescription}>
                Envie uma mensagem para a nossa equipe pelo e-mail{" "}
                <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>.
              </Text>
              <Button
                label="Falar com o suporte"
                variant="iconText"
                iconName="email-outline"
                size="md"
                containerStyle={styles.contactButton}
                labelStyle={styles.contactButtonLabel}
                iconColor={tokens.colors.brand.primary}
                onPress={() => {
                  void handleContactSupport();
                }}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.white,
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  subtitle: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    lineHeight: tokens.lineHeight.base,
    color: tokens.colors.gray[700],
  },
  section: {
    gap: tokens.spacing[2],
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.brand.primary,
  },
  sectionDescription: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.sm,
    color: tokens.colors.gray[600],
  },
  faqList: {
    marginTop: tokens.spacing[3],
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
  },
  faqItemLast: {
    borderBottomWidth: 0,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    gap: tokens.spacing[3],
  },
  faqQuestionPressed: {
    opacity: 0.7,
  },
  faqQuestionText: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.base,
    lineHeight: tokens.lineHeight.base,
    color: tokens.colors.gray[800],
  },
  faqAnswer: {
    paddingHorizontal: tokens.spacing[4],
    paddingBottom: tokens.spacing[4],
  },
  faqAnswerText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.base,
    color: tokens.colors.gray[700],
  },
  contactSection: {
    gap: tokens.spacing[3],
  },
  contactEmail: {
    fontFamily: Fonts.semiBold,
    color: tokens.colors.brand.primary,
  },
  contactButton: {
    marginTop: tokens.spacing[2],
    alignSelf: "flex-start",
    backgroundColor: tokens.colors.white,
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactButtonLabel: {
    color: tokens.colors.brand.primary,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
