import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePublicUrl,
  validateAssetResponses,
  validateDocumentResponse,
} from "./replit-public-smoke-lib.mjs";

test("public URL must be an anonymous HTTPS root URL", () => {
  assert.equal(normalizePublicUrl("https://demo.replit.app/").href, "https://demo.replit.app/");
  assert.throws(() => normalizePublicUrl("https://demo.replit.app/nested"), /root/);
  assert.throws(() => normalizePublicUrl("https://user:secret@demo.replit.app/"), /credentials/);
});

test("document must be exactly 200 HTML", () => {
  assert.doesNotThrow(() => validateDocumentResponse({ status: 200, contentType: "text/html; charset=utf-8" }));
  assert.throws(() => validateDocumentResponse({ status: 204, contentType: "text/html" }), /200/);
  assert.throws(() => validateDocumentResponse({ status: 200, contentType: "application/javascript" }), /HTML/);
});

test("script stylesheet and font responses must be 2xx non-HTML", () => {
  const valid = [
    { resourceType: "script", status: 200, contentType: "application/javascript" },
    { resourceType: "stylesheet", status: 200, contentType: "text/css" },
    { resourceType: "font", status: 206, contentType: "font/woff2" },
  ];
  assert.doesNotThrow(() => validateAssetResponses(valid));
  assert.throws(() => validateAssetResponses([]), /missing/);
  assert.throws(() => validateAssetResponses(valid.map((item) => item.resourceType === "script" ? { ...item, status: 302 } : item)), /2xx/);
  assert.throws(() => validateAssetResponses(valid.map((item) => item.resourceType === "font" ? { ...item, contentType: "text/html" } : item)), /HTML/);
});
