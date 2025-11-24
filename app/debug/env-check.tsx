import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { getTrpcBaseUrl, trpcClient } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

type HealthCheck = {
  success: boolean;
  message: string;
  data?: unknown;
};

type TestResults = {
  envVars: Record<string, string | undefined>;
  supabaseTest: HealthCheck;
  trpcTest: HealthCheck;
  trpcDiagnostics: TrpcDiagnostics;
};

type InsightSeverity = "error" | "warning" | "info";

type Insight = {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
};

type TrpcDiagnostics = {
  isMissing: boolean;
  usesFunctionsSubdomain: boolean;
  usesLegacyFunctionsPath: boolean;
  recommendedUrl: string;
  displayHost: string;
  rawUrl?: string;
};

const deriveTrpcDiagnostics = (rawUrl?: string): TrpcDiagnostics => {
  if (!rawUrl) {
    return {
      isMissing: true,
      usesFunctionsSubdomain: false,
      usesLegacyFunctionsPath: false,
      recommendedUrl:
        "https://<your-project-id>.functions.supabase.co/tapse-backend/trpc",
      displayHost: "Not configured",
      rawUrl,
    };
  }

  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname;
    const projectId = hostname.split(".")[0];
    const usesFunctionsSubdomain = hostname.includes(".functions.supabase.co");
    const usesLegacyFunctionsPath = parsed.pathname.includes("/functions/v1");
    const recommendedUrl = `https://${projectId}.functions.supabase.co/tapse-backend/trpc`;

    return {
      isMissing: false,
      usesFunctionsSubdomain,
      usesLegacyFunctionsPath,
      recommendedUrl,
      displayHost: hostname,
      rawUrl,
    };
  } catch {
    return {
      isMissing: false,
      usesFunctionsSubdomain: false,
      usesLegacyFunctionsPath: false,
      recommendedUrl:
        "https://<your-project-id>.functions.supabase.co/tapse-backend/trpc",
      displayHost: "Invalid URL",
      rawUrl,
    };
  }
};

const buildInsights = (
  envVars: TestResults["envVars"],
  supabaseTest: HealthCheck,
  trpcTest: HealthCheck,
  trpcDiagnostics: TrpcDiagnostics,
): Insight[] => {
  const insights: Insight[] = [];
  const missingEnv = Object.entries(envVars).filter(
    ([key, value]) => !value || value === "Missing",
  );

  if (missingEnv.length > 0) {
    insights.push({
      id: "env",
      title: "Environment variables missing",
      description: `Set ${missingEnv.map(([key]) => key).join(", ")} in your .env to allow the client to reach Supabase and tRPC endpoints. Restart Expo after updating them so process.env refreshes.`,
      severity: "error",
    });
  }

  if (!supabaseTest.success) {
    insights.push({
      id: "supabase",
      title: "Supabase connectivity failing",
      description:
        "Verify EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY point to an active project and that RLS policies allow read access for anon requests.",
      severity: "error",
    });
  }

  if (!trpcTest.success) {
    const offlineTriggered = trpcTest.message.toLowerCase().includes("offline");
    insights.push({
      id: "trpc",
      title: offlineTriggered ? "Client is offline" : "tRPC fetch failed",
      description: offlineTriggered
        ? "The Supabase Edge Function returned an offline payload (503). Double-check local internet connectivity or firewall restrictions blocking https://oqspnszwjxzyvwqjvjiy.supabase.co."
        : `Confirm EXPO_PUBLIC_TRPC_URL resolves to your Supabase Edge Function deployment and that that function is healthy. You can hit ${envVars.RESOLVED_TRPC_URL} in a browser to confirm.`,
      severity: offlineTriggered ? "warning" : "error",
    });
  }

  if (!trpcDiagnostics.isMissing && !trpcDiagnostics.usesFunctionsSubdomain) {
    insights.push({
      id: "trpc-domain",
      title: "tRPC host is not the Supabase Functions domain",
      description: `Current host ${trpcDiagnostics.displayHost} routes through the REST API. Swap EXPO_PUBLIC_TRPC_URL to ${trpcDiagnostics.recommendedUrl} so requests hit the Edge Function directly (no /functions/v1).`,
      severity: "error",
    });
  }

  if (trpcDiagnostics.usesLegacyFunctionsPath) {
    insights.push({
      id: "legacy-path",
      title: "tRPC URL still points to /functions/v1",
      description:
        "Supabase Edge Functions expect requests on the *.functions.supabase.co domain. Remove /functions/v1 from EXPO_PUBLIC_TRPC_URL and update every Netlify deploy context (Production, Deploy Previews, Branch deploys, Local CLI) so they all use the functions subdomain ending with /tapse-backend/trpc.",
      severity: "warning",
    });
  }

  if (trpcDiagnostics.displayHost === "Invalid URL") {
    insights.push({
      id: "invalid-trpc",
      title: "EXPO_PUBLIC_TRPC_URL is invalid",
      description:
        "Double-check the value inside your .env file. It must be a fully-qualified https URL ending with /tapse-backend/trpc.",
      severity: "error",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "healthy",
      title: "Everything looks good",
      description: "All env vars loaded and connections succeeded.",
      severity: "info",
    });
  }

  return insights;
};

