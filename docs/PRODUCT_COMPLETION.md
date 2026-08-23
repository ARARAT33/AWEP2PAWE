# AWEP2PAWE — product state

## Architecture

AWEP2PAWE is a temporary QR-first P2P messenger. The browser holds session state only in JavaScript memory. It does not use localStorage, sessionStorage, IndexedDB, cookies, cloud databases, cloud file storage, groups, channels, resource IDs, UID lookup, or presence.

### Session flow
1. Browser creates a fresh random rendezvous capability and ephemeral cryptographic identity.
2. The capability and bootstrap public key are encoded into a temporary `awe://connect` QR.
3. A Pages Function holds only the signaling offer/answer/call SDP in isolate memory for a short TTL.
4. The peers establish WebRTC and exchange chat data directly.
5. Closing/reloading the page destroys browser session state; the server-side rendezvous entry expires automatically.

Messages are never written to the signaling function. Files are not uploaded. The signaling endpoint is only a short-lived bootstrap relay.

## Scope
- Temporary QR connection
- Direct WebRTC DataChannel text chat
- Voice call
- Video call
- Screen sharing
- Camera QR scanning with `BarcodeDetector` where supported
- QR image scanning fallback where supported
- Lightweight vanilla JavaScript UI

## Explicitly removed
Persistent UID identity, online/offline presence, contacts, groups, channels, FID/PFID/CFID/SID/PSID resources, local databases, persistent message history, telemetry and cloud content storage.

## Cloudflare usage
Only `/api/signal` is dynamic. Static assets remain normal Pages assets. The function stores only transient signaling state in memory and applies a 60-second TTL. Pages Functions requests count against the Workers request quota; static asset requests do not. This keeps the dynamic surface minimal.
