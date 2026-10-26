/* Local demo token format shared with Halo's C++ access_key.cpp. No signing secret lives here. */
(function (root) {
  "use strict";
  const lifetime = 86400;
  async function checksum(issued, nonce) {
    const data = new TextEncoder().encode(`halo-access-v1|${issued}|${nonce}`);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, "0")).join("").slice(0, 24);
  }
  async function issue(now = Math.floor(Date.now() / 1000)) {
    const issued = now.toString(36);
    const nonce = [...crypto.getRandomValues(new Uint8Array(12))].map(n => n.toString(16).padStart(2, "0")).join("");
    return `HALO24-${issued}-${nonce}-${await checksum(issued, nonce)}`;
  }
  async function inspect(token, now = Math.floor(Date.now() / 1000)) {
    if (typeof token !== "string" || token.length > 128) return null;
    const parts = /^HALO24-([0-9a-z]{6,10})-([0-9a-f]{24})-([0-9a-f]{24})$/.exec(token.trim());
    if (!parts) return null;
    const issuedAt = parseInt(parts[1], 36);
    if (issuedAt < 1700000000 || issuedAt > 4102444800 || issuedAt > now + 300) return null;
    if (parts[3] !== await checksum(parts[1], parts[2])) return null;
    const expiresAt = issuedAt + lifetime;
    return { issuedAt, expiresAt, expired: now >= expiresAt };
  }
  const api = { issue, inspect, lifetime };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HaloAccess = api;
})(typeof window !== "undefined" ? window : globalThis);
