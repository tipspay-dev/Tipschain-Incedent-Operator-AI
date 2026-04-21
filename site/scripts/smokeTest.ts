type JsonRecord = Record<string, unknown>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(
  baseUrl: string,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let json: JsonRecord | null = null;

  if (text) {
    try {
      json = JSON.parse(text) as JsonRecord;
    } catch (error) {
      throw new Error(
        `Expected JSON from ${path} but received: ${text.slice(0, 160)}`,
      );
    }
  }

  return { response, json };
}

async function findAvailableUsername(baseUrl: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const username = `launch${Date.now().toString(36)}${attempt}`;
    const { response, json } = await request(
      baseUrl,
      `/api/username/check?username=${encodeURIComponent(username)}`,
      { method: "GET" },
    );

    assert(response.status === 200, `username/check returned ${response.status}`);
    assert(json && typeof json.available === "boolean", "username/check shape invalid");

    if (json.available === true) {
      return username;
    }
  }

  throw new Error("Could not find an available username after 10 attempts.");
}

async function main() {
  const baseUrl = process.env.STAGING_URL;
  const otpCode = process.env.OTP_OVERRIDE_CODE;

  assert(baseUrl, "STAGING_URL is required.");
  assert(otpCode, "OTP_OVERRIDE_CODE is required for smoke testing.");

  const username = await findAvailableUsername(baseUrl);
  console.log(`Selected username: ${username}`);

  const reserve = await request(baseUrl, "/api/username/reserve", {
    method: "POST",
    body: JSON.stringify({
      username,
      email: `launch+${username}@tipspay.org`,
    }),
  });

  assert(reserve.response.status === 200, `username/reserve returned ${reserve.response.status}`);
  assert(reserve.json && typeof reserve.json.reservationId === "string", "username/reserve missing reservationId");
  assert(typeof reserve.json.expiresAt === "string", "username/reserve missing expiresAt");

  const reservationId = reserve.json.reservationId as string;

  const send = await request(baseUrl, "/api/otp/send", {
    method: "POST",
    body: JSON.stringify({ reservationId }),
  });

  assert(send.response.status === 200, `otp/send returned ${send.response.status}`);
  assert(send.json && send.json.sent === true, "otp/send did not confirm delivery");
  assert(send.json.channel === "email" || send.json.channel === "sms", "otp/send channel invalid");
  assert(typeof send.json.maskedDestination === "string", "otp/send maskedDestination missing");

  const verify = await request(baseUrl, "/api/otp/verify", {
    method: "POST",
    body: JSON.stringify({
      reservationId,
      code: otpCode,
    }),
  });

  assert(verify.response.status === 200, `otp/verify returned ${verify.response.status}`);
  assert(verify.json && verify.json.verified === true, "otp/verify did not verify");
  assert(typeof verify.json.sessionToken === "string", "otp/verify missing session token");
  assert(typeof verify.json.redirectUrl === "string", "otp/verify missing redirectUrl");

  const session = await request(baseUrl, "/api/session/create", {
    method: "POST",
    body: JSON.stringify({ reservationId }),
  });

  assert(session.response.status === 200, `session/create returned ${session.response.status}`);
  assert(session.json && typeof session.json.token === "string", "session/create missing token");
  assert(typeof session.json.redirectUrl === "string", "session/create missing redirectUrl");

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
