const PROXY_SECRET = "NEOTOMAN21Efi6BThXskqqj1yJIppqSqERYwHCSk";
const TARGET_BASE_URL = "https://otp.neotoman.ir";

function doPost(e) {
  const proxySecret = e.parameter.secret;
  if (proxySecret !== PROXY_SECRET) {
    return jsonResponse({ error: "Forbidden: Invalid Proxy Secret" }, 403);
  }

  const path = e.parameter.path || "/send-otp";
  const targetUrl = TARGET_BASE_URL + path;

  const waApiKey = e.headers["x-proxy-api-key"] || "";

  let payload = "{}";
  if (e.postData) {
    payload = e.postData.contents;
  }

  const options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    headers: {
      "X-API-KEY": waApiKey,
      "User-Agent": "WA-GW-Proxy",
    },
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(targetUrl, options);
    const responseCode = response.getResponseCode();
    const responseData = response.getContentText();

    return jsonResponse(responseData, responseCode);
  } catch (error) {
    return jsonResponse(
      { error: "Proxy Network Error: " + error.message },
      500,
    );
  }
}

function doGet(e) {
  const proxySecret = e.parameter.secret;
  if (proxySecret !== PROXY_SECRET) {
    return jsonResponse({ error: "Forbidden: Invalid Proxy Secret" }, 403);
  }

  const path = e.parameter.path || "/health";
  const targetUrl = TARGET_BASE_URL + path;

  const waApiKey = e.headers["x-proxy-api-key"] || e.parameter.api_key || "";

  const options = {
    method: "get",
    headers: {
      "X-API-KEY": waApiKey,
      "User-Agent": "WA-GW-Proxy",
    },
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(targetUrl, options);
    return jsonResponse(response.getContentText(), response.getResponseCode());
  } catch (error) {
    return jsonResponse(
      { error: "Proxy Network Error: " + error.message },
      500,
    );
  }
}

function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(
    typeof data === "string" ? data : JSON.stringify(data),
  ).setMimeType(ContentService.MimeType.JSON);
}
