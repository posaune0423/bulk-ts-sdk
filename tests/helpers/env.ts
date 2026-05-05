import * as v from "valibot";

const envSchema = v.object({
  PRIVATE_KEY: v.string(),
  BULK_HTTP_URL: v.optional(v.string(), "https://exchange-api.bulk.trade/api/v1"),
  BULK_WS_URL: v.optional(v.string(), "wss://exchange-ws1.bulk.trade"),
});

export function getEnv() {
  const env = {
    PRIVATE_KEY: Deno.env.get("PRIVATE_KEY"),
    BULK_HTTP_URL: Deno.env.get("BULK_HTTP_URL"),
    BULK_WS_URL: Deno.env.get("BULK_WS_URL"),
  };

  try {
    return v.parse(envSchema, env);
  } catch (error) {
    console.error("Invalid environment variables:", error);
    throw error;
  }
}
