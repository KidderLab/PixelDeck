# Tailscale Remote Access

This guide explains the recommended way to access PixelDeck remotely for personal use without exposing it directly to the public internet.

## Recommendation

For PixelDeck, the safest free remote-viewing setup is:

- keep PixelDeck bound to localhost on your Windows machine
- run the app locally on port `3000`
- use `tailscale serve 3000` to make it reachable only inside your Tailscale network
- protect your Tailscale account with MFA

This is a better first step than opening router ports or putting the raw local app on the public internet.

## Why Tailscale first

- free for personal use
- no router port forwarding required
- private by default inside your tailnet
- device-level access control
- works well for remote viewing from your laptop, desktop, tablet, or phone
- avoids exposing the current PixelDeck app directly to the public internet

According to the official Tailscale docs, `tailscale serve 3000` proxies a local app running on `http://127.0.0.1:3000` and makes it available inside your tailnet over HTTPS.

Sources:

- [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve)
- [tailscale serve command](https://tailscale.com/kb/1242/tailscale-serve)
- [Install Tailscale](https://tailscale.com/docs/install)
- [Tailnet Lock](https://tailscale.com/kb/1226/tailnet-lock)

## Security model

PixelDeck does not currently have built-in application authentication or app-level two-factor authentication.

So the recommended security boundary is:

- Tailscale identity and device access
- MFA on your Tailscale login provider
- optional Tailnet Lock for stronger node admission security

Important:

- use Tailscale Serve, not Funnel, for PixelDeck unless you intentionally want public internet exposure
- keep PixelDeck listening on localhost only
- do not expose raw port `3000` directly to your LAN or router

## Windows setup steps

### 1. Install Tailscale

Install Tailscale for Windows from:

- [Download Tailscale for Windows](https://tailscale.com/download/windows)

Or follow the official install guide:

- [Install Tailscale](https://tailscale.com/docs/install)

### 2. Sign in to your tailnet

Open Tailscale, sign in, and confirm the Windows machine running PixelDeck is connected.

### 3. Enable MFA on your identity provider

Tailscale itself relies on your login provider for MFA in many common setups. For practical free MFA, enable MFA on the provider you use to sign into Tailscale, such as:

- Google
- Microsoft
- GitHub
- Apple
- other supported SSO identity providers

### 4. Start PixelDeck locally

From `C:\dev\PixelDeck`:

```powershell
.\start-pixeldeck.bat
```

Or manually:

```powershell
pnpm dev
pnpm worker
```

Verify local app access first:

- [http://localhost:3000](http://localhost:3000)

### 5. Enable private remote access through Tailscale Serve

From `C:\dev\PixelDeck`:

```powershell
.\enable-remote-tailscale.bat
```

Or run the command directly:

```powershell
tailscale serve 3000
```

The official docs note that the command may prompt you to enable HTTPS for your tailnet if it is not already enabled.

### 6. Check the private URL

Run:

```powershell
tailscale serve status
```

This will show the private HTTPS address available to devices in your tailnet.

### 7. Open PixelDeck from another device

On another device signed into the same tailnet, open the Tailscale Serve URL shown by `tailscale serve status`.

## Optional hardening

### Enable Tailnet Lock

If you want extra protection over which devices can join your tailnet, consider Tailnet Lock.

Official docs:

- [Tailnet Lock](https://tailscale.com/kb/1226/tailnet-lock)
- [tailscale lock command](https://tailscale.com/kb/1243/tailscale-lock)

This is optional and more advanced, but it adds stronger control over node admission.

### Keep PixelDeck local-only

Do not modify PixelDeck to listen publicly unless you also add proper app authentication, session management, authorization checks, and hardened reverse-proxy rules.

## Daily-use workflow

1. Start PixelDeck:

```powershell
cd C:\dev\PixelDeck
.\start-pixeldeck.bat
```

2. If needed, re-enable Tailscale Serve:

```powershell
cd C:\dev\PixelDeck
.\enable-remote-tailscale.bat
```

3. Confirm remote URL:

```powershell
tailscale serve status
```

4. Open the private Tailscale URL from another device on your tailnet.

## Troubleshooting

### `tailscale` not recognized

Tailscale is not installed or not on PATH. Install the Windows client and reopen PowerShell.

### `tailscale serve 3000` fails

Check all of these:

- Tailscale is signed in
- the device is connected to your tailnet
- PixelDeck is already running locally on port `3000`
- HTTPS is enabled in your tailnet if the CLI prompts for it

### I can open PixelDeck locally but not remotely

Run:

```powershell
tailscale serve status
```

If there is no active Serve configuration, re-run:

```powershell
tailscale serve 3000
```


