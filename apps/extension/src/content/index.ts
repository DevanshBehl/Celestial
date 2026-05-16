// Content script — ISOLATED world.
// Bridges JSON-RPC requests from the dApp page (MAIN world) to the
// background service worker, and relays responses back.
//
// Message flow:
//   dApp (window.ethereum) → postMessage({ target:'celestial_cs', … })
//   → content script → chrome.runtime.sendMessage
//   → background SW → chrome.runtime.sendMessage response
//   → content script → postMessage({ target:'celestial_page', … })
//   → dApp's pending Promise resolves

const INPAGE_TO_CS = 'celestial_cs';
const CS_TO_INPAGE = 'celestial_page';

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return;
  if (
    typeof event.data !== 'object' ||
    event.data === null ||
    event.data.target !== INPAGE_TO_CS
  ) {
    return;
  }

  const { id, method, params } = event.data as {
    id: string;
    method: string;
    params: unknown[];
  };

  chrome.runtime.sendMessage({
    type: 'dapp/rpc',
    target: 'background',
    payload: {
      method,
      params,
      origin: window.location.origin,
      favicon: document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href,
    },
    requestId: id,
  }).then((response: unknown) => {
    window.postMessage({ target: CS_TO_INPAGE, id, response }, '*');
  }).catch((err: unknown) => {
    window.postMessage({
      target: CS_TO_INPAGE,
      id,
      response: {
        requestId: id,
        success: false,
        error: { code: 'INTERNAL_ERROR', message: String(err) },
      },
    }, '*');
  });
});

// Announce provider availability to the page.
// The full EIP-1193 inpage provider will be injected in a future sprint
// via a MAIN-world content script or chrome.scripting.executeScript.
window.postMessage({ target: CS_TO_INPAGE, type: 'celestial_ready' }, '*');
