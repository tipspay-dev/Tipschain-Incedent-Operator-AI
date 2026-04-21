# Tipspay Rollback

## Release tag convention

```bash
git tag "release/$(date -u +%F-%H-%M)"
git push origin "release/$(date -u +%F-%H-%M)"
```

## Vercel rollback

```bash
vercel rollback --cwd site --token "$VERCEL_TOKEN"
vercel rollback status --cwd site --token "$VERCEL_TOKEN"
vercel rollback "$VERCEL_ROLLBACK_TARGET" --cwd site --token "$VERCEL_TOKEN"
```

## Railway rollback

```bash
railway deployment list -s "$RAILWAY_SERVICE" -e "$RAILWAY_ENVIRONMENT"
railway redeploy -s "$RAILWAY_SERVICE" -y
```

Railway CLI currently supports redeploying the latest deployment. Rolling back to an older retained deployment is performed from the Railway Deployments view by selecting the target deployment and using **Rollback**.

## Fly.io rollback

```bash
fly releases --app "$FLY_APP_NAME" --image
fly deploy --app "$FLY_APP_NAME" --image "$FLY_ROLLBACK_IMAGE"
fly deploy --app "$FLY_APP_NAME" --image "$FLY_ROLLBACK_IMAGE" --strategy immediate
```

## Database rollback SQL

```sql
DROP TRIGGER IF EXISTS otp_challenges_set_updated_at ON "otp_challenges";
DROP TRIGGER IF EXISTS reservations_set_updated_at ON "reservations";
DROP FUNCTION IF EXISTS set_updated_at();
DROP INDEX IF EXISTS "reservations_active_username_key";
DROP INDEX IF EXISTS "auth_session_expires_idx";
DROP INDEX IF EXISTS "otp_challenge_expires_idx";
DROP INDEX IF EXISTS "reservation_username_status_idx";
DROP INDEX IF EXISTS "otp_challenges_reservation_id_key";
DROP INDEX IF EXISTS "username_blocklist_username_key";
DROP TABLE IF EXISTS "auth_sessions";
DROP TABLE IF EXISTS "username_blocklist";
DROP TABLE IF EXISTS "otp_challenges";
DROP TABLE IF EXISTS "reservations";
DROP TYPE IF EXISTS "OtpChannel";
DROP TYPE IF EXISTS "ReservationStatus";
```

## Cloudflare cache purge

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```
