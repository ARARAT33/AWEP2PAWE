# AWEP2PAWE Product Completion

Living acceptance matrix for the 20-execution build process.

## Execution 1

Implemented: local identity state, local chat/contact/channel/resource state, SHA-256 resource identifiers, IndexedDB blobs, WebRTC data-channel flow, explicit offer/answer, peer hello, text delivery, chunked transfer/backpressure, file integrity metadata, file reconstruction, voice/video/screen media setup, call teardown, XSS-safe text rendering, responsive light UI, 12-language strings, PWA registration.

## Execution 2

Implemented: CSP policy, versioned PWA cache, local chat/message actions, local backup export/import, identity-key exclusion from backup, dynamic chat/message binding and no server persistence.

## Execution 3

Implemented: static WebRTC DataChannel integration, explicit offer/answer exchange, ICE/STUN configuration, connection-state reporting, reconnect/error handling and P2P message bridge.

## Execution 4

Implemented: browser microphone/camera/screen capture, remote media rendering, mute/camera controls, screen-track replacement, media cleanup and call-state handling.

## Execution 5

Implemented: local FID creation from selected files, SHA-256 content hashing, IndexedDB resource persistence, SID/PSID directory selection, per-file metadata/hashing and resource IDs.

## Execution 6

Implemented: MediaRecorder voice-message capture, browser MIME selection, microphone handling, bounded recording, transfer IDs, DataChannel chunks, backpressure, reconstruction and local/remote audio playback.

## Execution 7

Implemented: hardened WebRTC media-call runtime with configurable ICE servers, max-bundle negotiation, ICE/connection state reporting, connection timeout handling, ICE restart recovery, constrained audio capture, video constraints, device enumeration, device switching, screen-track replacement and deterministic media cleanup.

## Execution 8

Implemented: hardened direct P2P transport with versioned signaling packets, strict signal/message size limits, bounded DataChannel buffering, connection-open timeout, ICE failure recovery and reconnect support. No Workers, Functions, cloud database or cloud file storage were introduced.

## Execution 9

Implemented: durable IndexedDB application-state layer with schema versioning and automatic legacy-state migration. Runtime state is mirrored into IndexedDB while preserving the lightweight bootstrap path.

## Execution 10

Implemented: browser-native cryptographic identity bootstrap. A persistent AWE UID is generated with `crypto.randomUUID()`, synchronized into the existing application state before the main runtime starts, and paired with a P-256 ECDSA identity whose private `CryptoKey` is generated non-extractably and persisted directly by IndexedDB. Private key bytes are never serialized into localStorage or application backups.

## Execution 11

Implemented: authoritative IndexedDB identity lifecycle. Existing non-extractable identity records remain the source of truth for the permanent AWE UID, so clearing or losing the localStorage mirror no longer rotates identity. Web Crypto is required for cryptographic identity creation rather than silently falling back to an unprotected identity record, and identity hydration repairs the local UID mirror from the durable record.

## Execution 12

Implemented: persistent identity enforcement and signed identity assertions. Identity initialization fails closed when Web Crypto or IndexedDB is unavailable instead of silently creating an unprotected identity. Identity reads validate the durable non-extractable private key, and `AWEStateStore.identityAssertion()` / `verifyAssertion()` provide a browser-native signed binding between an AWE UID and its public key for authenticated peer handshakes.

## Execution 13

Implemented: removed the duplicate extractable ECDH identity from the main runtime. P2P sessions now use fresh, non-persistent P-256 ECDH session keys while the durable AWE UID and identity remain authoritative in `AWEStateStore`. Signaling and live DataChannel handshakes carry signed identity assertions binding UID, identity key, ephemeral session key and nonce. Replayed handshake nonces are rejected. AES-GCM is used for the application message envelope once the authenticated session is established. Local messages are retained with an explicit `queued` delivery state when the peer is offline instead of falsely reporting successful delivery. File transfer remains bounded and SHA-256 verified.

## Acceptance rule

A feature is complete only when the implementation is real and its observable browser flow is validated. UI-only placeholders do not count.

## Static architecture rule

AWEP2PAWE remains a static/PWA/local-first application. Messages, identities and resource metadata are not uploaded to a cloud database. Files are not stored in cloud storage. Direct WebRTC signaling remains explicit because a browser cannot discover an arbitrary Internet peer from a UID alone without a rendezvous path.

## Current conservative status

Execution: 13 / 20

Estimated product implementation coverage: **~44%**.

This percentage is an engineering coverage estimate, not a test pass rate. The repository has real foundations for identity, local persistence, P2P transport, encrypted session messaging, basic file transfer, media capture/calls, resource IDs, and PWA delivery, but substantial acceptance areas are still incomplete: full messenger actions and synchronization, real group/channel protocols, resumable multi-file/folder transfers, PFID/PSID end-to-end sharing/authorization, CFID resolution, actual browser-compatible SID serving over P2P, complete call signaling/state UX, broader discovery/rendezvous compatibility, comprehensive automated browser/P2P tests, and final performance/security validation.

The final 100% statement is reserved for a verified final execution and must not be inferred from source-code presence alone.
