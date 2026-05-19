# Celestial Wallet — Implementation Reference

> Complete record of every package and file built so far. Covers architecture, security model, data flows, and file-by-file decisions.

---

## Table of Contents

1. [Monorepo Architecture](#1-monorepo-architecture)
2. [packages/shared-types](#2-packagesshared-types)
3. [packages/core-crypto](#3-packagescore-crypto)
4. [apps/extension — Scaffold & Config](#4-appsextension--scaffold--config)
5. [apps/extension — Background Service Worker](#5-appsextension--background-service-worker)
6. [apps/extension — Popup UI](#6-appsextension--popup-ui)
7. [Security Model](#7-security-model)
8. [Key Design Decisions & Non-Obvious Choices](#8-key-design-decisions--non-obvious-choices)
9. [What's Not Yet Built](#9-whats-not-yet-built)

---

## 1. Monorepo Architecture

**Root:** `celestial/`  
**Package manager:** pnpm 9 with workspaces  
**Build orchestration:** Turborepo 2.9

```
apps/
  extension/       Chrome MV3 extension (React + Vite + @crxjs/vite-plugin)
  proxy-server/    Node.js — secure CEX API routing          [not yet built]
  bot-engine/      On-chain execution engine                  [not yet built]
  docs/            Next.js docs app                           [scaffold only]
  web/             Next.js marketing site                     [scaffold only]

packages/
  shared-types/    @celestial/shared-types — pure TypeScript types, zero deps
  core-crypto/     @celestial/core-crypto  — browser-safe cryptographic primitives
  ui-kit/          @celestial/ui-kit       — glassmorphism component library  [not yet built]
  typescript-config/   @repo/typescript-config — base tsconfig
  eslint-config/       @repo/eslint-config
```

**Package import convention:** All internal packages are consumed as source via `"main": "./src/index.ts"`. Vite bundles everything at app build time — no per-package compile step is needed.

**TypeScript settings:**
- Packages use `"moduleResolution": "NodeNext"` — `.js` extensions required in imports
- `apps/extension` uses `"moduleResolution": "Bundler"` — no extensions needed (Vite handles it)
- `"lib": ["es2022", "DOM", "DOM.Iterable"]` everywhere
- TypeScript 5.9: `Uint8Array` is now generic — `Uint8Array<ArrayBuffer>` is required for all Web Crypto API calls

---

## 2. packages/shared-types

**Package name:** `@celestial/shared-types`  
**Location:** `packages/shared-types/src/`  
**Zero runtime dependencies.**

This package is the single source of truth for every type used across all packages. Nothing in the system makes up its own types — everything flows through here.

### Source files

#### `chains.ts`
Defines the chain taxonomy.

```typescript
enum ChainId {
  ETHEREUM = 1, OPTIMISM = 10, BSC = 56, POLYGON = 137,
  BASE = 8453, ARBITRUM = 42161, SOLANA = 900_000_001,
  BITCOIN = 900_000_002, SEPOLIA = 11155111, ...
}

enum ChainFamily { EVM = 'evm', SVM = 'svm', UTXO = 'utxo' }

interface NetworkConfig {
  chainId, name, shortName, family,
  rpcUrls, blockExplorerUrl, nativeCurrency,
  isTestnet, coingeckoChainId?
}
```

Non-EVM chains use synthetic IDs above `900_000_000` — guaranteed never to collide with real EVM chain IDs (EIP-155).

#### `wallet.ts`
HD wallet and account metadata.

```typescript
enum DerivationStandard { BIP44 = 'bip44', BIP84 = 'bip84', SVM = 'svm' }

interface Account {
  id, walletId, name, address,      // checksum EVM | base58 SOL | bech32 BTC
  chainFamily, chainId,
  derivationPath,                    // full BIP32 path string
  index                              // account index within wallet
}

interface KeyringAccount extends Account {
  privateKeyHex: string              // in-memory only, never persisted
}
```

#### `vault.ts`
Encrypted storage structures.

```typescript
interface AesGcmPayload { iv: string; ciphertext: string; tag: string }

interface EncryptedVault {
  version: number;
  salt: string;                            // base64url PBKDF2 salt
  mnemonic: AesGcmPayload;                 // encrypted BIP-39 phrase
  accounts: Record<AccountId, AesGcmPayload>;     // encrypted private keys
  cexCredentials: Record<string, AesGcmPayload>;  // encrypted API credentials
}
```

#### `errors.ts`
Typed error codes — `CelestialErrorCode` enum. Covers: `VAULT_LOCKED`, `VAULT_NOT_FOUND`, `VAULT_WRONG_PASSWORD`, `VAULT_ALREADY_EXISTS`, `VALIDATION_ERROR`, `NOT_IMPLEMENTED`, `INTERNAL_ERROR`, `MESSAGE_UNKNOWN_TYPE`, etc.

#### `messaging.ts`
The complete message bus — 60+ types. Key structures:

```typescript
enum MessageTarget { BACKGROUND, POPUP, CONTENT_SCRIPT }

enum MessageType {
  // Vault lifecycle (7 types)
  VAULT_CREATE, VAULT_IMPORT, VAULT_UNLOCK, VAULT_LOCK,
  VAULT_CHANGE_PASSWORD, VAULT_STATE_GET, VAULT_STATE_SYNC,

  // Account management (6 types)
  ACCOUNT_CREATE, ACCOUNT_RENAME, ACCOUNT_LIST,
  ACCOUNT_SWITCH, ACCOUNT_REMOVE, ACCOUNT_EXPORT_KEY,

  // Network (4 types)
  NETWORK_SWITCH, NETWORK_LIST, NETWORK_ADD_CUSTOM, NETWORK_REMOVE_CUSTOM,

  // Portfolio, transactions, gas, swap, dApp, settings, CEX (40+ types)
  ...

  POPUP_INIT  // popup bootstrap handshake
}

interface ExtensionMessage<TPayload> {
  type: MessageType; target: MessageTarget;
  payload: TPayload; requestId: string; origin?: string;
}

type AnyExtensionResponse<T> = ExtensionResponse<T> | ExtensionErrorResponse;
```

Every async request carries a `requestId` (UUID) for correlation. Every response carries the same `requestId`. Errors always include a `CelestialErrorCode` enum value — no raw strings.

#### `transaction.ts`, `token.ts`, `cex.ts`, `ui.ts`
- `transaction.ts` — `EvmTransactionRequest`, `SolanaTransactionRequest`, `BaseTxRecord`, fee estimate types
- `token.ts` — `PortfolioSnapshot`, `TokenBalance`, `SwapQuote`
- `cex.ts` — `ExchangeId`, `CexCredentialsMeta`, `CexPermission`
- `ui.ts` — `PopupState`, `AppView`, `WalletSettings`, `ConnectedDApp`, `DAppRequest`, `Currency`, `Language`

---

## 3. packages/core-crypto

**Package name:** `@celestial/core-crypto`  
**Location:** `packages/core-crypto/src/`  
**Constraint:** Pure browser environment — zero Node.js imports. Web Crypto API and pure-JS libraries only.

**External dependencies:**
- `@scure/bip39` — BIP-39 mnemonic wordlist and entropy
- `@scure/bip32` — BIP-32 HD key derivation (secp256k1)
- `@noble/curves` — secp256k1 signing (EVM), ed25519 signing (Solana)
- `@noble/hashes` — SHA-256, Keccak-256, HMAC-SHA512
- `@scure/base` — base58, bech32, base64 encoding

### `utils.ts`
Low-level byte conversion helpers. All functions are annotated to return `Uint8Array<ArrayBuffer>` specifically (not `Uint8Array<ArrayBufferLike>`) to satisfy the Web Crypto API's `BufferSource` constraint in TypeScript 5.9.

```typescript
randomBytes(length)       → Uint8Array<ArrayBuffer>   // crypto.getRandomValues
utf8ToBytes(str)          → Uint8Array<ArrayBuffer>   // TextEncoder + .slice()
bytesToUtf8(bytes)        → string
toHex(bytes)              → string
fromHex(hex)              → Uint8Array<ArrayBuffer>
toBase64Url(bytes)        → string
fromBase64Url(str)        → Uint8Array<ArrayBuffer>
toBase64(bytes)           → string
fromBase64(str)           → Uint8Array<ArrayBuffer>
```

The `.slice()` call on `TextEncoder.encode()` output is critical — `TextEncoder` returns `Uint8Array<ArrayBufferLike>`, and `.slice()` is typed to always return `Uint8Array<ArrayBuffer>`.

### `aes-gcm.ts`
AES-256-GCM encryption and decryption via Web Crypto API (`crypto.subtle`).

```typescript
aesGcmEncrypt(key: CryptoKey, plaintext: Uint8Array) → Promise<AesGcmPayload>
aesGcmDecrypt(key: CryptoKey, payload: AesGcmPayload) → Promise<Uint8Array<ArrayBuffer>>
```

- **IV:** 12 random bytes per encryption, stored in the payload
- **Tag:** 128-bit GCM auth tag separated from ciphertext and stored independently
- **Auth failure:** `crypto.subtle.decrypt` throws `DOMException` on wrong key/tampered data — propagates to callers as a password-wrong signal

### `pbkdf2.ts`
PBKDF2-SHA256 key derivation — transforms a user password into a non-extractable `CryptoKey`.

```typescript
deriveVaultKey(password: string, salt: string | Uint8Array) → Promise<CryptoKey>
generateSaltBase64Url() → string   // 16 random bytes, base64url-encoded
```

Parameters follow OWASP 2023 recommendations:
- **600,000 iterations** — deliberate; makes brute-force attacks expensive
- **128-bit salt** — prevents rainbow table attacks
- **256-bit AES-GCM key** — `extractable: false` so the raw key bytes can never leave the JS VM

### `mnemonic.ts`
BIP-39 mnemonic generation and validation.

```typescript
generateMnemonic(strength: 128 | 256 = 128) → string   // 12 or 24 words
validateMnemonic(mnemonic: string) → boolean
mnemonicToSeed(mnemonic, passphrase?) → Promise<Uint8Array>
```

Uses `@scure/bip39` with the standard English wordlist. The 64-byte seed returned by `mnemonicToSeed` is the root input for all HD key derivation.

### `vault.ts`
High-level vault operations — orchestrates `aes-gcm.ts` and `pbkdf2.ts`.

```typescript
createVault(mnemonic, password)             → Promise<EncryptedVault>
decryptVaultMnemonic(vault, password)       → Promise<string>
addAccountToVault(vault, password, id, key) → Promise<EncryptedVault>
decryptAccountKey(vault, password, id)      → Promise<string>
removeAccountFromVault(vault, id)           → EncryptedVault   // no password needed
addCexCredentialToVault(vault, password, id, creds) → Promise<EncryptedVault>
decryptCexCredential(vault, password, id)   → Promise<CexCredentialPlaintext>
removeCexCredentialFromVault(vault, id)     → EncryptedVault
changeVaultPassword(vault, oldPw, newPw)   → Promise<EncryptedVault>
```

**Password change flow:** Bulk-decrypts the entire vault under the old key, generates a fresh PBKDF2 salt, re-encrypts everything under the new key. The salt rotation on password change prevents attackers who observed a previous ciphertext from re-using any precomputed work.

**`removeAccount` requires no password** because it only drops a ciphertext blob from the map — it never reads the plaintext.

### `derive-evm.ts`
EVM account derivation — BIP-44 path, secp256k1, EIP-55 checksummed addresses.

```typescript
buildEvmDerivationPath(accountIndex: number) → string  // m/44'/60'/0'/0/{index}
deriveEvmAccount(seed, path) → { privateKeyHex, address, derivationPath }
privateKeyToEvmAddress(privateKeyHex) → string          // EIP-55 checksum
signEvmPersonalMessage(privateKeyHex, message) → string // EIP-191, r||s||v hex
signEvmDigest(privateKeyHex, digest32) → string         // raw 32-byte digest signing
```

EIP-55 checksum: Keccak-256 hash of the lowercase address hex, then uppercase each character where the corresponding nibble of the hash is ≥ 8.

### `derive-svm.ts`
Solana account derivation — SLIP-0010 ed25519, hardened-only paths, Phantom-compatible keypair format.

```typescript
buildSolanaDerivationPath(accountIndex) → string   // m/44'/501'/{index}'/0'
deriveSolanaAccount(seed, path) → { privateKeyHex, address, derivationPath }
signSolanaMessage(privateKeyBase58, message) → string   // base64 signature
```

**Custom SLIP-0010 implementation:** `@scure/bip32` only supports secp256k1. Solana uses ed25519 with hardened-only derivation. The implementation uses HMAC-SHA512 with the "ed25519 seed" key for the master node, then repeatedly HMAC-SHA512 derives child nodes. Non-hardened segments throw immediately.

**Phantom-compatible format:** Stores a 64-byte keypair (32-byte seed || 32-byte public key) encoded as base58 — matching Phantom Wallet's internal format for consistent import/export.

### `derive-utxo.ts`
Bitcoin account derivation — BIP-84 native SegWit (P2WPKH), bech32 addresses, WIF encoding.

```typescript
buildBitcoinDerivationPath(accountIndex, isTestnet) → string  // m/84'/0'/{index}'/0/0
deriveBitcoinAccount(seed, path, isTestnet) → { privateKeyHex, address, derivationPath }
decodeWif(wif) → { privateKey: Uint8Array, isTestnet: boolean }
```

P2WPKH address construction: SHA256 → RIPEMD160 hash of the compressed public key, then bech32-encode with prefix `bc1` (mainnet) or `tb1` (testnet). WIF encoding includes a double-SHA256 checksum and is validated on decode.

---

## 4. apps/extension — Scaffold & Config

**Package name:** `@celestial/extension`  
**Build tool:** Vite 5 + `@crxjs/vite-plugin@2.0.0-beta.33`  
**UI:** React 19, Framer Motion 11, Tailwind CSS 3

### `manifest.json` (MV3)

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "alarms", "tabs", "scripting", "notifications"],
  "background": { "service_worker": "src/background/index.ts", "type": "module" },
  "action": { "default_popup": "src/popup/index.html" },
  "content_scripts": [{
    "matches": ["http://*/*", "https://*/*"],
    "js": ["src/content/index.ts"],
    "run_at": "document_start",
    "world": "ISOLATED"
  }]
}
```

`"alarms"` permission is required for the auto-lock timer to survive across service worker restarts. `"scripting"` is reserved for future EIP-1193 inpage provider injection via `chrome.scripting.executeScript`.

### `vite.config.ts`

```typescript
defineConfig({
  plugins: [react(), crx({ manifest })],
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: true, minify: false },
  resolve: { conditions: ['browser', 'import', 'module', 'default'] },
})
```

`resolve.conditions` forces all workspace packages to use their browser-compatible export conditions, preventing Node.js modules from accidentally being bundled into the extension.

### `tailwind.config.ts` — Cosmic Moonlight Theme

Custom color system built around true black and cool lunar tones. All warm purples and cyans have been eliminated.

| Token | Value | Purpose |
|---|---|---|
| `void.DEFAULT` | `#000000` | True black — main background |
| `void.50` | `#05080c` | Deepest card background |
| `void.100` | `#090e15` | Secondary card |
| `void.200` | `#0e1720` | Hover states |
| `nebula.DEFAULT` | `#4a80a0` | Primary accent — icy steel blue |
| `nebula.light` | `#8ab8d4` | Active tab indicators, highlights |
| `nebula.dark` | `#1e4a68` | Button hover states |
| `aurora.DEFAULT` | `#2a90b0` | Secondary accent — cool arctic teal |
| `moon.DEFAULT` | `#c4d8ec` | Moonlight silver |
| `moon.bright` | `#dceefa` | Bright moonlight |
| `moon.glow` | `#eaf4ff` | Near-white glow |
| `star.DEFAULT` | `#eef4fa` | Primary text — cool near-white |
| `star.muted` | `#687888` | Secondary text |
| `star.dim` | `#2e3e50` | Placeholder text |
| `success` | `#22aa7a` | Positive/connected states |
| `danger` | `#c04860` | Errors, warnings |

**Custom animations:** `pulse-slow`, `float` (subtle vertical oscillation for the logo), `shimmer` (loading skeleton).

**Glass utilities (defined in `index.css`):**

```css
.glass        { background: rgba(5,8,12,0.72); border: 1px solid rgba(74,128,160,0.16); backdrop-filter: blur(20px); }
.glass-strong { background: rgba(5,8,12,0.90); border: 1px solid rgba(74,128,160,0.28); backdrop-filter: blur(32px); }
.glass-input  { background: rgba(9,14,21,0.75); border: 1px solid rgba(74,128,160,0.22); }
.btn-primary  { bg-nebula; box-shadow: 0 0 20px rgba(74,128,160,0.35); }
.gradient-text { background: linear-gradient(135deg, #c8dcf0 0%, #6aaccc 100%); }
```

### Popup dimensions
`600px × 800px` (portrait) — matches the Phantom Wallet footprint. Constrained in `index.css` on `html, body, #root`.

---

## 5. apps/extension — Background Service Worker

All background files live in `src/background/`. The service worker is the security perimeter — it holds the `CryptoKey` in memory and enforces every access check.

### `src/background/index.ts`
Entry point. Wires three Chrome event listeners:

1. **`chrome.runtime.onMessage`** — Routes all incoming messages through `routeMessage()`. Returns `true` synchronously to signal async response (required for MV3).
2. **`chrome.alarms.onAlarm`** — Responds to `celestial/autolock` alarm by calling `clearSession()` and pushing `VAULT_STATE_SYNC` to the popup.
3. **`chrome.runtime.onInstalled`** — Opens the popup on first install.

### `src/background/session.ts`
Module-level in-memory state — wiped when the service worker is terminated.

```typescript
interface SessionState {
  isUnlocked: boolean;
  vaultKey: CryptoKey | null;   // non-extractable — never leaves memory
  accounts: Account[];
  activeAccountId: AccountId | null;
  activeChainId: ChainId;
  autoLockMs: number;
}
```

`clearSession()` preserves `autoLockMs` so the next unlock can reschedule the alarm with the same setting without re-reading `chrome.storage`.

**Why module-level state is the auto-lock mechanism:** MV3 service workers terminate after ~30 seconds of inactivity. The moment the SW terminates, `_state` is garbage-collected. When the popup next opens it sends `POPUP_INIT`, which reads `isUnlocked: false` from the fresh session, and the UI routes to the Unlock screen. No explicit timeout is needed for this path — it's inherent to the MV3 lifecycle.

### `src/background/storage.ts`
Type-safe wrappers around `chrome.storage.local`. Every key is namespaced with a `celestial/` prefix.

```typescript
getVault() / setVault() / clearVault()
getSettings() / setSettings() / patchSettings()
getCustomNetworks() / setCustomNetworks()
getConnectedDApps() / setConnectedDApps()
getCexMeta() / setCexMeta()
```

The encrypted vault blob is the only sensitive object written to storage. The `CryptoKey` (from `session.ts`) and decrypted key material are never written.

### `src/background/router.ts`
Set-based dispatcher. Maps each `MessageType` to a handler domain using `Set<MessageType>` membership checks, then delegates to the appropriate handler module.

```typescript
const VAULT_TYPES   = new Set([VAULT_UNLOCK, VAULT_LOCK, VAULT_CREATE, ...POPUP_INIT])
const ACCOUNT_TYPES = new Set([ACCOUNT_CREATE, ACCOUNT_RENAME, ...])
const NETWORK_TYPES = new Set([NETWORK_SWITCH, NETWORK_LIST, ...])
```

All errors thrown inside any handler are caught here and returned as a structured `ExtensionErrorResponse` — the popup always receives a reply object, never a rejected promise.

### `src/background/handlers/vault.ts`
The most critical handler. Implements:

| MessageType | What it does |
|---|---|
| `POPUP_INIT` | Reads vault existence, session state, settings, custom networks, connected dApps, CEX metadata. Returns the complete `PopupInitResponse` — the single hydration call on every popup open. |
| `VAULT_CREATE` | Validates mnemonic → `createVault()` → `deriveAndStoreFirstAccount()` (BIP-44 index 0, EVM) → writes vault to storage → caches `vaultKey` in session → schedules auto-lock alarm. Returns mnemonic to popup exactly once. |
| `VAULT_IMPORT` | Same as `VAULT_CREATE` but checks that no vault already exists first. |
| `VAULT_UNLOCK` | Attempts `decryptVaultMnemonic()` — if it throws, returns `VAULT_WRONG_PASSWORD`. On success, re-derives accounts, caches key, schedules alarm. |
| `VAULT_LOCK` | Clears auto-lock alarm → `clearSession()`. |
| `VAULT_CHANGE_PASSWORD` | Calls `changeVaultPassword()` (which validates old password internally) → writes new vault → updates session with new `CryptoKey`. |
| `VAULT_STATE_GET` | Returns current `VaultState` snapshot. |

`requireUnlockedVault(requestId)` is an exported helper used by account and other handlers to gate operations behind a session check without duplicating the unlock logic.

### `src/background/handlers/account.ts`
Implements `ACCOUNT_LIST`, `ACCOUNT_SWITCH`, `ACCOUNT_RENAME`, `ACCOUNT_EXPORT_KEY`. `ACCOUNT_CREATE` returns `NOT_IMPLEMENTED` pending password being added to the payload type.

`ACCOUNT_EXPORT_KEY` requires the user to re-enter their password before returning the private key — prevents shoulder-surfing attacks where someone who left the popup open could export keys.

### `src/background/handlers/network.ts`
Implements `NETWORK_LIST` (merges built-in + custom networks), `NETWORK_SWITCH` (updates session `activeChainId`), `NETWORK_ADD_CUSTOM`, `NETWORK_REMOVE_CUSTOM`.

### `src/shared/constants.ts`
Defines 8 built-in networks: Ethereum, Base, Arbitrum One, Optimism, Polygon, BNB Smart Chain, Solana, Sepolia.

`NETWORK_BY_CHAIN_ID` is a `ReadonlyMap<ChainId, NetworkConfig>` for O(1) lookup by chain ID.

`DEFAULT_SETTINGS`: `autoLockMs=300000` (5 min), `currency=USD`, `slippageBps=50`, `analyticsEnabled=false`, `testnetVisible=false`.

### `src/shared/messaging.ts`
Type-safe message construction and transport helpers.

```typescript
sendToBackground<TData>(type, payload) → Promise<AnyExtensionResponse<TData>>
pushToPopup(type, payload)             // fire-and-forget, ignores no-popup errors
successResponse(requestId, data)       → ExtensionResponse<T>
errorResponse(requestId, code: CelestialErrorCode, message) → ExtensionErrorResponse
isSuccess(res)                         → type guard
```

### `src/content/index.ts`
ISOLATED-world content script. Bridges dApp pages to the background SW.

**Message flow:**
```
dApp page (MAIN world)
  → window.postMessage({ target: 'celestial_cs', id, method, params })
  → content script (ISOLATED world)
  → chrome.runtime.sendMessage({ type: 'dapp/rpc', ... })
  → background SW
  → response
  → content script
  → window.postMessage({ target: 'celestial_page', id, response })
  → dApp page's pending Promise resolves
```

The `target` filter (`event.data.target !== 'celestial_cs'`) prevents the content script from capturing unrelated `postMessage` events from the page. The full EIP-1193 inpage provider (`window.ethereum`) is deferred to Sprint 2.

---

## 6. apps/extension — Popup UI

All popup files live in `src/popup/`. The popup is a standard React 19 SPA — no routing library. View transitions are handled by `AnimatePresence` from Framer Motion.

### `src/popup/main.tsx`
```typescript
createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
)
```

### `src/popup/App.tsx`
Top-level state machine and router.

**State shape:**
```typescript
{
  status: 'loading' | 'ready' | 'error',
  popupState: PopupState | null,
  accounts: Account[],
  networks: NetworkConfig[],
  cexCredentials: CexCredentialsMeta[],
}
```

**Boot sequence:**
1. On mount, sends `POPUP_INIT` to the background
2. Background returns `PopupInitResponse` with full state, networks, connected dApps, CEX credentials
3. Reducer transitions to `status: 'ready'`
4. Active view is computed: no vault → `ONBOARDING`, locked → `UNLOCK`, else `DASHBOARD`

**Auto-lock listener:** `chrome.runtime.onMessage` listener watches for `VAULT_STATE_SYNC` push from the background (alarm fired while popup was open) and immediately transitions to locked state.

**Ambient background glow:** Two radial gradients using cool blue rgba values positioned outside the viewport top and bottom-right, creating a subtle depth effect without warm tones.

### `src/popup/components/Logo.tsx`
Inline SVG React component — the single canonical Celestial logo instance.

- **Crescent moon:** Constructed as a filled circle minus an offset inner circle using SVG path geometry (`M14 4 ... A 10 10 ... Z`). Filled with a `linearGradient` from `#dceefa` (bright moonlight) to `#6aaccc` (icy blue).
- **4-pointed star sparkle:** Diamond path top-right of the moon. Filled with a lighter moonlight gradient.
- **Dot accent:** A small `<circle>` at `cx=23.5 cy=11.5 r=1` for a secondary twinkle effect.
- `size` prop controls both `width` and `height`, used at 20px (header), 28px (default), 36px (unlock screen), 48px (onboarding welcome).

### View: `Onboarding.tsx`
4-step wizard, single-column portrait layout (600px).

| Step | Content |
|---|---|
| `landing` | Logo centered, "Create new wallet" and "Import recovery phrase" buttons |
| `create-phrase` | 12-word grid (3 columns), blurred until user clicks "Click to reveal". "I've saved it" button disabled until revealed. |
| `create-password` | Two password inputs (min 8 chars, must match). `VAULT_CREATE` on submit. |
| `import` | Textarea for 12/24-word phrase, two password inputs. `VAULT_IMPORT` on submit. |

State: `step`, `mnemonic`, `importPhrase`, `password`, `confirmPassword`, `error`, `loading`, `revealed`.  
Animations: `AnimatePresence` with horizontal slide (`x: 24 → 0`, `x: 0 → -24`).

### View: `Unlock.tsx`
Single glass card centered in the 600×800 viewport.

- Logo component with `animate-float` (subtle vertical oscillation)
- Password input with `autoFocus` and Enter-key handler
- Attempt counter displayed after 3 failed attempts
- Spinner animation during unlock
- `VAULT_UNLOCK` message to background

### View: `Dashboard.tsx`
Full-height layout with fixed header, scrollable content area.

**Header:** Network pill (name + green status dot) | Logo + wordmark | Lock button  
**Body:** `PortfolioView` component | Tab bar (Tokens / Activity / DeFi) | Tab content  
**Tabs:** Animated underline indicator via `motion.div layoutId="tab-indicator"`

### Component: `PortfolioView.tsx`
Account overview section rendered inside Dashboard above the tab bar.

- Account avatar: deterministic gradient circle using `charCodeAt(2)` and `charCodeAt(4)` of the address as hue seeds
- Account name + truncated address (`0x1234…abcd`)
- Total USD value formatted with `toLocaleString('en-US', { minimumFractionDigits: 2 })`
- 24h change percentage (green/red, hidden when zero)
- Send / Receive / Swap / Buy quick action buttons with SVG icons

### Component: `AssetList.tsx`
Token list with three states:

| State | Render |
|---|---|
| `loading=true` | 3 skeleton rows — animated `bg-void-200` shimmer placeholders |
| `assets.length === 0` | Empty state: icon circle + "No tokens yet" + helper text |
| `assets.length > 0` | `AssetRow` per token: icon circle (first 2 chars of symbol) + name + balance + USD value |

Each `AssetRow` is a `<button>` — ready to open a token detail sheet in a future sprint.

---

## 7. Security Model

### Vault encryption
- All sensitive data (mnemonic, private keys, CEX API credentials) stored in `chrome.storage.local` as `AesGcmPayload` objects
- Encrypted with AES-256-GCM using a key derived from the user's password via PBKDF2-SHA256 (600k iterations)
- Each payload has a unique 12-byte random IV — no IV reuse
- GCM auth tag validates both ciphertext integrity and key correctness

### Key lifecycle
```
User password → PBKDF2(600k, 128-bit salt) → CryptoKey { extractable: false }
     ↓
Cached in SessionState.vaultKey (memory only)
     ↓
Cleared by: clearSession() | SW termination | VAULT_LOCK message | auto-lock alarm
```

The `CryptoKey` object with `extractable: false` cannot be serialized or exfiltrated — even if an attacker can run arbitrary JS in the extension context, they cannot read the raw key bytes.

### Auto-lock
Two complementary mechanisms:
1. **SW termination (natural):** MV3 SWs terminate after ~30s idle. Session state is module-level and is GC'd. Next popup open → `isUnlocked: false`.
2. **`chrome.alarms` (explicit):** `celestial/autolock` alarm fires after `autoLockMs` (default 5 min) even if the popup is open. Calls `clearSession()` and pushes `VAULT_STATE_SYNC` to the popup.

### dApp isolation
Content script runs in the ISOLATED world — it shares the DOM with the page but has a separate JS context. The page cannot directly call Chrome APIs. The content script acts as a restricted relay, only forwarding messages with `target: 'celestial_cs'`.

### What is never stored plaintext
- BIP-39 mnemonic
- Private keys (EVM hex, Solana base58 keypair, Bitcoin WIF)
- CEX API keys and secrets
- The PBKDF2-derived `CryptoKey`

---

## 8. Key Design Decisions & Non-Obvious Choices

### TypeScript 5.9 `Uint8Array<ArrayBuffer>` strictness
Web Crypto API functions (`crypto.subtle.encrypt`, `crypto.subtle.importKey`, etc.) accept `BufferSource = ArrayBuffer | ArrayBufferView`. In TS 5.9, `Uint8Array` became generic: `Uint8Array<ArrayBufferLike>` is not assignable to `BufferSource` because `ArrayBufferLike` includes `SharedArrayBuffer`. The fix: explicitly annotate return types as `Uint8Array<ArrayBuffer>` and use `.slice()` on any externally-provided `Uint8Array` parameter (`.slice()` always returns `Uint8Array<ArrayBuffer>`).

### Source-only packages (no build step)
Both `shared-types` and `core-crypto` use `"main": "./src/index.ts"` and export source TypeScript directly. Vite consumes them via the `Bundler` module resolution in the extension. This eliminates a `tsc` compile step per package and keeps the dev loop instant.

### `moduleResolution: "Bundler"` in the extension only
Packages use `"NodeNext"` (requires `.js` extensions in imports for correctness with Node.js). The extension uses `"Bundler"` (no extensions needed) because Vite resolves imports. This mix is intentional — the packages must work in both Node.js (for future server packages) and browser contexts.

### SLIP-0010 custom implementation for Solana
`@scure/bip32` only supports secp256k1. Solana's derivation is ed25519 + SLIP-0010 hardened-only. Rather than pulling in a separate library, the derivation is implemented directly using `@noble/hashes/hmac` (already a transitive dependency). This keeps the bundle smaller and avoids an extra supply chain dependency.

### Phantom-compatible Solana keypair format
Phantom stores a 64-byte keypair (private seed || public key) as base58. `deriveSolanaAccount` returns this format as `privateKeyHex` (a slight misnomer — it's actually base58). This ensures wallets created by Celestial can be imported into Phantom and vice versa.

### `VAULT_STATE_SYNC` push for auto-lock
When the alarm fires, the background calls `pushToPopup(VAULT_STATE_SYNC, ...)` — a fire-and-forget `chrome.runtime.sendMessage` that silently fails if the popup is closed. The popup's `App.tsx` listens for this message type and immediately transitions the UI to the locked state without waiting for a user action. This prevents a scenario where the popup is open and appears unlocked even after the alarm fires.

### Portrait 600×800 geometry
Matching the Phantom Wallet footprint ensures the extension popup doesn't trigger Chrome's scrollbar in the popup frame, avoids the `600×800` popup-height cap on some Chrome versions, and provides a natural single-column layout for the portrait form factor.

---

## 9. What's Not Yet Built

Listed in priority order for the next sprint:

### Sprint 2 — Core wallet functionality
- **Multi-account support:** `ACCOUNT_CREATE` handler (derive next BIP-44 index), account switcher UI in Dashboard header
- **Account metadata persistence:** Store `Account[]` in `chrome.storage` alongside the vault so unlock doesn't need to re-derive addresses
- **EIP-1193 inpage provider:** MAIN-world script injected via `chrome.scripting.executeScript`; implements `window.ethereum` with `eth_requestAccounts`, `eth_sendTransaction`, `personal_sign`, etc.
- **dApp approval UI:** `DAppRequest` pending state in popup; approve/reject flow
- **Transaction signing and sending:** `TX_SIGN`, `TX_SEND` handlers; EVM `eth_sendRawTransaction` via RPC

### Sprint 3 — Portfolio & market data
- **`PORTFOLIO_GET` handler:** Fetch ERC-20 token balances via Alchemy/Infura, SOL token accounts via Solana RPC
- **`AssetList` with real data:** Wire `PortfolioView` and `AssetList` to live portfolio data
- **Price feeds:** CoinGecko API integration (via `proxy-server` to avoid CORS and hide API keys)

### Sprint 4 — Advanced features
- **`apps/proxy-server`:** Node.js reverse proxy for CEX APIs; signs requests, rotates credentials, enforces CORS
- **`apps/bot-engine`:** On-chain execution engine for automated strategies
- **`packages/ui-kit`:** Standalone glassmorphism component library for sharing between extension and web app
- **Swap UI:** `SWAP_QUOTE_GET` + `SWAP_EXECUTE` using 1inch or Jupiter aggregator
- **Hardware wallet support:** Ledger HID integration via WebHID API
