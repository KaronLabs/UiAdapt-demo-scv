const checkedAssetTypes = ["script", "stylesheet", "font"];

export function normalizePublicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("REPLIT_PUBLIC_URL must be a valid HTTPS root URL");
  }
  if (url.protocol !== "https:") throw new Error("REPLIT_PUBLIC_URL must use HTTPS");
  if (url.username || url.password) throw new Error("REPLIT_PUBLIC_URL must not contain credentials");
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("REPLIT_PUBLIC_URL must point to the deployment root");
  }
  return url;
}

export function validateDocumentResponse({ status, contentType }) {
  if (status !== 200) throw new Error(`document request must return 200, received ${status}`);
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("document response must be HTML");
  }
}

export function validateAssetResponses(responses) {
  for (const type of checkedAssetTypes) {
    if (!responses.some(({ resourceType }) => resourceType === type)) {
      throw new Error(`${type} response is missing`);
    }
  }
  for (const { resourceType, status, contentType } of responses) {
    if (!checkedAssetTypes.includes(resourceType)) continue;
    if (status < 200 || status >= 300) {
      throw new Error(`${resourceType} response must be 2xx, received ${status}`);
    }
    if (contentType.toLowerCase().includes("text/html")) {
      throw new Error(`${resourceType} response must not be HTML`);
    }
  }
}
