import type {
  CexCredentialsMeta,
  ConnectedDApp,
  EncryptedVault,
  NetworkConfig,
  WalletSettings,
} from '@celestial/shared-types';
import { DEFAULT_SETTINGS } from '../shared/constants';

// Typed wrappers around chrome.storage.local.
// All keys are declared here so callers never hand-write string literals.

const KEY = {
  VAULT: 'vault',
  SETTINGS: 'settings',
  CUSTOM_NETWORKS: 'customNetworks',
  CONNECTED_DAPPS: 'connectedDApps',
  CEX_META: 'cexMeta',
} as const;

type StorageKey = (typeof KEY)[keyof typeof KEY];

async function get<T>(key: StorageKey): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

async function set<T>(key: StorageKey, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

async function remove(key: StorageKey): Promise<void> {
  await chrome.storage.local.remove(key);
}

// ---- Vault ---------------------------------------------------------------

export async function getVault(): Promise<EncryptedVault | null> {
  return (await get<EncryptedVault>(KEY.VAULT)) ?? null;
}

export async function setVault(vault: EncryptedVault): Promise<void> {
  await set(KEY.VAULT, vault);
}

export async function clearVault(): Promise<void> {
  await remove(KEY.VAULT);
}

// ---- Settings ------------------------------------------------------------

export async function getSettings(): Promise<WalletSettings> {
  return (await get<WalletSettings>(KEY.SETTINGS)) ?? { ...DEFAULT_SETTINGS };
}

export async function setSettings(settings: WalletSettings): Promise<void> {
  await set(KEY.SETTINGS, settings);
}

export async function patchSettings(patch: Partial<WalletSettings>): Promise<WalletSettings> {
  const current = await getSettings();
  const updated = { ...current, ...patch };
  await set(KEY.SETTINGS, updated);
  return updated;
}

// ---- Custom networks -----------------------------------------------------

export async function getCustomNetworks(): Promise<NetworkConfig[]> {
  return (await get<NetworkConfig[]>(KEY.CUSTOM_NETWORKS)) ?? [];
}

export async function setCustomNetworks(networks: NetworkConfig[]): Promise<void> {
  await set(KEY.CUSTOM_NETWORKS, networks);
}

// ---- Connected dApps -----------------------------------------------------

export async function getConnectedDApps(): Promise<ConnectedDApp[]> {
  return (await get<ConnectedDApp[]>(KEY.CONNECTED_DAPPS)) ?? [];
}

export async function setConnectedDApps(dapps: ConnectedDApp[]): Promise<void> {
  await set(KEY.CONNECTED_DAPPS, dapps);
}

// ---- CEX credential metadata ---------------------------------------------
// Only metadata (no secrets) is stored here; secrets live inside the encrypted vault.

export async function getCexMeta(): Promise<CexCredentialsMeta[]> {
  return (await get<CexCredentialsMeta[]>(KEY.CEX_META)) ?? [];
}

export async function setCexMeta(meta: CexCredentialsMeta[]): Promise<void> {
  await set(KEY.CEX_META, meta);
}
