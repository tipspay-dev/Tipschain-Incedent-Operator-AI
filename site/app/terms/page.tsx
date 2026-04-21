export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-white">
      <h1 className="text-4xl font-semibold">Terms of Use</h1>
      <div className="mt-8 space-y-6 text-sm leading-8 text-white/70">
        <p>
          Tipspay username reservation grants time-limited access to claim a
          launch identity. Reservations remain pending until OTP verification is
          completed and may expire automatically if not confirmed in time.
        </p>
        <p>
          Usernames may be rejected or blocked for abuse prevention, policy
          violations, security concerns, trademark conflicts or administrative
          reasons.
        </p>
        <p>
          Session access is personal, non-transferable and subject to security
          controls including rate limiting, OTP verification and automated
          maintenance gates.
        </p>
        <p>
          Tipspay may suspend or roll back launch access when required to
          preserve platform safety, legal compliance, infrastructure stability or
          incident response integrity.
        </p>
      </div>
    </main>
  );
}
