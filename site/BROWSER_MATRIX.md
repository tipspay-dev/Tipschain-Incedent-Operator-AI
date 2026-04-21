# Browser Matrix

| Browser | Minimum version | Status |
| --- | --- | --- |
| Chrome | 120+ | Required |
| Safari | 17+ | Required |
| Firefox | 121+ | Required |
| Edge | 120+ | Required |
| Safari iOS | 17+ | Required |
| Chrome Android | 120+ | Required |

## Polyfill review

- No View Transitions API is used
- No custom polyfill is required for the current implementation
- OTP countdown relies on `sessionStorage`, `fetch`, and `setTimeout`, all covered by the supported browser matrix
