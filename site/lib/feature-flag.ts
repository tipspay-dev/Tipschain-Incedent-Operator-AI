import { env } from "@/lib/env";

async function evaluateLaunchDarkly() {
  if (!env.LAUNCHDARKLY_SDK_KEY) {
    return null;
  }

  try {
    const ld = await import("@launchdarkly/node-server-sdk");
    const client = ld.init(env.LAUNCHDARKLY_SDK_KEY);
    await client.waitForInitialization({ timeout: 2 });
    const value = await client.variation(
      env.FEATURE_FLAG_LAUNCHDARKLY_KEY,
      { key: "tipspay-launch", anonymous: true },
      env.ENABLE_RESERVATION === "true",
    );
    await client.close();
    return Boolean(value);
  } catch {
    return null;
  }
}

async function evaluateStatsig() {
  if (!env.STATSIG_SERVER_SECRET) {
    return null;
  }

  try {
    const statsig = await import("statsig-node");
    await statsig.Statsig.initialize(env.STATSIG_SERVER_SECRET);
    const value = await statsig.Statsig.checkGate(
      { userID: "tipspay-launch" },
      env.FEATURE_FLAG_STATSIG_KEY,
    );
    await statsig.Statsig.shutdown();
    return Boolean(value);
  } catch {
    return null;
  }
}

export async function isReservationEnabled() {
  const envValue = env.ENABLE_RESERVATION === "true";

  if (env.FEATURE_FLAG_PROVIDER === "launchdarkly") {
    const launched = await evaluateLaunchDarkly();
    return launched ?? envValue;
  }

  if (env.FEATURE_FLAG_PROVIDER === "statsig") {
    const gated = await evaluateStatsig();
    return gated ?? envValue;
  }

  return envValue;
}
