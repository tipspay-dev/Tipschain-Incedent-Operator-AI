"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  AtSign,
  BadgeCheck,
  CandlestickChart,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Fingerprint,
  Globe2,
  KeyRound,
  Layers3,
  Loader2,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";

import type {
  OtpSendResponse,
  OtpVerifyResponse,
  ReservationStatusResponse,
  UsernameCheckResponse,
  UsernameReserveResponse,
} from "@/lib/api/types";
import { retryFetch, NetworkRequestError } from "@/lib/client/retry-fetch";
import { buildUsernameSuggestions } from "@/lib/username";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

const trustItems = [
  {
    title: "Institutional Trust",
    body: "Enterprise-grade architecture, controlled onboarding, safer launch posture and auditable session flows.",
    icon: ShieldCheck,
  },
  {
    title: "Global Payments",
    body: "Built for borderless transfers, wallet operations, usernames and next-generation onchain finance.",
    icon: Globe2,
  },
  {
    title: "Advanced Trading",
    body: "Fast execution, live market visibility and a premium DEX layer in one ecosystem.",
    icon: Activity,
  },
];

const securityPoints = [
  "Username sanitization and real-time availability checks before reservation.",
  "Pending reservation lock with explicit 10-minute expiry window.",
  "OTP delivery over SMS or email with resend throttling and countdown protection.",
  "Reservation status polling every 30 seconds to catch expiry in-flight.",
  "Signed session cookie issued server-side only after successful OTP verification.",
  "All launch-critical endpoints protected by feature flag, rate limits and telemetry.",
];

const blurDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMjAnIGhlaWdodD0nMTInIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzIwJyBoZWlnaHQ9JzEyJyBmaWxsPScjMDkwZjE4Jy8+PC9zdmc+";

function Glow({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`absolute rounded-full blur-3xl ${className}`} />;
}

function FloatingCoin({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      className={`rounded-full border border-white/15 bg-white/10 px-4 py-4 shadow-2xl backdrop-blur-xl ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 text-sm font-semibold text-white shadow-lg">
        {label}
      </div>
    </motion.div>
  );
}

function ProductCard({
  icon: Icon,
  title,
  description,
  bullets,
  accent,
  preview,
}: {
  icon: typeof Wallet;
  title: string;
  description: string;
  bullets: string[];
  accent: string;
  preview: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-panel backdrop-blur-2xl">
      <CardContent className="grid gap-8 p-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-8 lg:p-10">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${accent}`}
          >
            <Icon className="h-4 w-4" />
            <span>{title}</span>
          </div>
          <h3 className="mt-6 text-3xl font-semibold tracking-tight text-white">
            {title}
          </h3>
          <p className="mt-4 max-w-md text-base leading-7 text-white/68">
            {description}
          </p>
          <div className="mt-6 space-y-3">
            {bullets.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 text-sm text-white/72"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-h-[360px] overflow-hidden border-l border-white/8 bg-gradient-to-br from-white/8 to-white/3 p-6 lg:p-8">
          {preview}
        </div>
      </CardContent>
    </Card>
  );
}

function WalletPreview() {
  const [sendName, setSendName] = useState("architect");
  const normalizedName = sendName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "");
  const resolvedName = `${normalizedName || "username"}@tips`;

  return (
    <div className="relative h-full rounded-[26px] border border-white/10 bg-[#0a1020]/90 p-5 shadow-2xl">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>TipsWallet</span>
        <span>Multi-chain</span>
      </div>
      <div className="mt-5 rounded-[24px] bg-gradient-to-br from-cyan-500 via-blue-500 to-violet-600 p-5 shadow-[0_20px_60px_rgba(59,130,246,0.35)]">
        <div className="text-xs uppercase tracking-[0.2em] text-white/70">
          Total Balance
        </div>
        <div className="mt-2 text-4xl font-semibold text-white">$128,450</div>
        <div className="mt-5 flex items-center justify-between text-sm text-white/80">
          <span>Main Account</span>
          <span>+8.42%</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          ["Send", "$12.4k"],
          ["Receive", "14 tx"],
          ["Stake", "7.2% APY"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="text-xs text-white/50">{label}</div>
            <div className="mt-2 text-sm font-medium text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[22px] border border-cyan-400/20 bg-cyan-400/8 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">Send to username</div>
            <div className="text-xs text-white/55">
              Gasless transfer powered by reservation-first identity.
            </div>
          </div>
          <div className="rounded-2xl bg-cyan-400/12 p-2 text-cyan-200">
            <Send className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/45">
              <AtSign className="h-3.5 w-3.5" /> Recipient username
            </div>
            <div className="flex items-center rounded-2xl border border-white/8 bg-[#0d1427] px-3">
              <input
                value={sendName}
                onChange={(event) =>
                  setSendName(
                    event.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "")
                      .replace(/[^a-z0-9_-]/g, ""),
                  )
                }
                placeholder="architect"
                className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
              <span className="text-sm font-medium text-cyan-200">@tips</span>
            </div>
            <div className="mt-2 text-xs text-white/40">
              Lowercase only · underscore and hyphen allowed.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="text-white/45">Resolved recipient</div>
              <div className="mt-1 font-medium text-white">{resolvedName}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-200">
              <div>Gasless rules</div>
              <div className="mt-1 text-white/80">3 free tx · max $10 each</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DexPreview() {
  return (
    <div className="relative h-full rounded-[26px] border border-white/10 bg-[#090d18]/95 p-5 shadow-2xl">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>TipsDEX</span>
        <span>Live Market</span>
      </div>
      <div className="mt-5 grid grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">WTPC / USDT</div>
              <div className="text-xs text-white/50">24H volume $12.8M</div>
            </div>
            <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
              +12.4%
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-2">
            {[40, 62, 58, 88, 74, 110, 94, 130, 122, 146, 138, 170].map(
              (height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 20 }}
                  animate={{ height }}
                  transition={{ duration: 0.6, delay: index * 0.03 }}
                  className="w-full rounded-t-xl bg-gradient-to-t from-blue-500 via-cyan-400 to-emerald-300"
                />
              ),
            )}
          </div>
        </div>
        <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
          <div className="text-sm font-medium text-white">Swap</div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="text-xs text-white/50">From</div>
              <div className="mt-1 text-lg font-medium text-white">1,200 USDT</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="text-xs text-white/50">To</div>
              <div className="mt-1 text-lg font-medium text-white">1,154 WTPC</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
              Best route found · slippage protected
            </div>
          </div>
          <Button className="mt-4 w-full">Execute Trade</Button>
        </div>
      </div>
    </div>
  );
}

