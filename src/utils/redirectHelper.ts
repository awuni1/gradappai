/**
 * Redirect Helper Utility
 * Ensures consistent redirect URLs across the app
 */

// Helper: pick correct app origin for redirects
// - On localhost, keep current origin for dev
// - On any deployed host, force the canonical production domain
export function getAppOrigin(): string {
  try {
    if (typeof window === 'undefined') return 'https://www.gradappai.com';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin;
    }
    return 'https://www.gradappai.com';
  } catch {
    return 'https://www.gradappai.com';
  }
}

export default getAppOrigin;
