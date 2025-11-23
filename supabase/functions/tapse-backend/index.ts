import { handleRequest } from "./router.ts";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  
  console.log("[Supabase Function] Incoming request:", req.method, url.pathname);
  console.log("[Supabase Function] Headers:", Object.fromEntries(req.headers.entries()));

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  if (req.method === "OPTIONS") {
    console.log("[Supabase Function] Handling CORS preflight");
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const response = await handleRequest(req);
    
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    console.log("[Supabase Function] Response status:", response.status);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("[Supabase Function] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
