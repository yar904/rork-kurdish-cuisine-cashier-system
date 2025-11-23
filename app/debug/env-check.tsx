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

export default function EnvCheckScreen() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    envVars: Record<string, string | undefined>;
    supabaseTest: { success: boolean; message: string };
    trpcTest: { success: boolean; message: string; data?: any };
  } | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const envVars = {
        EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
        EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
          ? "Set (hidden)"
          : "Missing",
        EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL:
          process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
        EXPO_PUBLIC_TRPC_URL: process.env.EXPO_PUBLIC_TRPC_URL,
        RESOLVED_TRPC_URL: getTrpcBaseUrl(),
      };

      let supabaseTest = { success: false, message: "" };
      try {
        const { data, error } = await supabase.from("menu_items").select("id").limit(1);
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

      let trpcTest: { success: boolean; message: string; data?: any } = {
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

      setTestResults({ envVars, supabaseTest, trpcTest });
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Environment Variables</Text>
              {Object.entries(testResults.envVars).map(([key, value]) => (
                <View key={key} style={styles.row}>
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

            <View style={styles.section}>
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

            <View style={styles.section}>
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
              {testResults.trpcTest.data && (
                <View style={styles.dataPreview}>
                  <Text style={styles.dataLabel}>Sample Data:</Text>
                  <Text style={styles.dataText} numberOfLines={5}>
                    {JSON.stringify(testResults.trpcTest.data.slice(0, 2), null, 2)}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={runTests}>
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
});