type ReservationForm = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  code: string;
};

type ReservationError = {
  message: string;
  retryAction?: () => void;
};

function normalizeClientUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${mins}:${remainder.toString().padStart(2, "0")}`;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}

function useResendCountdown(storageKey: string) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const startCountdown = useCallback(() => {
    const startedAt = Date.now();
    window.sessionStorage.setItem(storageKey, String(startedAt));
    setSecondsLeft(60);
  }, [storageKey]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    const startedAt = Number(stored);
    if (!Number.isFinite(startedAt)) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(60 - elapsedSeconds, 0);
      setSecondsLeft(remaining);
      if (remaining === 0) {
        window.sessionStorage.removeItem(storageKey);
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [storageKey]);

  return { secondsLeft, startCountdown };
}

function trackClientEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.__tipspayAnalyticsReady) {
    return;
  }

  posthog.capture(event, properties);
}

function WaitlistMode() {
  return (
    <div className="rounded-[30px] border border-amber-300/20 bg-amber-400/10 p-6 text-left">
      <div className="flex items-center gap-3 text-amber-200">
        <Clock3 className="h-5 w-5" />
        <span className="text-sm font-semibold uppercase tracking-[0.18em]">
          Waitlist mode
        </span>
      </div>
      <h2 className="mt-4 text-3xl font-semibold text-white">
        Reservations are temporarily paused.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-white/70">
        Tipspay is currently running in maintenance mode for the reservation
        launch. Wallet and DEX surfaces stay online while username reservation
        remains gated behind the server-side release flag.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="mailto:launch@tipspay.org?subject=Tipspay%20Waitlist"
          className="inline-flex h-12 items-center rounded-2xl border border-white/12 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Join waitlist by email
        </a>
        <a
          href="https://wallet.tipspay.org"
          className="inline-flex h-12 items-center rounded-2xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Open hosted wallet
        </a>
      </div>
    </div>
  );
}

function ReservationDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const [step, setStep] = useState<"register" | "verify" | "success">("register");
  const [form, setForm] = useState<ReservationForm>({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    code: "",
  });
  const [availability, setAvailability] = useState<{
    state: "idle" | "checking" | "available" | "taken" | "invalid";
    reason?: string;
  }>({ state: "idle" });
  const [availabilityRetry, setAvailabilityRetry] = useState<(() => void) | null>(null);
  const [reservation, setReservation] = useState<{
    id: string;
    expiresAt: string;
  } | null>(null);
  const [otpDelivery, setOtpDelivery] = useState<{
    channel: "sms" | "email";
    maskedDestination: string;
  } | null>(null);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "reserve" | "sendOtp" | "verifyOtp" | "status" | null
  >(null);
  const [error, setError] = useState<ReservationError | null>(null);
  const [raceSuggestions, setRaceSuggestions] = useState<string[]>([]);
  const [expired, setExpired] = useState(false);
  const pollTimerRef = useRef<number | null>(null);
  const debouncedUsername = useDebouncedValue(form.username, 300);
  const normalizedUsername = normalizeClientUsername(form.username);
  const resolvedUsername = `${normalizedUsername || "username"}@tips`;
  const { secondsLeft, startCountdown } = useResendCountdown(
    reservation ? `tipspay_otp_countdown:${reservation.id}` : "tipspay_otp_countdown",
  );

  const registerValid =
    form.fullName.trim().length >= 2 &&
    availability.state === "available" &&
    (Boolean(form.email.trim()) || Boolean(form.phone.trim()));

  const verifyValid = /^\d{6}$/.test(form.code.trim());

  const resetState = useCallback(() => {
    setStep("register");
    setAvailability({ state: "idle" });
    setReservation(null);
    setOtpDelivery(null);
    setSuccessRedirectUrl(null);
    setPendingAction(null);
    setError(null);
    setRaceSuggestions([]);
    setExpired(false);
    setForm({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      code: "",
    });
  }, []);

  const runNetworkSafe = useCallback(
    async <T,>(
      action: () => Promise<T>,
      retryAction: () => void,
    ) => {
      try {
        setError(null);
        return await action();
      } catch (networkError) {
        if (networkError instanceof NetworkRequestError) {
          setError({
            message:
              "Connection issue — check your network and try again.",
            retryAction,
          });
          return null;
        }

        throw networkError;
      }
    },
    [],
  );

  const checkUsername = useCallback(async () => {
    if (!debouncedUsername) {
      setAvailability({ state: "idle" });
      return;
    }

    if (debouncedUsername.length < 3) {
      setAvailability({ state: "invalid", reason: "Username must be at least 3 characters." });
      return;
    }

    setAvailability({ state: "checking" });
    const doCheck = () => checkUsername();
    setAvailabilityRetry(() => doCheck);

    const result = await runNetworkSafe(
      () =>
        retryFetch<UsernameCheckResponse>(
          `/api/username/check?username=${encodeURIComponent(debouncedUsername)}`,
        ),
      doCheck,
    );

    if (!result) {
      return;
    }

    if (result.available) {
      setAvailability({ state: "available" });
      trackClientEvent("username_checked", {
        username: debouncedUsername,
        available: true,
      });
      return;
    }

    const reason =
      result.reason === "BLOCKLISTED"
        ? "This username is not allowed."
        : result.reason === "INVALID"
          ? "Username must be 3 to 30 characters and only use a-z, 0-9, underscore or hyphen."
          : "This username is already reserved.";

    setAvailability({ state: "taken", reason });
    trackClientEvent("username_checked", {
      username: debouncedUsername,
      available: false,
      reason: result.reason,
    });
  }, [debouncedUsername, runNetworkSafe]);

  useEffect(() => {
    void checkUsername();
  }, [checkUsername]);

  useEffect(() => {
    if (!reservation) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      setPendingAction((current) => current ?? "status");
      const result = await runNetworkSafe(
        () =>
          retryFetch<ReservationStatusResponse>(
            `/api/reservation/${reservation.id}/status`,
          ),
        checkStatus,
      );
      setPendingAction((current) => (current === "status" ? null : current));

      if (!result) {
        return;
      }

      if (result.status === "EXPIRED") {
        setExpired(true);
        setOpen(false);
      }
    };

    void checkStatus();
    pollTimerRef.current = window.setInterval(checkStatus, 30000);

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [reservation, runNetworkSafe, setOpen]);

  const handleReserve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!registerValid) {
      return;
    }

    setPendingAction("reserve");
    setError(null);
    setRaceSuggestions([]);

    const retryAction = () => {
      void handleReserve(
        {
          preventDefault() {},
        } as React.FormEvent,
      );
    };

    const result = await runNetworkSafe(
      () =>
        retryFetch<UsernameReserveResponse>("/api/username/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: normalizedUsername,
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
          }),
        }),
      retryAction,
    );

    if (!result) {
      setPendingAction(null);
      return;
    }

    if ("error" in result) {
      if (result.error === "ALREADY_RESERVED") {
        const suggestions = buildUsernameSuggestions(normalizedUsername);
        setRaceSuggestions(suggestions);
        setError({
          message: "Someone just claimed this — try another username",
          retryAction,
        });
        setPendingAction(null);
        return;
      }

      setError({
        message: result.message,
        retryAction,
      });
      setPendingAction(null);
      return;
    }

    setReservation({ id: result.reservationId, expiresAt: result.expiresAt });
    setStep("verify");
    trackClientEvent("username_reserved", { username: normalizedUsername });

    const sendResult = await runNetworkSafe(
      () =>
        retryFetch<OtpSendResponse>("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: result.reservationId }),
        }),
      retryAction,
    );

    setPendingAction(null);

    if (!sendResult) {
      return;
    }

    if ("error" in sendResult) {
      setError({
        message: sendResult.message,
        retryAction: () => void handleResendOtp(),
      });
      return;
    }

    setOtpDelivery(sendResult);
    startCountdown();
    trackClientEvent("otp_sent", {
      reservationId: result.reservationId,
      channel: sendResult.channel,
    });
  };

  const handleResendOtp = async () => {
    if (!reservation) {
      return;
    }

    setPendingAction("sendOtp");
    const retryAction = () => void handleResendOtp();
    const result = await runNetworkSafe(
      () =>
        retryFetch<OtpSendResponse>("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: reservation.id }),
        }),
      retryAction,
    );

    setPendingAction(null);

    if (!result) {
      return;
    }

    if ("error" in result) {
      setError({
        message: result.message,
        retryAction,
      });
      return;
    }

    setOtpDelivery(result);
    startCountdown();
    trackClientEvent("otp_sent", {
      reservationId: reservation.id,
      channel: result.channel,
    });
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifyValid || !reservation) {
      return;
    }

    setPendingAction("verifyOtp");
    const retryAction = () => {
      void handleVerify(
        {
          preventDefault() {},
        } as React.FormEvent,
      );
    };

    const result = await runNetworkSafe(
      () =>
        retryFetch<OtpVerifyResponse>("/api/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId: reservation.id,
            code: form.code.trim(),
          }),
        }),
      retryAction,
    );

    setPendingAction(null);

    if (!result) {
      return;
    }

    if (!result.verified) {
      setError({
        message: result.message,
        retryAction,
      });
      return;
    }

    trackClientEvent("otp_verified", { reservationId: reservation.id });
    setSuccessRedirectUrl(result.redirectUrl);
    setStep("success");
    window.sessionStorage.removeItem(`tipspay_otp_countdown:${reservation.id}`);
    window.setTimeout(() => {
      window.location.href = result.redirectUrl;
    }, 1200);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            resetState();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {step === "register"
                ? "Reserve your Tipspay username"
                : step === "verify"
                  ? "Verify your reservation"
                  : "Username secured"}
            </DialogTitle>
            <DialogDescription>
              {step === "register"
                ? "Claim your @tips username, lock it for 10 minutes, and verify with OTP before opening your wallet session."
                : step === "verify"
                  ? "Use the verification code to confirm your reservation and activate your secure session."
                  : "Your username is confirmed. Tipspay can now open your post-auth wallet surface."}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === "register" ? (
              <motion.form
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleReserve}
                className="space-y-5"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/65">
                    <div className="flex items-center gap-2 text-white">
                      <Fingerprint className="h-4 w-4 text-cyan-300" />
                      Reservation-first identity
                    </div>
                    <div className="mt-2">
                      Username checks run before wallet access. Active pending
                      reservations hold the name for 10 minutes.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/65">
                    <div className="flex items-center gap-2 text-white">
                      <Clock3 className="h-4 w-4 text-cyan-300" />
                      Delivery channel
                    </div>
                    <div className="mt-2">
                      Use email or phone for OTP delivery. SMS is preferred when
                      a phone number is provided.
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="John Carter"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <Input
                      id="username"
                      value={form.username}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          username: normalizeClientUsername(event.target.value),
                        }))
                      }
                      placeholder="architect"
                      autoComplete="username"
                      className="pl-11 pr-16"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-cyan-200">
                      @tips
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
                    <span>3 to 30 characters · lowercase, underscore or hyphen.</span>
                    <span className="text-cyan-200">{resolvedUsername}</span>
                  </div>
                  <div className="min-h-[40px]">
                    {availability.state === "checking" ? (
                      <Skeleton className="h-10 w-44" />
                    ) : null}
                    {availability.state === "available" ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                        <Check className="h-3.5 w-3.5" />
                        Available
                      </div>
                    ) : null}
                    {availability.state === "taken" || availability.state === "invalid" ? (
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {availability.reason}
                        </div>
                        {availabilityRetry ? (
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 rounded-full px-4 text-xs"
                              onClick={availabilityRetry}
                            >
                              Try again
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="founder@tipspay.org"
                        autoComplete="email"
                        className="pl-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="+90 555 000 0000"
                        autoComplete="tel"
                        className="pl-11"
                      />
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                    <div>{error.message}</div>
                    {error.retryAction ? (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-full px-4 text-xs"
                          onClick={error.retryAction}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {raceSuggestions.length > 0 ? (
                  <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/8 p-4 text-sm text-cyan-100">
                    <div className="font-medium text-white">
                      Suggested alternatives
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {raceSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              username: suggestion,
                            }))
                          }
                        >
                          {suggestion}@tips
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <Button type="submit" className="h-12 w-full" disabled={!registerValid || Boolean(pendingAction)}>
                  {pendingAction === "reserve" ? (
                    <>
                      <Spinner />
                      Reserving username...
                    </>
                  ) : (
                    <>
                      Reserve username
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : null}

            {step === "verify" ? (
              <motion.form
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerify}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/8 p-4 text-sm text-cyan-100">
                  Reserved username:{" "}
                  <span className="font-medium text-white">{resolvedUsername}</span>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  {otpDelivery
                    ? `OTP sent via ${otpDelivery.channel} to ${otpDelivery.maskedDestination}.`
                    : "OTP is being prepared for delivery."}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <Input
                      id="code"
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          code: event.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                      className="pl-11"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                    <div>{error.message}</div>
                    {error.retryAction ? (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-full px-4 text-xs"
                          onClick={error.retryAction}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                  <span>
                    {secondsLeft > 0
                      ? `Resend in ${formatSeconds(secondsLeft)}`
                      : "Need a new code?"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full px-4 text-xs"
                    onClick={handleResendOtp}
                    disabled={secondsLeft > 0 || pendingAction === "sendOtp"}
                  >
                    {pendingAction === "sendOtp" ? (
                      <>
                        <Spinner />
                        Sending...
                      </>
                    ) : secondsLeft > 0 ? (
                      `Resend in ${formatSeconds(secondsLeft)}`
                    ) : (
                      "Resend code"
                    )}
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("register")}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={!verifyValid || pendingAction === "verifyOtp"}>
                    {pendingAction === "verifyOtp" ? (
                      <>
                        <Spinner />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify and continue
                        <BadgeCheck className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            ) : null}

            {step === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">
                        Username confirmed
                      </div>
                      <div className="mt-1 text-sm text-white/64">
                        Your secure session is active and Tipspay is preparing
                        the wallet redirect.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/72">
                  Active identity:{" "}
                  <span className="font-medium text-white">{resolvedUsername}</span>
                </div>
                <Button
                  type="button"
                  className="h-12 w-full"
                  disabled={!successRedirectUrl}
                  onClick={() => {
                    if (successRedirectUrl) {
                      window.location.href = successRedirectUrl;
                    }
                  }}
                >
                  Open TipsWallet
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <Dialog open={expired} onOpenChange={setExpired}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your reservation expired — start over</DialogTitle>
            <DialogDescription>
              The pending lock window ended before verification completed. Start
              a fresh reservation to continue.
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            className="h-12 w-full"
            onClick={() => {
              setExpired(false);
              resetState();
              setOpen(true);
            }}
          >
            Retry reservation
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TipspayReservationLanding({
  reservationEnabled,
}: {
  reservationEnabled: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="page-shell min-h-screen overflow-hidden text-white">
      <Glow className="left-[10%] top-24 h-64 w-64 bg-cyan-500/20" />
      <Glow className="right-[8%] top-20 h-72 w-72 bg-violet-500/20" />
      <Glow className="bottom-20 left-1/2 h-80 w-80 -translate-x-1/2 bg-blue-500/15" />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 shadow-xl">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">TipsPay</div>
              <div className="text-xs text-white/45">
                Username reservation · OTP auth · wallet launch
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-white/68 md:flex">
            <a href="#wallet" className="transition hover:text-white">
              TipsWallet
            </a>
            <a href="#dex" className="transition hover:text-white">
              TipsDEX
            </a>
            <a href="#security" className="transition hover:text-white">
              Security
            </a>
          </nav>
          <Button onClick={() => setDialogOpen(true)}>
            {reservationEnabled ? "Reserve username" : "Launch status"}
          </Button>
        </header>

        <section className="relative pb-16 pt-20 lg:pb-24 lg:pt-28">
          <FloatingCoin label="OTP" className="absolute left-0 top-12 hidden lg:block" />
          <FloatingCoin label="@tips" className="absolute right-6 top-24 hidden lg:block" />
          <FloatingCoin label="WTPC" className="absolute bottom-12 right-24 hidden lg:block" />

          <div className="mx-auto max-w-5xl text-center">
            <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-100 hover:bg-cyan-400/10">
              <Sparkles className="mr-2 h-4 w-4" />
              Production launch mode · reservation-first wallet access
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mt-7 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Reserve your Tipspay username before
              <span className="bg-gradient-to-r from-white via-cyan-200 to-violet-200 bg-clip-text text-transparent">
                {" "}
                wallet access begins
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05 }}
              className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-white/66"
            >
              Tipspay combines trust-first onboarding, OTP-protected username
              reservation, secure session issuance, premium wallet UX and live
              DEX access in one launch surface.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.12 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                onClick={() => setDialogOpen(true)}
                className="h-14 rounded-full px-8 text-base"
              >
                {reservationEnabled ? "Get started" : "View launch status"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a
                href="https://wallet.tipspay.org"
                className="inline-flex h-14 items-center rounded-full border border-white/12 bg-white/5 px-8 text-base text-white/82 backdrop-blur-xl transition hover:bg-white/8"
              >
                Open hosted wallet
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18 }}
            className="relative mx-auto mt-16 max-w-6xl"
          >
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr_1fr]">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                  <Wallet className="h-4 w-4" />
                  TipsWallet
                </div>
                <div className="mt-5 text-2xl font-semibold">
                  Secure wallet layer
                </div>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  Manage assets, send Tips by username and move value without
                  exposing raw wallet addresses.
                </p>
              </div>
              <div className="flex items-center justify-center rounded-[34px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/10 p-8 backdrop-blur-2xl">
                <div className="text-center">
                  <div className="mx-auto overflow-hidden rounded-[30px] border border-white/10 shadow-[0_20px_60px_rgba(45,212,191,0.35)]">
                    <Image
                      src="/tipschain-logo.png"
                      alt="Tipschain logo"
                      width={434}
                      height={240}
                      priority
                      placeholder="blur"
                      blurDataURL={blurDataUrl}
                      className="h-auto w-[220px] rounded-[30px] object-contain sm:w-[280px]"
                    />
                  </div>
                  <div className="mt-4 text-2xl font-semibold">TipsPay Core</div>
                  <div className="mt-2 text-sm text-white/58">
                    Unified onboarding, nameserver identity, access control and
                    transaction orchestration.
                  </div>
                </div>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
                  <CandlestickChart className="h-4 w-4" />
                  TipsDEX
                </div>
                <div className="mt-5 text-2xl font-semibold">
                  Liquidity and trading layer
                </div>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  Execute swaps, monitor pairs and access live market depth
                  through a premium, performance-first trading surface.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="space-y-8 py-10" id="wallet">
          <div className="max-w-2xl">
            <div className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
              Launch focus
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              One reservation-first landing page for wallet and DEX access.
            </h2>
            <p className="mt-4 text-base leading-8 text-white/64">
              The launch story stays simple: secure username reservation first,
              then wallet session creation, then access into TipsWallet and
              TipsDEX.
            </p>
          </div>

          {!reservationEnabled ? (
            <WaitlistMode />
          ) : null}

          <ProductCard
            icon={Wallet}
            title="TipsWallet"
            description="A secure asset hub for users who want a refined wallet experience with fast actions, clear balances, fixed @tips identity and confidence-first onboarding."
            bullets={[
              "OTP-gated wallet access with HttpOnly secure session cookies.",
              "Username-based transfers with reservation and availability checks.",
              "Countdown-protected OTP resend flow with refresh persistence.",
              "Expiry polling that catches stale reservations before wallet access.",
            ]}
            accent="border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
            preview={<WalletPreview />}
          />

          <div id="dex">
            <ProductCard
              icon={CandlestickChart}
              title="TipsDEX"
              description="A modern trading experience that gives users fast swaps, live pair visibility and premium market feedback without clutter."
              bullets={[
                "Live pair pricing and volume visibility.",
                "Clean route discovery for swap execution.",
                "Premium dark visual language aligned with the wallet launch.",
              ]}
              accent="border-violet-400/20 bg-violet-400/10 text-violet-200"
              preview={<DexPreview />}
            />
          </div>
        </section>

        <section id="security" className="py-16">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-violet-300/80">
                Security and access
              </div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Production-style onboarding, not a fake shortcut.
              </h2>
              <p className="mt-4 text-base leading-8 text-white/64">
                Connect never drops the user directly into the wallet. This
                launch enforces a gated sequence: validate username, reserve
                username, send OTP, verify OTP, then issue the session.
              </p>
              <div className="mt-7 space-y-3">
                {securityPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/72"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="rounded-[30px] border border-white/10 bg-white/5 shadow-panel backdrop-blur-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Launch flow</div>
                    <div className="text-sm text-white/50">
                      Connect → Check Name → Reserve → OTP → Session → Wallet
                    </div>
                  </div>
                  <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                    <Lock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  {[
                    ["01", "Connect clicked", "The user enters a gated onboarding dialog instead of direct wallet access."],
                    ["02", "Availability check", "The selected @tips username is checked with debounce, retries and inline feedback."],
                    ["03", "Reserve state", "Once accepted, the username is locked in pending status for 10 minutes."],
                    ["04", "Verification", "OTP confirms identity and flips the reservation from PENDING to CONFIRMED."],
                    ["05", "Session issued", "A signed JWT becomes an HttpOnly secure cookie before the wallet redirect."],
                  ].map(([index, title, body]) => (
                    <div key={index} className="flex gap-4 rounded-[24px] border border-white/8 bg-white/4 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black">
                        {index}
                      </div>
                      <div>
                        <div className="font-medium text-white">{title}</div>
                        <div className="mt-1 text-sm leading-7 text-white/56">
                          {body}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 border-t border-white/10 py-12 md:grid-cols-3">
          {trustItems.map(({ title, body, icon: Icon }) => (
            <div
              key={title}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-5 text-xl font-semibold">{title}</div>
              <p className="mt-3 text-sm leading-7 text-white/60">{body}</p>
            </div>
          ))}
        </section>
      </div>

      <footer className="relative border-t border-white/10 bg-black/20 px-6 py-8 text-center text-sm text-white/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <div>© 2026 TipsPay. Username reservation and wallet launch infrastructure.</div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white">
              Terms
            </a>
            <a href="mailto:launch@tipspay.org" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>

      {reservationEnabled ? (
        <ReservationDialog open={dialogOpen} setOpen={setDialogOpen} />
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Reservation maintenance mode</DialogTitle>
              <DialogDescription>
                Username reservation is currently disabled by the launch feature
                flag. Wallet and DEX links remain online while the gated flow is
                paused.
              </DialogDescription>
            </DialogHeader>
            <WaitlistMode />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
