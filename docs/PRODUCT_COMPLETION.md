# AWEP2PAWE — Product Completion Matrix

**Architecture:** static/PWA/local-first. No Workers, Functions, cloud database, or cloud file storage.

## Verified implementation milestones

| Area | Status | Evidence in repository |
|---|---|---|
| Persistent AWE UID | ✅ | Non-extractable P-256 ECDSA identity in IndexedDB |
| Identity signing/verification | ✅ | `state-store.js` |
| Authenticated WebRTC DataChannel | ✅ | `runtime.js` |
| Session ECDH + AES-GCM | ✅ | `runtime.js` |
| Replay nonce protection | ✅ | `runtime.js` |
| Local application persistence | ✅ | IndexedDB + state migration |
| Local resource storage | ✅ | Chunked IndexedDB resource engine |
| FID/PFID integrity | ✅ | SHA-256 + AES-GCM/PBKDF2 |
| SID/PSID local browser serving | ✅ | `sid-runtime.js` |
| CFID proof/reference | ✅ | `cfid.js` |
| Text messenger | ✅ | `runtime.js` |
| Message local actions | ✅ | `messenger-actions.js` |
| Voice messages | ✅ | `voice-messages.js` |
| File transfer/chunking | ✅ | `runtime.js` |
| WebRTC voice/video/screen media | ✅ | `runtime.js` + media runtime |
| Groups/channels local lifecycle | ✅ | `social-runtime.js` |
| P2P social control packets | ✅ | authenticated DataChannel control path |
| 12 UI languages | ✅ | English + Armenian + 10 additional languages |
| PWA manifest/service worker | ✅ | `manifest.json`, `sw.js` |
| Offline static shell | ✅ | versioned cache v13 |
| CSP/XSS-safe text rendering | ✅ | CSP + escaped user content |
| Static architecture gate | ✅ | `.github/workflows/quality.yml` |
| Shareable static signaling link | ✅ | `static-connect.js` — URL-fragment transport only |
| Complete local-data deletion | ✅ | `state-store.js` deletes local DB and storage |

## Execution history

Executions 1–20 implemented the product foundations through identity, authenticated P2P transport, local persistence, media calls, resource integrity/encryption, messenger actions, social lifecycle, CFID, SID/PSID serving, and static/PWA quality enforcement.

### Post-execution hardening applied

- Added browser-native shareable signaling links using URL fragments. The signaling payload remains in the link; there is no signaling database or application server.
- Added a static signaling-link helper to the connection dialog without introducing a backend.
- Fixed **Clear local data** so it deletes the complete IndexedDB database as well as localStorage, including the durable local identity.
- Fixed the PWA cache manifest so it no longer references the removed `peer-transport.js` runtime and now caches the active static runtime files.
- Bumped the service-worker cache to `awep2pawe-v13` to invalidate the previous offline shell safely.

## Acceptance status

A feature is counted only when implemented in executable code. UI-only claims are not counted.

### Remaining unverified cross-device acceptance

The repository has no two-device browser integration harness in this environment. Therefore the following cannot honestly be marked as 100% automatically validated from source alone: arbitrary-Internet UID discovery, real NAT-path interoperability across independent devices, cross-device group/channel synchronization under failure, end-to-end resource request/response across peers, and full call UX across browser/device combinations.

These are **validation limitations**, not a cloud-backend implementation gap. The product remains static and P2P-only.

## Current conservative whole-product coverage

**Execution: 20 / 20 + post-execution hardening**

**Estimated whole-product implementation coverage: ~96%.**

This percentage is an engineering coverage estimate, not a test-pass percentage. It is intentionally below 100% until the cross-device browser acceptance flows above are actually exercised and observed.

## Static action model

The deployed site performs application actions entirely in the browser: Web Crypto, IndexedDB, Service Worker/PWA caching, WebRTC signaling/data channels/media, local resource processing, and direct peer transfers. The only network data plane used by the product is direct browser networking required by WebRTC/STUN and the explicit peer signaling exchange. No application message/file/resource copy is written to a cloud backend.
