import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { AlertTriangle, Database, RefreshCw, Server, ShieldCheck } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { getTrpcBaseUrl, trpcClient } from "@/lib/trpc";

const CHECK_DEFINITIONS = [
  {
    id: "env",
    title: "Environment Integrity",
    description: "Validates Supabase and Edge endpoints",
    importance: "critical" as const,
  },
  {
    id: "supabase",
    title: "Supabase Connectivity",
    description: "Reads menu_items to confirm database health",
    importance: "critical" as const,
  },
  {
    id: "trpc-menu",
    title: "tRPC Menu API",
    description: "Fetches menu.getAll for POS data",
    importance: "high" as const,
  },
  {
    id: "trpc-tables",
    title: "tRPC Tables API",
    description: "Validates tables.getAll status syncing",
    importance: "high" as const,
  },
  {
    id: "edge-health",
    title: "Edge Function Health",
    description: "Calls /health on Supabase Function",
    importance: "normal" as const,
  },
];

type CheckId = (typeof CHECK_DEFINITIONS)[number]["id"];
type CheckStatus = "pending" | "running" | "success" | "error";
type Importance = "critical" | "high" | "normal";

type CheckState = {
  id: CheckId;
  title: string;
  description: string;
  importance: Importance;
  status: CheckStatus;
  details?: string;
  durationMs?: number;
};

type InsightTone = "success" | "warning" | "critical";

type Insight = {
  id: string;
  title: string;
  description: string;
  tone: InsightTone;
};

const buildInitialChecks = (): CheckState[] =>
  CHECK_DEFINITIONS.map((definition) => ({
    ...definition,
    status: "pending",
    details: undefined,
    durationMs: undefined,
  }));

const statusMeta: Record<CheckStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: Colors.textSecondary },
  running: { label: "Running", color: Colors.warning },
  success: { label: "Healthy", color: Colors.success },
  error: { label: "Action Needed", color: Colors.error },
};

const toneStyles: Record<InsightTone, { backgroundColor: string; borderColor: string; textColor: string }> = {
  success: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: Colors.success,
    textColor: Colors.success,
  },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: Colors.warning,
    textColor: Colors.warning,
  },
  critical: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: Colors.error,
    textColor: Colors.error,
  },
};

