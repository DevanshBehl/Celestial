import type {
  AnyExtensionResponse,
  ExtensionMessage,
  ExtensionResponse,
} from '@celestial/shared-types';
import { CelestialErrorCode, MessageTarget, MessageType } from '@celestial/shared-types';

// ---- Message builders ---------------------------------------------------

export function buildMessage<P>(
  type: MessageType,
  payload: P,
  target: MessageTarget = MessageTarget.BACKGROUND,
): ExtensionMessage<P> {
  return { type, target, payload, requestId: crypto.randomUUID() };
}

// ---- Sending helpers ----------------------------------------------------

// Popup → background (or any extension context → background).
export async function sendToBackground<TData = unknown, TPayload = unknown>(
  type: MessageType,
  payload: TPayload,
): Promise<AnyExtensionResponse<TData>> {
  const message = buildMessage(type, payload);
  return chrome.runtime.sendMessage(message) as Promise<AnyExtensionResponse<TData>>;
}

// Background → popup (fire-and-forget; popup may not be open).
export function pushToPopup<P>(type: MessageType, payload: P): void {
  chrome.runtime.sendMessage(
    buildMessage(type, payload, MessageTarget.POPUP),
  ).catch(() => {
    // Popup is not open — ignore.
  });
}

// ---- Response helpers ---------------------------------------------------

export function isSuccess<T>(
  res: AnyExtensionResponse<T>,
): res is ExtensionResponse<T> {
  return res.success === true;
}

export function successResponse<T>(requestId: string, data: T): ExtensionResponse<T> {
  return { requestId, success: true, data };
}

export function errorResponse(
  requestId: string,
  code: CelestialErrorCode,
  message: string,
  context?: Record<string, unknown>,
): AnyExtensionResponse {
  return { requestId, success: false, error: { code, message, context } };
}
