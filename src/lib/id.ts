export function createId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;

  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  const randomBytes = new Uint8Array(12);
  if (typeof cryptoApi?.getRandomValues === "function") {
    cryptoApi.getRandomValues(randomBytes);
  } else {
    for (let index = 0; index < randomBytes.length; index += 1) {
      randomBytes[index] = Math.floor(Math.random() * 256);
    }
  }

  const randomPart = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const timePart = Date.now().toString(36);
  const perfPart = Math.floor((globalThis.performance?.now() ?? Math.random() * 1000) * 1000).toString(36);

  return `${timePart}-${perfPart}-${randomPart}`;
}
