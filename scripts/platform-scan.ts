import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { TRPC_URL, trpcClient } from "@/lib/trpc";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  meta?: Record<string, unknown>;
}

const requiredEnvKeys = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL",
  "EXPO_PUBLIC_TRPC_URL",
];

const collectEnvStatus = (): CheckResult => {
  const missing = requiredEnvKeys.filter((key) => !process.env[key]);
  return {
    name: "env",
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? "All required EXPO_PUBLIC_* env vars are present"
        : `Missing: ${missing.join(", ")}`,
    meta: Object.fromEntries(
      requiredEnvKeys.map((key) => [key, process.env[key] ? "set" : "missing"]),
    ),
  };
};

const testSupabase = async (): Promise<CheckResult> => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      name: "supabase",
      ok: false,
      detail: "Supabase env vars are missing",
    };
  }

  try {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.from("menu_items").select("id").limit(1);
    if (error) {
      return {
        name: "supabase",
        ok: false,
        detail: `Query failed: ${error.message}`,
      };
    }

    return {
      name: "supabase",
      ok: true,
      detail: `Connected. Sample rows: ${(data ?? []).length}`,
    };
  } catch (error) {
    return {
      name: "supabase",
      ok: false,
      detail: `Client error: ${(error as Error).message}`,
    };
  }
};

const testTrpc = async (): Promise<CheckResult> => {
  try {
    const menu = await trpcClient.menu.getAll.query();
    return {
      name: "trpc",
      ok: true,
      detail: `tRPC online. Menu items fetched: ${menu.length}`,
      meta: {
        trpcUrl: TRPC_URL,
      },
    };
  } catch (error) {
    return {
      name: "trpc",
      ok: false,
      detail: `tRPC request failed: ${(error as Error).message}`,
      meta: {
        trpcUrl: TRPC_URL,
      },
    };
  }
};

const testEdgeHealth = async (): Promise<CheckResult> => {
  const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!functionsUrl) {
    return {
      name: "edge-health",
      ok: false,
      detail: "EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL missing",
    };
  }

  const healthUrl = `${functionsUrl.replace(/\/$/, "")}/tapse-backend/health`;

  try {
    const response = await fetch(healthUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        name: "edge-health",
        ok: false,
        detail: `Health endpoint returned ${response.status}`,
      };
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return {
      name: "edge-health",
      ok: true,
      detail: `Edge function healthy (${response.status})`,
      meta: payload,
    };
  } catch (error) {
    return {
      name: "edge-health",
      ok: false,
      detail: `Health request failed: ${(error as Error).message}`,
    };
  }
};

const summarize = (results: CheckResult[]) => {
  const divider = "\n==============================\n";
  console.log(divider);
  console.log("TAPSE Platform Scan Report");
  console.log(divider);
  results.forEach((result) => {
    console.log(`• ${result.name.toUpperCase()}: ${result.ok ? "OK" : "ISSUE"}`);
    console.log(`  ${result.detail}`);
    if (result.meta) {
      console.log(`  meta: ${JSON.stringify(result.meta, null, 2)}`);
    }
    console.log("---");
  });

  const failures = results.filter((result) => !result.ok);
  if (failures.length === 0) {
    console.log("All systems verified ✅");
  } else {
    console.log(`Problems detected in: ${failures.map((f) => f.name).join(", ")}`);
  }
};

(async () => {
  const envStatus = collectEnvStatus();
  const [supabaseStatus, trpcStatus, edgeHealthStatus] = await Promise.all([
    testSupabase(),
    testTrpc(),
    testEdgeHealth(),
  ]);

  summarize([envStatus, supabaseStatus, trpcStatus, edgeHealthStatus]);
})();
