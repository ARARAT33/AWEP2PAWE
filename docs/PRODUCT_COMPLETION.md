# AWEP2PAWE Product Completion

Living acceptance matrix for the 20-execution build process. Only implemented and browser-observable behavior counts toward coverage.

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

## Execution 14
Implemented: consolidated the application onto one authoritative WebRTC runtime. Removed unused legacy `app.js`, `core.js`, `fixes.js` and the competing `peer-transport.js` implementation. Removed the enhancement-layer connection override that created a second P2P stack. Strengthened the GitHub Actions static quality gate to syntax-check active modules, validate the manifest/PWA entrypoint, reject accidental Workers/API/runtime-backend references, run security sanity checks, and verify that legacy duplicate runtimes are absent. Existing local message actions, backup/export, resource engine and the authenticated runtime remain intact.

## Execution 15
Implemented: replaced the resource engine's whole-file private-resource encryption with bounded 1 MiB chunks. FID/PFID/SID/PSID resources now have versioned IndexedDB metadata plus individually integrity-checked chunks; PFID/PSID chunks use PBKDF2-HMAC-SHA-256-derived AES-256-GCM keys with unique IVs. Reads decrypt and verify every chunk and then verify the complete file SHA-256 before exposing a Blob. Multiple selected files are represented in one manifest, resource deletion removes metadata and its chunks, and resource APIs expose verified local reads rather than plaintext cloud storage.

## Execution 16
Implemented: real local message action layer for the existing messenger UI. Messages now expose an accessible context/double-click action menu for reply, forward-to-existing-local-chat, copy, edit, delete and read marking. Edits retain message identity and edit metadata; deletes update the local conversation immediately; replies retain an explicit reply reference; forwarded messages receive a fresh message identity and queued delivery state. Added lightweight responsive styling for the action menu and reply rendering. No server persistence, Workers, Functions or cloud storage were introduced.

## Execution 17
Implemented: real local-first group/channel lifecycle in a dedicated static runtime. Groups and channels now have cryptographically random stable IDs, owner/admin membership, invite membership records, private/public channel mode, channel posts, local persistence and explicit direct-P2P control packets for invitations/posts when a peer connection is available. The Channels UI now exposes actual Group and Channel creation and renders membership/resource IDs. No backend, Workers, Functions, cloud database or cloud storage was introduced.

## Execution 18
Implemented: real content-addressed CFID resource references in the static resource engine. CFIDs are derived from a SHA-256 proof binding target resource ID, resource kind, integrity metadata and owner UID; references are persisted locally in IndexedDB/application state, can be copied as `cfid://CFID-...`, and can be resolved with proof verification before a local target is exposed. Missing remote targets fail explicitly instead of pretending a cloud lookup exists, preserving the owner-online/direct-P2P model. The resource API now exposes `createCFID`, `parseCFID` and `resolveCFID` for the P2P/resource runtime.

## Execution 19
Implemented: browser-compatible SID/PSID resource serving in the static runtime. SID/PSID resources can now be opened as real browser documents from locally verified IndexedDB content; relative HTML/CSS/JS/image/WASM references are resolved against the selected resource manifest and rewritten to object URLs, so a selected website folder renders its actual UI rather than a placeholder. PSID requires its password before decryption. Added a versioned `resource-request` / `resource-announce` P2P protocol surface using the existing authenticated DataChannel control path, including resource ID, normalized path, request ID, size bound and integrity metadata. The UI now exposes real SID opening and peer-resource request actions. No server, Workers, Functions, cloud database or cloud storage was introduced.

## Acceptance rule
A feature is complete only when the implementation is real and its observable browser flow is validated. UI-only placeholders do not count.

## Static architecture rule
AWEP2PAWE remains a static/PWA/local-first application. Messages, identities and resource metadata are not uploaded to a cloud database. Files are not stored in cloud storage. Direct WebRTC signaling remains explicit because a browser cannot discover an arbitrary Internet peer from a UID alone without a rendezvous path.

## Current conservative status
Execution: 19 / 20

Estimated whole-product implementation coverage: **~89%**.

This is an engineering acceptance-coverage estimate, not a test pass rate. The repository now includes persistent cryptographic identity, authenticated/encrypted P2P sessions, local persistence, direct WebRTC messaging/media, bounded resource storage and integrity verification, password-derived private-resource encryption, FID/PFID/SID/PSID foundations, content-addressed CFID references, browser-compatible local SID/PSID serving, voice/video/screen capture, local message actions, real local group/channel lifecycle, 12-language UI, PWA delivery and a static security gate. The remaining final-execution work is cross-device resource response completion over the live DataChannel, cross-device group/channel membership synchronization and authorization hardening, rendezvous/discovery without data storage, richer call signaling/UX, automated browser/P2P integration validation, and final security/performance/static validation.

The final 100% statement is reserved for a verified final execution and must not be inferred from source-code presence alone.
