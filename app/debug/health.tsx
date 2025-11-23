import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";
import { getTrpcBaseUrl, trpc } from "@/lib/trpc";

export default function DebugHealthScreen() {
  const baseUrl = getTrpcBaseUrl();
  const healthUrl = React.useMemo(
    () => baseUrl.replace(/\/trpc$/, "/health"),
    [baseUrl],
  );
  const [healthStatus, setHealthStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [healthData, setHealthData] = React.useState<unknown>(null);
  const [healthError, setHealthError] = React.useState<string | null>(null);
  const healthQuery = trpc.menu.getAll.useQuery(undefined, {
    retry: 0,
  });

  const fetchHealth = React.useCallback(async () => {
    setHealthStatus("loading");
    setHealthError(null);
    try {
      const response = await fetch(healthUrl, { method: "GET" });
      const json = await response.json();
      setHealthData(json);
      setHealthStatus("success");
    } catch (error) {
      setHealthStatus("error");
      setHealthError(error instanceof Error ? error.message : String(error));
    }
  }, [healthUrl]);

  React.useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const statusLabel = healthQuery.isSuccess ? "✅ TRPC OK" : healthQuery.isLoading ? "…" : "❌ TRPC ERROR";
  const trpcError = healthQuery.error as unknown as { message?: string; cause?: unknown } | null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "TRPC Health Check",
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>tRPC Connectivity</Text>
        <Text style={styles.subheading}>Endpoint</Text>
        <View style={styles.card}>
          <Text style={styles.mono}>{baseUrl}</Text>
        </View>

        <Text style={styles.subheading}>Health Endpoint</Text>
        <View style={styles.card}>
          <Text style={styles.mono}>{healthUrl}</Text>
          <Text style={styles.status}>{healthStatus === "success" ? "✅ HEALTH OK" : healthStatus === "error" ? "❌ HEALTH ERROR" : "…"}</Text>
          {healthError && <Text style={styles.errorText}>{healthError}</Text>}
          {healthStatus === "success" && (
            <Text style={styles.mono} numberOfLines={6} ellipsizeMode="tail">{JSON.stringify(healthData, null, 2)}</Text>
          )}
        </View>

        <Text style={styles.subheading}>Status</Text>
        <View style={styles.card}>
          <Text style={[styles.status, healthQuery.isSuccess ? styles.ok : styles.error]}>{statusLabel}</Text>
          {trpcError?.message && <Text style={styles.errorText}>{trpcError.message}</Text>}
          {trpcError?.cause && (
            <Text style={styles.errorText}>{String(trpcError.cause)}</Text>
          )}
          {healthQuery.data && (
            <Text style={styles.mono} numberOfLines={6} ellipsizeMode="tail">
              {JSON.stringify(healthQuery.data.slice(0, 2), null, 2)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            healthQuery.refetch();
            fetchHealth();
          }}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  content: { padding: 20, gap: 12 },
  heading: { fontSize: 24, fontWeight: "700", color: Colors.text },
  subheading: { fontSize: 16, fontWeight: "600", color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  mono: {
    fontFamily: "Courier",
    color: Colors.text,
    fontSize: 12,
  },
  status: { fontSize: 18, fontWeight: "800" },
  ok: { color: Colors.success },
  error: { color: Colors.error },
  errorText: { color: Colors.error, fontSize: 12 },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
