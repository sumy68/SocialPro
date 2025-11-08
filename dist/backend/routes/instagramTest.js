"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.instagramTest = void 0;
const hono_1 = require("hono");
exports.instagramTest = new hono_1.Hono();
exports.instagramTest.get('/test', async (c) => {
    const IG_ID = process.env.FACEBOOK_IG_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    try {
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const appsecret_proof = crypto
            .createHmac('sha256', APP_SECRET || '')
            .update(ACCESS_TOKEN || '')
            .digest('hex');
        const res = await fetch(`https://graph.facebook.com/v24.0/${IG_ID}?fields=username,ig_id&access_token=${ACCESS_TOKEN}&appsecret_proof=${appsecret_proof}`);
        const data = await res.json();
        return c.json({ ok: true, data });
    }
    catch (err) {
        console.error(err);
        return c.json({ ok: false, error: err.message }, 500);
    }
});
