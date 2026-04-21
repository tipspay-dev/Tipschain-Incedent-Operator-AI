import type { NextRequest } from "next/server";

import { jsonNoStore } from "@/lib/responses";

export function requireJson(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonNoStore(
      {
        error: "VALIDATION_ERROR",
        message: "Expected application/json request body.",
      },
      { status: 400 },
    );
  }

  return null;
}