export default function EnvCheckScreen() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const runTests = async () => {
    setLoading(true);
    try {
      const trpcDiagnostics = deriveTrpcDiagnostics(process.env.EXPO_PUBLIC_TRPC_URL);
      const envVars = {
        EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
        EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
          ? "Set (hidden)"
          : "Missing",
        EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL:
          process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
        EXPO_PUBLIC_TRPC_URL: process.env.EXPO_PUBLIC_TRPC_URL,
        RESOLVED_TRPC_URL: getTrpcBaseUrl(),
        TRPC_HOST: trpcDiagnostics.displayHost,
        TRPC_RECOMMENDED_URL: trpcDiagnostics.recommendedUrl,
      };

      let supabaseTest: HealthCheck = { success: false, message: "" };
      try {
        const { error } = await supabase.from("menu_items").select("id").limit(1);
        if (error) {
          supabaseTest = {
            success: false,
            message: `Supabase Error: ${error.message}`,
          };
        } else {
          supabaseTest = {
            success: true,
            message: "Supabase connection successful",
          };
        }
      } catch (err: any) {
        supabaseTest = {
          success: false,
          message: `Supabase Exception: ${err.message}`,
        };
      }

      let trpcTest: HealthCheck = {
        success: false,
        message: "",
      };
      try {
        const result = await trpcClient.menu.getAll.query();
        trpcTest = {
          success: true,
          message: `tRPC Success: ${result.length} menu items fetched`,
          data: result,
        };
      } catch (err: any) {
        trpcTest = {
          success: false,
          message: `tRPC Error: ${err.message || JSON.stringify(err)}`,
        };
      }

      setTestResults({ envVars, supabaseTest, trpcTest, trpcDiagnostics });
      setInsights(buildInsights(envVars, supabaseTest, trpcTest, trpcDiagnostics));
    } catch (err: any) {
      console.error("Test error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  useEffect(() => {
    console.log("[EnvCheckScreen] Pending diagnostics paused per request");
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen options={{ title: "Environment & Connection Check" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>System Diagnostic</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5C0000" />
            <Text style={styles.loadingText}>Running tests...</Text>
          </View>
        )}

        {testResults && (
          <>
            <View style={styles.section} testID="env-section">
              <Text style={styles.sectionTitle}>Environment Variables</Text>
              {Object.entries(testResults.envVars).map(([key, value]) => (
                <View key={key} style={styles.row} testID={`env-row-${key}`}>
                  <Text style={styles.label}>{key}:</Text>
                  <Text
                    style={[
                      styles.value,
                      !value || value === "Missing"
                        ? styles.errorValue
                        : styles.successValue,
                    ]}
                  >
                    {value || "Missing"}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section} testID="trpc-diagnostics">
              <Text style={styles.sectionTitle}>tRPC URL Diagnostics</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Raw URL</Text>
                <Text style={styles.value} numberOfLines={2}>
                  {testResults.trpcDiagnostics.rawUrl ?? "Missing"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Host</Text>
                <Text style={styles.value}>{testResults.trpcDiagnostics.displayHost}</Text>
              </View>
              <View style={styles.flagRow}>
                <View
                  style={[
                    styles.flagChip,
                    testResults.trpcDiagnostics.usesFunctionsSubdomain
                      ? styles.flagChipSuccess
                      : styles.flagChipError,
                  ]}
                >
                  <Text style={styles.flagLabel}>Functions subdomain</Text>
                  <Text style={styles.flagValue}>
                    {testResults.trpcDiagnostics.usesFunctionsSubdomain ? "Yes" : "No"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.flagChip,
                    testResults.trpcDiagnostics.usesLegacyFunctionsPath
                      ? styles.flagChipError
                      : styles.flagChipSuccess,
                  ]}
                >
                  <Text style={styles.flagLabel}>Legacy /functions/v1</Text>
                  <Text style={styles.flagValue}>
                    {testResults.trpcDiagnostics.usesLegacyFunctionsPath ? "Detected" : "Clean"}
                  </Text>
                </View>
              </View>
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationLabel}>Recommended URL</Text>
                <Text style={styles.recommendationValue} numberOfLines={2}>
                  {testResults.trpcDiagnostics.recommendedUrl}
                </Text>
              </View>
            </View>

            <View style={styles.section} testID="supabase-section">
              <Text style={styles.sectionTitle}>Supabase Connection</Text>
              <View
                style={[
                  styles.statusCard,
                  testResults.supabaseTest.success
                    ? styles.successCard
                    : styles.errorCard,
                ]}
              >
                <Text style={styles.statusText}>
                  {testResults.supabaseTest.success ? "✅" : "❌"}{" "}
                  {testResults.supabaseTest.message}
                </Text>
              </View>
            </View>

            <View style={styles.section} testID="trpc-section">
              <Text style={styles.sectionTitle}>tRPC Connection</Text>
              <View
                style={[
                  styles.statusCard,
                  testResults.trpcTest.success
                    ? styles.successCard
                    : styles.errorCard,
                ]}
              >
                <Text style={styles.statusText}>
                  {testResults.trpcTest.success ? "✅" : "❌"}{" "}
                  {testResults.trpcTest.message}
                </Text>
              </View>
              {Array.isArray(testResults.trpcTest.data) && (
                <View style={styles.dataPreview} testID="trpc-data">
                  <Text style={styles.dataLabel}>Sample Data:</Text>
                  <Text style={styles.dataText} numberOfLines={5}>
                    {JSON.stringify(testResults.trpcTest.data.slice(0, 2), null, 2)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section} testID="insights-section">
              <Text style={styles.sectionTitle}>Troubleshooting Guidance</Text>
              {insights.map((insight) => (
                <View
                  key={insight.id}
                  style={[
                    styles.insightCard,
                    insight.severity === "error" && styles.insightError,
                    insight.severity === "warning" && styles.insightWarning,
                    insight.severity === "info" && styles.insightInfo,
                  ]}
                  testID={`insight-${insight.id}`}
                >
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={runTests} testID="retry-tests">
              <Text style={styles.retryButtonText}>Re-run Tests</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6EEDD",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#5C0000",
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#5C0000",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5C0000",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: "#3A3A3A",
    fontWeight: "500",
  },
  value: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  flagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginTop: 12,
  },
  flagChip: {
    flex: 1,
    minWidth: 150,
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  flagChipSuccess: {
    backgroundColor: "#EAF7EF",
    borderColor: "#2E7D32",
  },
  flagChipError: {
    backgroundColor: "#FDF0EF",
    borderColor: "#C62828",
  },
  flagLabel: {
    fontSize: 12,
    color: "#4A4038",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  flagValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1810",
  },
  recommendationCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#5C0000",
    padding: 14,
    backgroundColor: "#FFF8F2",
  },
  recommendationLabel: {
    fontSize: 12,
    color: "#5C0000",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  recommendationValue: {
    fontSize: 14,
    color: "#2C1810",
    fontWeight: "600",
  },
  successValue: {
    color: "#2E7D32",
  },
  errorValue: {
    color: "#C62828",
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  successCard: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  errorCard: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  statusText: {
    fontSize: 14,
    color: "#3A3A3A",
  },
  dataPreview: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5C0000",
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    color: "#3A3A3A",
    fontFamily: "monospace",
  },
  retryButton: {
    backgroundColor: "#5C0000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#2C1810",
  },
  insightDescription: {
    fontSize: 14,
    color: "#3A3A3A",
    lineHeight: 20,
  },
  insightError: {
    backgroundColor: "#FEECEC",
    borderWidth: 1,
    borderColor: "#E53935",
  },
  insightWarning: {
    backgroundColor: "#FFF4E5",
    borderWidth: 1,
    borderColor: "#FB8C00",
  },
  insightInfo: {
    backgroundColor: "#E7F3FF",
    borderWidth: 1,
    borderColor: "#42A5F5",
  },
});
