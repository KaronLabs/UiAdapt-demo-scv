const EXPECTED_WIDTH = 1920;
const EXPECTED_HEIGHT = 1080;
const ALLOWED_CODECS = new Set(["vp8", "vp9"]);

export function validateVideoProbe(probe) {
  const stream = probe.streams?.[0];
  const duration = Number(probe.format?.duration);
  const codec = stream?.codec_name;
  const container = probe.format?.format_name;

  if (stream?.width !== EXPECTED_WIDTH || stream?.height !== EXPECTED_HEIGHT) {
    throw new Error(`Video dimensions must be ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}: ${JSON.stringify(probe)}`);
  }
  if (!ALLOWED_CODECS.has(codec)) throw new Error(`Video codec must be vp8 or vp9: ${codec}`);
  if (typeof container !== "string" || !container.split(",").includes("webm")) {
    throw new Error(`Video container must include webm: ${container}`);
  }
  if (!Number.isFinite(duration) || duration < 26.5 || duration > 30) {
    throw new Error(`Video duration is outside the untrimmed 27-second run: ${duration}`);
  }
  return { width: stream.width, height: stream.height, codec, container, duration };
}
