# AWEP2PAWE

**AWEP2PAWE** is a browser-first, privacy-first static P2P messenger. The application is built from plain HTML, CSS and JavaScript and keeps the connection handshake out-of-band through two QR codes.

## Static architecture

- No application server
- No Worker / Function
- No database
- No account system
- No message API
- No chat relay
- Browser-owned ephemeral session state
- WebRTC DataChannels for peer-to-peer data transport
- Web Crypto for ephemeral key agreement and session verification

The site can be deployed as static files on a static host. The application logic executes in the user's browser.

## Two-QR handshake

AWEP2PAWE intentionally uses two QR exchanges instead of a signaling backend:

```text
Y: Generate temporary offer QR
        ↓
X: Scan offer QR
        ↓
X: Create WebRTC answer
        ↓
X: Show answer QR
        ↓
Y: Scan answer QR
        ↓
X ↔ Y: WebRTC DataChannel
        ↓
Chat / files / calls
```

This is out-of-band signaling. The SDP and ICE information required to establish the session is physically transferred by the users through the QR codes. No signaling server is required.

## Security model

Each connection creates fresh ephemeral browser keys. The runtime derives a session secret from the two ephemeral ECDH keys and exposes a human-readable security code so both peers can compare the session out of band.

The session is temporary and is not an account identity. Closing/resetting the peer state destroys the in-memory connection state.

For production use involving high-value secrets, the cryptographic design should still receive independent security review. Browser cryptography and WebRTC security depend on the browser and operating system security model.

## P2P transport

The runtime uses WebRTC DataChannels for chat and resource transfer. Messages and file chunks are sent directly through the established data channel rather than through an application server. Voice and video calls use WebRTC media connections negotiated over the existing P2P channel.

The runtime uses STUN servers to assist ICE/NAT discovery. STUN is not a signaling server and does not carry the application's chat messages.

Direct connectivity is subject to the network environment. Some restrictive NAT/firewall configurations can prevent a direct WebRTC path without a TURN relay.

## QR handling

QR payloads are versioned and compressed when the browser supports `CompressionStream`. Payloads are short-lived and include an expiry timestamp. The browser rejects malformed, expired, duplicated or unsupported QR payloads.

QR generation and scanning are performed client-side. The QR generator is loaded as a browser asset; the application does not send QR payloads to an application API.

## Privacy

AWEP2PAWE is designed around an ephemeral, local-first connection model. It does not require accounts or a server-side message history. Users should verify the displayed security code on both devices before exchanging sensitive information.

## Testing

`tests/browser-smoke.mjs` exercises the static shell, QR generation, temporary session ID creation, absence of `/api/` requests, and a browser WebRTC DataChannel loopback.
