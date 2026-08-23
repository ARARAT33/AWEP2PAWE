# AWEP2PAWE

**AWEP2PAWE** is a browser-first, 100% static P2P workspace combining a messenger interface with device-owned resource identities.

## Resource model

- **FID** — public file identity. The file is kept in the owner's browser storage and can be requested while the owner is connected.
- **PFID** — private file identity. The local file is encrypted and access requires the password plus an active owner session.
- **SID** — shared identity for browser-oriented site/resource content.
- **PSID** — private SID protected by password-derived authorization.
- **AWE ID** — the local identity label for the current browser profile.

## Static architecture

The application is plain HTML, CSS and JavaScript. It has no required application backend and no package/framework dependency. It uses browser APIs including IndexedDB, Web Crypto and WebRTC DataChannels.

The site can therefore be deployed as static files. The P2P runtime itself executes inside the browser.

## P2P transport

The current runtime contains a WebRTC DataChannel flow. Connection descriptions are exchanged as text between users, so a mandatory signaling server is not required by the static application. The data channel can carry chat messages and resource transfers directly between peers.

A network that blocks direct WebRTC connectivity may prevent a direct connection. A future relay/signaling layer can be added as an optional network component without changing the static application shell.

## Resource integrity

Public file identities are derived from SHA-256 content hashes. Received file bytes are verified against the announced hash before the browser releases the download.

## Private resources

Private file content uses browser Web Crypto primitives with PBKDF2-derived AES-256-GCM keys. Plaintext passwords are not stored. The security model is local-first and should receive independent cryptographic review before production use for high-value secrets.

## Local-first storage

Resource metadata, preferences and message records stay in browser storage. File content is stored locally for the owner's active browser profile.

## UI

The static interface includes Armenian responsive messenger screens, chats, contacts, resources, files, P2P controls, settings and light/dark themes.

The design intentionally keeps the messenger experience inside one static application while the FID/PFID/SID/PSID layer handles device-owned resources.
