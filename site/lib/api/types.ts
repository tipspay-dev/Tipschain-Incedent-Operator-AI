export type UsernameCheckResponse = {
  available: boolean;
  reason?: "INVALID" | "BLOCKLISTED" | "RESERVED";
};

export type UsernameReserveResponse =
  | {
      reservationId: string;
      expiresAt: string;
    }
  | {
      error: "MAINTENANCE" | "ALREADY_RESERVED" | "VALIDATION_ERROR";
      message: string;
    };

export type OtpSendResponse =
  | {
      sent: true;
      channel: "sms" | "email";
      maskedDestination: string;
    }
  | {
      error:
        | "MAINTENANCE"
        | "NOT_FOUND"
        | "EXPIRED"
        | "INVALID_STATE"
        | "RATE_LIMITED";
      message: string;
    };

export type OtpVerifyResponse =
  | {
      verified: true;
      sessionToken: string;
      redirectUrl: string;
    }
  | {
      verified: false;
      error:
        | "MAINTENANCE"
        | "NOT_FOUND"
        | "LOCKED"
        | "EXPIRED"
        | "INVALID_CODE";
      message: string;
      retryAfterSeconds?: number;
    };

export type SessionCreateResponse =
  | {
      redirectUrl: string;
      token: string;
    }
  | {
      error: "MAINTENANCE" | "NOT_FOUND" | "INVALID_STATE";
      message: string;
    };

export type ReservationStatusResponse = {
  reservationId: string;
  status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  confirmedAt?: string | null;
};

export type HealthResponse = {
  status: "ok" | "degraded" | "down";
  db: boolean;
  redis: boolean;
  ts: string;
};