export default function PlatformScanScreen() {
  const [checks, setChecks] = useState<CheckState[]>(buildInitialChecks);
  const [isScanning, setIsScanning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const confidenceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const healthUrl = useMemo(() => {
    const baseUrl = getTrpcBaseUrl();
    return baseUrl.replace(/\/trpc$/, "/health");
  }, []);

  const updateCheck = useCallback((id: CheckId, patch: Partial<CheckState>) => {
    setChecks((current) => current.map((check) => (check.id === id ? { ...check, ...patch } : check)));
  }, []);

  const performCheck = useCallback(
    async (id: CheckId) => {
      const operations: Record<CheckId, () => Promise<string>> = {
        env: async () => {
          console.log("[PlatformScan] Running ENV check");
          const requiredVars = [
            "EXPO_PUBLIC_SUPABASE_URL",
            "EXPO_PUBLIC_SUPABASE_ANON_KEY",
            "EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL",
            "EXPO_PUBLIC_TRPC_URL",
          ];
          const missing = requiredVars.filter((key) => !process.env?.[key]);

          if (missing.length > 0) {
            throw new Error(`Missing: ${missing.join(", ")}`);
          }

          const normalizedUrl = getTrpcBaseUrl();
          return `All env vars present. tRPC ➜ ${normalizedUrl}`;
        },
        supabase: async () => {
          console.log("[PlatformScan] Running Supabase DB check");
          const { data, error, count } = await supabase
            .from("menu_items")
            .select("id", { count: "exact", head: false })
            .limit(1);

          if (error) {
            throw new Error(error.message);
          }

          const sampleCount = count ?? data?.length ?? 0;
          return `Connected. Sample rows: ${sampleCount}`;
        },
        "trpc-menu": async () => {
          console.log("[PlatformScan] Running tRPC menu.getAll check");
          const items = await trpcClient.menu.getAll.query();
          return `Fetched ${items.length} menu items`;
        },
        "trpc-tables": async () => {
          console.log("[PlatformScan] Running tRPC tables.getAll check");
          const tables = await trpcClient.tables.getAll.query();
          return `Fetched ${tables.length} tables`;
        },
        "edge-health": async () => {
          console.log("[PlatformScan] Running Edge Function health check", healthUrl);
          const response = await fetch(healthUrl, { method: "GET" });

          if (!response.ok) {
            const failureBody = await response.text();
            throw new Error(`Status ${response.status}: ${failureBody || response.statusText}`);
          }

          const json = (await response.json()) as { status?: string };
          return `Edge function status: ${json.status ?? "unknown"}`;
        },
      };

      updateCheck(id, { status: "running", details: "Running..." });
      const started = Date.now();

      try {
        const details = await operations[id]();
        updateCheck(id, {
          status: "success",
          details,
          durationMs: Date.now() - started,
        });
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[PlatformScan] ${id} check failed`, message);
        updateCheck(id, {
          status: "error",
          details: message,
          durationMs: Date.now() - started,
        });
        return false;
      }
    },
    [healthUrl, updateCheck],
  );

  const runScan = useCallback(async () => {
    if (isScanning) {
      return;
    }

    console.log("[PlatformScan] Starting scan run");
    setIsScanning(true);
    setChecks(buildInitialChecks());

    for (const check of CHECK_DEFINITIONS) {
      await performCheck(check.id);
    }

    setIsScanning(false);
    setLastRunAt(new Date());
  }, [isScanning, performCheck]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const successCount = checks.filter((check) => check.status === "success").length;
  const errorCount = checks.filter((check) => check.status === "error").length;
  const pendingCount = checks.filter((check) => check.status === "pending").length;
  const confidenceScore = Math.round((successCount / CHECK_DEFINITIONS.length) * 100);

  useEffect(() => {
    Animated.timing(confidenceAnim, {
      toValue: trackWidth > 0 ? (confidenceScore / 100) * trackWidth : 0,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [confidenceScore, confidenceAnim, trackWidth]);

  useEffect(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }

    if (isScanning) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );

      pulseLoopRef.current.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isScanning, pulseAnim]);

  const overallStatus = useMemo(() => {
    if (isScanning) {
      return { label: "Scanning", color: Colors.info };
    }
    if (errorCount > 0) {
      return { label: "Action Required", color: Colors.error };
    }
    if (pendingCount > 0) {
      return { label: "Attention", color: Colors.warning };
    }
    return { label: "Ready", color: Colors.success };
  }, [errorCount, isScanning, pendingCount]);

  const insights = useMemo(() => {
    const generated: Insight[] = [];

    checks.forEach((check) => {
      if (check.status === "error") {
        generated.push({
          id: check.id,
          title: `${check.title} requires attention`,
          description: check.details ?? "No diagnostics returned",
          tone: check.importance === "critical" ? "critical" : "warning",
        });
      }
    });

    if (generated.length === 0 && checks.every((check) => check.status === "success")) {
      generated.push({
        id: "healthy",
        title: "Platform stable",
        description: "All diagnostics succeeded. POS flows can safely proceed.",
        tone: "success",
      });
    }

    return generated;
  }, [checks]);

  const statusIcon = errorCount > 0 ? AlertTriangle : ShieldCheck;
  const StatusIcon = statusIcon;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]} testID="platform-scan-safe-area">
      <Stack.Screen
        options={{
          title: "Platform Scan",
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID="platform-scan-scroll"
      >
        <View style={styles.heroCard} testID="platform-scan-summary">
          <Animated.View style={[styles.heroPulse, { opacity: pulseAnim }]} pointerEvents="none" />
          <View style={styles.heroHeader}>
            <View style={styles.statusIconWrapper}>
              <StatusIcon color={overallStatus.color} size={28} />
            </View>
            <View style={styles.heroTitles}>
              <Text style={styles.heroLabel}>Platform Readiness</Text>
              <Text style={[styles.heroStatus, { color: overallStatus.color }]}>{overallStatus.label}</Text>
            </View>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{confidenceScore}%</Text>
              <Text style={styles.statLabel}>Confidence</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{successCount}</Text>
              <Text style={styles.statLabel}>Healthy Checks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={[styles.statValue, errorCount > 0 ? styles.errorText : styles.statValue]}>
                {errorCount}
              </Text>
              <Text style={styles.statLabel}>Issues</Text>
            </View>
          </View>
          <View
            style={styles.progressTrack}
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            testID="confidence-progress-track"
          >
            <Animated.View style={[styles.progressFill, { width: confidenceAnim }]} />
          </View>
          <Text style={styles.progressCaption}>
            {lastRunAt ? `Last run ${lastRunAt.toLocaleTimeString()}` : "Running diagnostics"}
          </Text>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={runScan}
            disabled={isScanning}
            activeOpacity={0.85}
            testID="platform-scan-run"
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.scanButtonContent}>
                <RefreshCw color="#fff" size={18} />
                <Text style={styles.scanButtonText}>Run Scan</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section} testID="platform-scan-checks">
          <Text style={styles.sectionTitle}>Deep Diagnostics</Text>
          {checks.map((check) => (
            <View
              key={check.id}
              style={styles.checkCard}
              testID={`check-card-${check.id}`}
            >
              <View style={styles.checkHeader}>
                <View style={[styles.checkIcon, getIconBackground(check.importance)]}>
                  {renderIconForCheck(check.id)}
                </View>
                <View style={styles.checkTitleBlock}>
                  <Text style={styles.checkTitle}>{check.title}</Text>
                  <Text style={styles.checkDescription}>{check.description}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={[styles.statusPillText, { color: statusMeta[check.status].color }]}>
                    {statusMeta[check.status].label}
                  </Text>
                </View>
              </View>
              {check.details && (
                <Text style={styles.checkDetails} numberOfLines={3}>
                  {check.details}
                </Text>
              )}
              {typeof check.durationMs === "number" && (
                <Text style={styles.durationLabel}>⏱ {check.durationMs} ms</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section} testID="platform-scan-insights">
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.map((insight) => (
            <View
              key={insight.id}
              style={[styles.insightCard, toneStyles[insight.tone]]}
              testID={`insight-${insight.id}`}
            >
              <Text style={[styles.insightTitle, { color: toneStyles[insight.tone].textColor }]}>
                {insight.title}
              </Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          ))}
          {insights.length === 0 && (
            <Text style={styles.emptyInsight} testID="insight-empty">
              Diagnostics still running. Insights will appear once checks finish.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const iconMap: Record<CheckId, React.ReactNode> = {
  env: <ShieldCheck color={Colors.gold} size={20} />,
  supabase: <Database color={Colors.success} size={20} />,
  "trpc-menu": <Server color={Colors.info} size={20} />,
  "trpc-tables": <Server color={Colors.info} size={20} />,
  "edge-health": <AlertTriangle color={Colors.warning} size={20} />,
};

const getIconBackground = (importance: Importance) => {
  switch (importance) {
    case "critical":
      return styles.iconCritical;
    case "high":
      return styles.iconHigh;
    default:
      return styles.iconNormal;
  }
};

const renderIconForCheck = (id: CheckId) => (
  <View style={styles.iconInner}>{iconMap[id]}</View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  heroCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  heroPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  statusIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTitles: {
    flex: 1,
  },
  heroLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  heroStatus: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.success,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 12,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.border,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.success,
  },
  progressCaption: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 16,
  },
  checkCard: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  checkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCritical: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  iconHigh: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  iconNormal: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkTitleBlock: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  checkDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkDetails: {
    fontSize: 13,
    color: Colors.text,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  durationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  insightCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyInsight: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  statLabelError: {
    color: Colors.error,
  },
  errorText: {
    color: Colors.error,
  },
});
