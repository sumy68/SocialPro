"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const hono_1 = require("hono");
const linkedin_1 = require("./backend/routes/linkedin");
const instagram_1 = require("./backend/routes/instagram"); // <— hinzufügen
exports.app = new hono_1.Hono();
exports.app.get('/health', c => c.json({ status: 'ok' }));
exports.app.route('/api/oauth/linkedin', linkedin_1.linkedinRouter);
exports.app.route('/api/oauth/instagram', instagram_1.instagramRouter); // <— hinzufügen
exports.default = exports.app;
