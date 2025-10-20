/**
 * TEMP MOCK for @rork/toolkit-sdk
 * Gibt für jeden Zugriff eine leere Funktion zurück.
 * Später durch echte Library ersetzen.
 */
const noop = () => {};
const handler = {
  get: () => noop,
  apply: () => noop
};
const proxy = new Proxy(noop, handler);
module.exports = proxy;
module.exports.default = proxy;
