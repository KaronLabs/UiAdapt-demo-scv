import assert from "node:assert/strict";
import test from "node:test";

import { validateVideoProbe } from "./video-contract.mjs";

const validProbe = {
  streams: [{ width: 1920, height: 1080, codec_name: "vp8" }],
  format: { duration: "27.04", format_name: "matroska,webm" },
};

test("accepts the untrimmed VP8 WebM Stage recording contract", () => {
  assert.deepEqual(validateVideoProbe(validProbe), {
    width: 1920,
    height: 1080,
    codec: "vp8",
    container: "matroska,webm",
    duration: 27.04,
  });
});

test("rejects a wrong codec even when dimensions and duration are valid", () => {
  assert.throws(
    () => validateVideoProbe({ ...validProbe, streams: [{ ...validProbe.streams[0], codec_name: "h264" }] }),
    /codec must be vp8 or vp9/,
  );
});

test("rejects a non-WebM container even when dimensions and duration are valid", () => {
  assert.throws(
    () => validateVideoProbe({ ...validProbe, format: { ...validProbe.format, format_name: "mov,mp4" } }),
    /container must include webm/,
  );
});
