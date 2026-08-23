# AWEP2PAWE

**AWEP2PAWE** is a browser-first, static P2P workspace concept combining a modern messenger interface with device-owned resource identities.

## Resource model

- **FID** — shared file identity. The resource is associated with its owner's device and is intended to be available while that device is reachable.
- **PFID** — private file identity protected by a password-derived authorization key.
- **SID** — shared resource identity for a browser-compatible site, application or folder resource.
- **PSID** — private SID protected by password-derived authorization.

## Static-first design

The application is delivered as plain HTML, CSS and JavaScript. There is no required server runtime for loading the interface. Local identity and resource metadata use browser storage; cryptographic primitives are provided by the browser's Web Crypto API.

The repository intentionally contains no framework or package dependency. It can be served directly from any static file host or opened from a local web server.

## Security direction

Private resources must never store a plaintext password. The production protocol should derive authorization material from a password using a memory-hard KDF, bind access to the owner's device identity, encrypt private resource content, and verify every transferred chunk against its expected cryptographic digest.

## P2P direction

A completely static application can implement peer transport in the browser, but peers still need a signaling path or an explicit signaling exchange to discover and establish a connection. This project keeps the UI and resource model independent of a mandatory backend so that the transport layer can evolve without changing the application shell.

## Current static build

The current build provides:

- responsive messenger UI
- light/dark themes
- local AWE ID generation
- chat composer and chat navigation
- FID/PFID/SID/PSID resource creation UI
- local resource registry
- file selection and local FID registration
- copy/share interactions
- browser-local persistence
- mobile layout

The resource cards are the foundation for the real peer protocol; they do not pretend that a browser can bypass its security sandbox or provide cross-device connectivity without a transport/signaling exchange.

## License

See the repository license before redistribution or reuse.
