/**
 * CSRF helpers – Edge-runtime compatible (Web Crypto API).
 */

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET!;
const CSRF_COOKIE = "xt_csrf";

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g);
  if (!bytes) return new Uint8Array(0);
  return new Uint8Array(bytes.map((b) => parseInt(b, 16)));
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buf);
  return toHex(buf.buffer);
}

async function getKey(): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(CSRF_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Generate a CSRF token: <random>.<hmac> */
export async function generateCsrfToken(): Promise<{
  token: string;
  cookie: string;
}> {
  const random = randomHex(32);
  const key = await getKey();
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(random));
  const token = `${random}.${toHex(sig)}`;
  return { token, cookie: token };
}

/** Validate that a CSRF token is correctly signed */
export async function validateCsrfToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [random, sig] = parts;
  try {
    const key = await getKey();
    return globalThis.crypto.subtle.verify("HMAC", key, fromHex(sig), enc.encode(random));
  } catch {
    return false;
  }
}

export { CSRF_COOKIE };
