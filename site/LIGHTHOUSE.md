# Lighthouse Targets

## Minimum scores

| Category | Target |
| --- | --- |
| Performance | >= 90 |
| Accessibility | >= 95 |
| Best Practices | >= 95 |
| SEO | 100 |

## CI enforcement

- Config file: `site/lighthouserc.js`
- Workflow: `.github/workflows/lighthouse.yml`
- Action: `treosh/lighthouse-ci-action@v12`
- Build fails when any category score drops below the target

## Local verification

```bash
cd site
npm install
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
npx lhci autorun --config=./lighthouserc.js
```
