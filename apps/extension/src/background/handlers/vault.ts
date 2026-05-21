import {
  buildEvmDerivationPath,
  createVault,
  decryptAccountKey,
  decryptVaultMnemonic,
  deriveEvmAccount,
  generateMnemonic,
  mnemonicToSeed,
  addAccountToVault,
  changeVaultPassword,
  deriveVaultKey,
  validateMnemonic,
} from '@celestial/core-crypto';
import type {
  Account,
  AnyExtensionResponse,
  CreateVaultPayload,
  ExtensionMessage,
  ExportKeyResponse,
  ImportVaultPayload,
  PopupInitResponse,
  UnlockVaultPayload,
  VaultCreateResponse,
  VaultUnlockResponse,
  ChangePasswordPayload,
} from '@celestial/shared-types';
import {
  AppView,
  CelestialErrorCode,
  ChainFamily,
  ChainId,
  DerivationStandard,
  MessageType,
} from '@celestial/shared-types';
import { AUTO_LOCK_ALARM, BUILTIN_NETWORKS, DEFAULT_SETTINGS, NETWORK_BY_CHAIN_ID } from '../../shared/constants';
import { errorResponse, successResponse } from '../../shared/messaging';
import { clearSession, getSession, setSession } from '../session';
import {
  getCexMeta,
  getConnectedDApps,
  getCustomNetworks,
  getSettings,
  getVault,
  setSettings,
  setVault,
} from '../storage';

// ---- Helpers --------------------------------------------------------------

function scheduleAutoLock(ms: number): void {
  chrome.alarms.clear(AUTO_LOCK_ALARM).then(() => {
    if (ms > 0) {
      chrome.alarms.create(AUTO_LOCK_ALARM, {
        delayInMinutes: ms / 60_000,
      });
    }
  });
}

async function buildVaultState() {
  const vault = await getVault();
  const session = getSession();
  const settings = await getSettings();
  return {
    hasVault: vault !== null,
    isLocked: !session.isUnlocked,
    activeAccountId: session.activeAccountId,
    activeChainId: session.activeChainId,
    autoLockMs: settings.autoLockMs,
  };
}

// Derives and caches the first EVM account for a brand-new wallet.
async function deriveAndStoreFirstAccount(
  mnemonic: string,
  password: string,
  vault: Awaited<ReturnType<typeof createVault>>,
  walletId: string,
): Promise<{ vault: typeof vault; account: Account }> {
  const seed = await mnemonicToSeed(mnemonic);
  const path = buildEvmDerivationPath(0);
  const derived = deriveEvmAccount(seed, path);

  const accountId = crypto.randomUUID();
  const account: Account = {
    id: accountId,
    walletId,
    name: 'Account 1',
    address: derived.address,
    chainFamily: ChainFamily.EVM,
    chainId: ChainId.ETHEREUM,
    derivationPath: path,
    index: 0,
  };

  const updatedVault = await addAccountToVault(vault, password, accountId, derived.privateKeyHex);
  return { vault: updatedVault, account };
}

// ---- Handler --------------------------------------------------------------

