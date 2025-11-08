"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiBase = void 0;
// src/utils/apiBase.ts
exports.apiBase = (process.env.EXPO_PUBLIC_APP_URL ?? '').replace(/\/+$/, '');
console.log('[API] Base:', exports.apiBase);
