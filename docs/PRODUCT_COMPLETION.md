# AWEP2PAWE — Product Completion Matrix

**Architecture:** pure static/local-first/P2P. No PWA, Service Worker, Workers, Functions, cloud database, or cloud file storage.

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
| Pure static entrypoint | ✅ | `index.html` has no manifest or service-worker registration |
| Static browser validation | ✅ | `.github/workflows/quality.yml` |
| Shareable static signaling link | ✅ | `static-connect.js` — URL-fragment transport only |
| Complete local-data deletion | ✅ | `state-store.js` deletes local DB and storage |
| Real browser smoke validation | ✅ | `tests/browser-smoke.mjs` validates UID, static-only runtime, WebRTC DataChannel and signaling |

## Static architecture

The deployed site is intentionally a normal static website. GitHub Pages, Cloudflare Pages static hosting, or any ordinary HTTP server can serve the files without a Worker, Function, database, object store, manifest, or Service Worker. Application state remains in the browser; P2P transport uses WebRTC and explicit peer signaling.

## Acceptance status

A feature is counted only when implemented in executable code. UI-only claims are not counted.

Independent-device/NAT traversal, cross-browser interoperability, and all physical-device call combinations cannot be exhaustively proven by a single CI browser. The browser smoke test therefore validates the executable static runtime and local WebRTC path without claiming that a local loopback proves every Internet topology.

## Current whole-product coverage

**Execution: 20 / 20 + static hardening**

**Estimated whole-product implementation coverage: ~97%.**

This is an engineering coverage estimate, not a test-pass percentage. The remaining gap represents independent-device/network interoperability and broader field validation, not a missing cloud backend.

## Privacy model

No application message, file, resource, or private profile is copied to a cloud service by the static application. Local secrets and metadata stay in browser storage. Direct peer communication is performed through browser-native WebRTC APIs and explicit signaling exchange.