export async function handleVaultMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
): Promise<AnyExtensionResponse> {
  const { type, requestId, payload } = message;

  // ---- POPUP_INIT ----------------------------------------------------------
  if (type === MessageType.POPUP_INIT) {
    const vault = await getVault();
    const session = getSession();
    const settings = await getSettings();
    const connectedDApps = await getConnectedDApps();
    const cexCredentials = await getCexMeta();
    const customNetworks = await getCustomNetworks();
    const allNetworks = [
      ...BUILTIN_NETWORKS,
      ...customNetworks.filter(n => !NETWORK_BY_CHAIN_ID.has(n.chainId)),
    ];

    const vaultState = {
      hasVault: vault !== null,
      isLocked: !session.isUnlocked,
      activeAccountId: session.activeAccountId,
      activeChainId: session.activeChainId,
      autoLockMs: settings.autoLockMs,
    };

    const popupState = {
      vault: vaultState,
      view: !vaultState.hasVault
        ? AppView.ONBOARDING
        : vaultState.isLocked
          ? AppView.UNLOCK
          : AppView.DASHBOARD,
      previousView: null,
      portfolio: null,
      settings,
      connectedDApps,
      pendingDAppRequest: null,
      toasts: [],
      modal: null,
      isBootstrapped: true,
    };

    const data: PopupInitResponse = {
      state: popupState,
      accounts: session.accounts,
      networks: allNetworks,
      connectedDApps,
      cexCredentials,
    };
    return successResponse(requestId, data);
  }

  // ---- VAULT_STATE_GET -----------------------------------------------------
  if (type === MessageType.VAULT_STATE_GET) {
    return successResponse(requestId, await buildVaultState());
  }

  // ---- VAULT_CREATE --------------------------------------------------------
  if (type === MessageType.VAULT_CREATE) {
    const { mnemonic, password, walletName } = payload as CreateVaultPayload;

    if (!validateMnemonic(mnemonic)) {
      return errorResponse(requestId, CelestialErrorCode.VALIDATION_ERROR, 'Invalid mnemonic');
    }

    const walletId = crypto.randomUUID();
    let vault = await createVault(mnemonic, password);
    const { vault: vaultWithAccount, account } = await deriveAndStoreFirstAccount(
      mnemonic,
      password,
      vault,
      walletId,
    );
    vault = vaultWithAccount;

    await setVault(vault);

    const vaultKey = await deriveVaultKey(password, vault.salt);
    const settings = await getSettings();

    setSession({
      isUnlocked: true,
      vaultKey,
      accounts: [account],
      activeAccountId: account.id,
      activeChainId: ChainId.ETHEREUM,
      autoLockMs: settings.autoLockMs,
    });
    scheduleAutoLock(settings.autoLockMs);

    const vaultState = await buildVaultState();
    const data: VaultCreateResponse = {
      walletId,
      mnemonic,
      state: vaultState,
      accounts: [account],
    };
    return successResponse(requestId, data);
  }

  // ---- VAULT_IMPORT --------------------------------------------------------
  if (type === MessageType.VAULT_IMPORT) {
    const { mnemonic, password, walletName } = payload as ImportVaultPayload;

    if (!validateMnemonic(mnemonic)) {
      return errorResponse(requestId, CelestialErrorCode.VALIDATION_ERROR, 'Invalid mnemonic');
    }

    const existingVault = await getVault();
    if (existingVault) {
      return errorResponse(requestId, CelestialErrorCode.VAULT_ALREADY_EXISTS, 'A vault already exists');
    }

    const walletId = crypto.randomUUID();
    let vault = await createVault(mnemonic, password);
    const { vault: vaultWithAccount, account } = await deriveAndStoreFirstAccount(
      mnemonic,
      password,
      vault,
      walletId,
    );
    vault = vaultWithAccount;

    await setVault(vault);

    const vaultKey = await deriveVaultKey(password, vault.salt);
    const settings = await getSettings();

    setSession({
      isUnlocked: true,
      vaultKey,
      accounts: [account],
      activeAccountId: account.id,
      activeChainId: ChainId.ETHEREUM,
      autoLockMs: settings.autoLockMs,
    });
    scheduleAutoLock(settings.autoLockMs);

    const vaultState = await buildVaultState();
    const data: VaultCreateResponse = {
      walletId,
      mnemonic,
      state: vaultState,
      accounts: [account],
    };
    return successResponse(requestId, data);
  }

  // ---- VAULT_UNLOCK --------------------------------------------------------
  if (type === MessageType.VAULT_UNLOCK) {
    const { password } = payload as UnlockVaultPayload;
    const vault = await getVault();
    if (!vault) {
      return errorResponse(requestId, CelestialErrorCode.VAULT_NOT_FOUND, 'No vault found');
    }

    let mnemonic: string;
    try {
      mnemonic = await decryptVaultMnemonic(vault, password);
    } catch {
      return errorResponse(requestId, CelestialErrorCode.VAULT_WRONG_PASSWORD, 'Wrong password');
    }

    // Re-derive accounts stored in the vault accounts map.
    // For the scaffold we derive account 0 fresh from seed if no accounts are stored yet.
    const seed = await mnemonicToSeed(mnemonic);
    const accountEntries = Object.keys(vault.accounts);

    let accounts: Account[] = [];
    if (accountEntries.length > 0) {
      // Accounts were stored by a previous session — just read stored metadata.
      // (Full keyring is reconstructed on demand during signing.)
      // For now we read back private key and rebuild Account metadata from it.
      // TODO: Store Account metadata in chrome.storage alongside the vault so we don't need to re-derive.
      const path = buildEvmDerivationPath(0);
      const derived = deriveEvmAccount(seed, path);
      const accountId = accountEntries[0]!;
      accounts = [
        {
          id: accountId,
          walletId: 'recovered',
          name: 'Account 1',
          address: derived.address,
          chainFamily: ChainFamily.EVM,
          chainId: ChainId.ETHEREUM,
          derivationPath: path,
          index: 0,
        },
      ];
    }

    const vaultKey = await deriveVaultKey(password, vault.salt);
    const settings = await getSettings();

    setSession({
      isUnlocked: true,
      vaultKey,
      accounts,
      activeAccountId: accounts[0]?.id ?? null,
      activeChainId: ChainId.ETHEREUM,
      autoLockMs: settings.autoLockMs,
    });
    scheduleAutoLock(settings.autoLockMs);

    const vaultState = await buildVaultState();
    const data: VaultUnlockResponse = { state: vaultState, accounts };
    return successResponse(requestId, data);
  }

  // ---- VAULT_LOCK ----------------------------------------------------------
  if (type === MessageType.VAULT_LOCK) {
    chrome.alarms.clear(AUTO_LOCK_ALARM);
    clearSession();
    const vaultState = await buildVaultState();
    return successResponse(requestId, vaultState);
  }

  // ---- VAULT_CHANGE_PASSWORD -----------------------------------------------
  if (type === MessageType.VAULT_CHANGE_PASSWORD) {
    const { currentPassword, newPassword } = payload as ChangePasswordPayload;
    const vault = await getVault();
    if (!vault) {
      return errorResponse(requestId, CelestialErrorCode.VAULT_NOT_FOUND, 'No vault found');
    }

    let updatedVault;
    try {
      updatedVault = await changeVaultPassword(vault, currentPassword, newPassword);
    } catch {
      return errorResponse(requestId, CelestialErrorCode.VAULT_WRONG_PASSWORD, 'Current password is incorrect');
    }

    await setVault(updatedVault);

    // Re-derive new key and update session.
    const newKey = await deriveVaultKey(newPassword, updatedVault.salt);
    setSession({ vaultKey: newKey });

    return successResponse(requestId, { ok: true });
  }

  return errorResponse(requestId, CelestialErrorCode.MESSAGE_UNKNOWN_TYPE, `Unrouted vault message: ${type}`);
}

// ---- Exported helpers used by other handlers -----------------------------

export async function requireUnlockedVault(requestId: string): Promise<
  | { ok: true; vault: NonNullable<Awaited<ReturnType<typeof getVault>>>; vaultKey: CryptoKey }
  | { ok: false; response: AnyExtensionResponse }
> {
  const session = getSession();
  if (!session.isUnlocked || !session.vaultKey) {
    return { ok: false, response: errorResponse(requestId, CelestialErrorCode.VAULT_LOCKED, 'Vault is locked') };
  }
  const vault = await getVault();
  if (!vault) {
    return { ok: false, response: errorResponse(requestId, CelestialErrorCode.VAULT_NOT_FOUND, 'No vault found') };
  }
  return { ok: true, vault, vaultKey: session.vaultKey };
}
