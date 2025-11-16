import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ChevronRight, Building2 } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/contexts/AppContext";
import { CompanyInfo, TonePreference } from "@/constants/types";

export default function CompanyInfoEditScreen() {
  const router = useRouter();
  const t = useTranslation();
  const app = useApp() as any;
  const { completeOnboarding, companyInfo } = app as {
    completeOnboarding: (info: CompanyInfo) => Promise<void>;
    companyInfo?: CompanyInfo | null;
  };

  const [companyName, setCompanyName] = useState<string>(
    companyInfo?.companyName ?? ""
  );
  const [industry, setIndustry] = useState<string>(
    companyInfo?.industry ?? ""
  );
  const [targetAudience, setTargetAudience] = useState<string>(
    companyInfo?.targetAudience ?? ""
  );
  const [contentGoals, setContentGoals] = useState<string>(
    companyInfo?.contentGoals ?? ""
  );
  const [postingFrequency, setPostingFrequency] = useState<
    "daily" | "weekly" | "biweekly"
  >(companyInfo?.postingFrequency ?? "weekly");
  const [tone, setTone] = useState<TonePreference>(
    companyInfo?.tonePreference ?? "casual"
  );

  // Neue Felder: Kontaktperson + E-Mail aus AppContext
  const [contactName, setContactName] = useState<string>(
    app.contactName ?? app.ownerName ?? ""
  );
  const [email, setEmail] = useState<string>(app.email ?? "");

  const handleSave = async () => {
    const info: CompanyInfo = {
      companyName,
      industry,
      targetAudience,
      contentGoals,
      postingFrequency,
      tonePreference: tone,
    };

    // Company-Info wie beim ersten Onboarding speichern
    await completeOnboarding(info);

    // Kontaktperson + Email im AppContext updaten, falls Setter existieren
    if (typeof app.setContactName === "function") {
      app.setContactName(contactName);
    } else if (typeof app.setOwnerName === "function") {
      app.setOwnerName(contactName);
    }

    if (typeof app.setEmail === "function") {
      app.setEmail(email);
    }

    router.back();
  };

  const canSave = companyName.trim().length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Profil & Strategie bearbeiten",
          headerBackTitle: t.back ?? "Zurück",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Building2 size={32} color="#0A66C2" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Profil & Strategie bearbeiten</Text>
          <Text style={styles.subtitle}>
            Passe hier die Infos an, die du beim ersten Start eingegeben hast.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Kontaktperson */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kontaktperson</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Dein Name"
              placeholderTextColor="#999"
            />
          </View>

          {/* E-Mail */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kontakt-E-Mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="hello@smyagency.de"
              placeholderTextColor="#999"
            />
          </View>

          {/* Unternehmensname */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t.onboarding?.companyInfo?.companyName ?? "Unternehmensname"}
            </Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder={
                t.onboarding?.companyInfo?.companyName ?? "z.B. SMY Agency"
              }
              placeholderTextColor="#999"
            />
          </View>

          {/* Branche */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t.onboarding?.companyInfo?.industry ?? "Branche"}
            </Text>
            <TextInput
              style={styles.input}
              value={industry}
              onChangeText={setIndustry}
              placeholder={
                t.onboarding?.companyInfo?.industryPlaceholder ??
                "z.B. Agentur, Coaching, E-Commerce"
              }
              placeholderTextColor="#999"
            />
          </View>

          {/* Zielgruppe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t.onboarding?.companyInfo?.targetAudience ?? "Zielgruppe"}
            </Text>
            <TextInput
              style={styles.input}
              value={targetAudience}
              onChangeText={setTargetAudience}
              placeholder={
                t.onboarding?.companyInfo?.targetAudiencePlaceholder ??
                "z.B. Selbstständige Frauen, lokale Unternehmen..."
              }
              placeholderTextColor="#999"
            />
          </View>

          {/* Content-Ziele */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t.onboarding?.companyInfo?.contentGoals ?? "Content-Ziele"}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentGoals}
              onChangeText={setContentGoals}
              placeholder={
                t.onboarding?.companyInfo?.contentGoalsPlaceholder ??
                "z.B. mehr Reichweite, Leads, Brand Awareness..."
              }
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Posting-Frequenz */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t.onboarding?.companyInfo?.postingFrequency ??
                "Posting-Frequenz"}
            </Text>
            <View style={styles.frequencyButtons}>
              <FrequencyButton
                label={t.onboarding?.companyInfo?.daily ?? "Täglich"}
                selected={postingFrequency === "daily"}
                onPress={() => setPostingFrequency("daily")}
              />
              <FrequencyButton
                label={t.onboarding?.companyInfo?.weekly ?? "Wöchentlich"}
                selected={postingFrequency === "weekly"}
                onPress={() => setPostingFrequency("weekly")}
              />
              <FrequencyButton
                label={
                  t.onboarding?.companyInfo?.biweekly ?? "2x pro Monat"
                }
                selected={postingFrequency === "biweekly"}
                onPress={() => setPostingFrequency("biweekly")}
              />
            </View>
          </View>
        </View>

        {/* Ton / Schreibstil */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t.onboarding?.companyInfo?.tone ?? "Ton / Schreibstil"}
          </Text>
          <View style={styles.toneButtons}>
            {(
              [
                "casual",
                "serious",
                "inspiring",
                "professional",
                "friendly",
                "educational",
                "authoritative",
                "playful",
                "empathetic",
              ] as TonePreference[]
            ).map((key) => (
              <TouchableOpacity
                key={key}
                testID={`tone-${key}`}
                style={[
                  styles.toneButton,
                  tone === key && styles.toneButtonSelected,
                ]}
                onPress={() => setTone(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toneButtonText,
                    tone === key && styles.toneButtonTextSelected,
                  ]}
                >
                  {t.onboarding?.companyInfo?.toneOptions?.[key] ?? key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !canSave && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t.save ?? "Speichern"}</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function FrequencyButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.frequencyButton,
        selected && styles.frequencyButtonSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.frequencyButtonText,
          selected && styles.frequencyButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#0F1419",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#0F1419",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F1419",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    paddingTop: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  frequencyButtons: {
    flexDirection: "row",
    gap: 8,
  },
  toneButtons: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  toneButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  toneButtonSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#0A66C2",
  },
  toneButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#666",
    textAlign: "center" as const,
  },
  toneButtonTextSelected: {
    color: "#0A66C2",
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  frequencyButtonSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#0A66C2",
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#666",
    textAlign: "center",
  },
  frequencyButtonTextSelected: {
    color: "#0A66C2",
  },
  button: {
    backgroundColor: "#0A66C2",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
