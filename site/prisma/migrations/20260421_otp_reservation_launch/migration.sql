CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'EMAIL');

CREATE TABLE "reservations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "username" VARCHAR(30) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(32),
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMPTZ NOT NULL,
  "confirmed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "otp_challenges" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reservation_id" UUID NOT NULL,
  "code_hash" VARCHAR(64) NOT NULL,
  "channel" "OtpChannel" NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "locked_at" TIMESTAMPTZ,
  "sent_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "otp_challenges_reservation_id_fkey"
    FOREIGN KEY ("reservation_id")
    REFERENCES "reservations"("id")
    ON DELETE CASCADE
);

CREATE TABLE "username_blocklist" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "username" VARCHAR(30) NOT NULL,
  "reason" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "username_blocklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_sessions" (
  "id" UUID NOT NULL,
  "reservation_id" UUID NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auth_sessions_reservation_id_fkey"
    FOREIGN KEY ("reservation_id")
    REFERENCES "reservations"("id")
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX "username_blocklist_username_key"
  ON "username_blocklist" ("username");

CREATE UNIQUE INDEX "otp_challenges_reservation_id_key"
  ON "otp_challenges" ("reservation_id");

CREATE INDEX "reservation_username_status_idx"
  ON "reservations" ("username", "status");

CREATE INDEX "otp_challenge_expires_idx"
  ON "otp_challenges" ("expires_at");

CREATE INDEX "auth_session_expires_idx"
  ON "auth_sessions" ("expires_at");

CREATE UNIQUE INDEX "reservations_active_username_key"
  ON "reservations" ("username")
  WHERE "status" IN ('PENDING', 'CONFIRMED');

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_set_updated_at
BEFORE UPDATE ON "reservations"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER otp_challenges_set_updated_at
BEFORE UPDATE ON "otp_challenges"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
