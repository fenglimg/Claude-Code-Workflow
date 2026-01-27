/**
 * Best-effort network blocking for untrusted user code.
 *
 * Note: Node's permission system (as of Node 22) restricts fs/child_process/worker,
 * but does not provide first-class network permissions. This preload hard-disables
 * common networking entrypoints to reduce risk during verification runs.
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function blocked(name) {
  return function () {
    throw new Error(`Network access blocked: ${name}`);
  };
}

function patchModule(modName, patchers) {
  try {
    const mod = require(modName);
    for (const [key, fn] of Object.entries(patchers)) {
      if (typeof mod[key] === 'function') mod[key] = fn;
    }
  } catch {
    // Ignore missing modules / environments.
  }
}

// Global fetch (undici) is the most common network API in modern Node.
try {
  if (typeof globalThis.fetch === 'function') globalThis.fetch = blocked('fetch');
} catch {
  // ignore
}

patchModule('node:http', {
  request: blocked('http.request'),
  get: blocked('http.get')
});
patchModule('node:https', {
  request: blocked('https.request'),
  get: blocked('https.get')
});
patchModule('node:http2', {
  connect: blocked('http2.connect')
});
patchModule('node:net', {
  connect: blocked('net.connect'),
  createConnection: blocked('net.createConnection')
});
patchModule('node:tls', {
  connect: blocked('tls.connect')
});
patchModule('node:dns', {
  lookup: blocked('dns.lookup'),
  resolve: blocked('dns.resolve')
});
patchModule('node:dgram', {
  createSocket: blocked('dgram.createSocket')
});

