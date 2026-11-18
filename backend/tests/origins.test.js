import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedOrigins, normalizeOrigin } from '../src/utils/origins.js';
test('normalizes configured origins and rejects invalid protocols', () => {
 assert.equal(normalizeOrigin(' "https://Example.com/" '), 'https://example.com');
 assert.equal(normalizeOrigin('javascript:alert(1)'), null);
 assert.equal(normalizeOrigin('https://user:pass@example.com'), null);
});
test('trusts only the exact production frontend and configured origins', () => {
 const origins = allowedOrigins('http://localhost:3000,https://custom.example/', true);
 assert.ok(origins.includes('https://shimshalheights-frontend.vercel.app'));
 assert.ok(origins.includes('https://custom.example'));
 assert.ok(!origins.includes('https://shimshalheights-frontend.vercel.app.attacker.com'));
 assert.ok(!origins.includes('https://other.vercel.app'));
 assert.ok(!allowedOrigins('http://localhost:3000').includes('https://shimshalheights-frontend.vercel.app'));
});
