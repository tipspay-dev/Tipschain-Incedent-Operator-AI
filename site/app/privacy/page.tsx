export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-white">
      <h1 className="text-4xl font-semibold">Privacy Policy</h1>
      <div className="mt-8 space-y-6 text-sm leading-8 text-white/70">
        <p>
          Tipspay uses the minimum personal data required to reserve usernames,
          deliver one-time passwords, create secure wallet sessions and monitor
          the safety of the launch environment.
        </p>
        <p>
          Reservation data may include your chosen username, email address,
          phone number, session identifiers, verification timestamps and security
          telemetry such as request IP metadata and rate limit events.
        </p>
        <p>
          Tipspay stores OTP codes only as SHA-256 hashes, applies strict
          expiration windows, and issues session cookies using HttpOnly, Secure
          and SameSite=Strict protections.
        </p>
        <p>
          Optional analytics are loaded only after cookie consent is accepted.
          Essential security logging remains enabled to protect the service from
          abuse and to support incident response.
        </p>
      </div>
    </main>
  );
}
