const functions = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");

const EMPTY_RESULT = {
  licensePlate: "",
  vin: "",
  owner: "",
  brand: "",
  model: "",
};

function setCorsHeaders(response) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");
}

function getOpenAiApiKey() {
  return functions.config().openai?.key || "";
}

function normalizeBase64Image(value, fallbackMimeType = "image/jpeg") {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmedValue = value.trim();
  const dataUrlMatch = trimmedValue.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64: dataUrlMatch[2].replace(/\s/g, ""),
    };
  }

  return {
    mimeType: fallbackMimeType,
    base64: trimmedValue.replace(/\s/g, ""),
  };
}

function getRequestImages(request) {
  const body = request.body || {};
  const images = Array.isArray(body.images)
    ? body.images
    : [body.image || body.imageBase64 || body.base64];
  const mimeTypes = Array.isArray(body.mimeTypes) ? body.mimeTypes : [body.mimeType];

  return images
    .map((image, index) => normalizeBase64Image(image, mimeTypes[index] || body.mimeType))
    .filter(Boolean);
}

function normalizeAiResult(value) {
  return {
    licensePlate: String(value?.licensePlate || ""),
    vin: String(value?.vin || ""),
    owner: String(value?.owner || ""),
    brand: String(value?.brand || ""),
    model: String(value?.model || ""),
  };
}

function parseAiJson(content) {
  try {
    return normalizeAiResult(JSON.parse(content || "{}"));
  } catch (error) {
    console.error("OpenAI returned invalid JSON.", error);
    return {...EMPTY_RESULT};
  }
}

async function extractVehicleData(images, apiKey) {
  const imageContent = images.slice(0, 2).map((image) => ({
    type: "image_url",
    image_url: {
      url: `data:${image.mimeType};base64,${image.base64}`,
      detail: "high",
    },
  }));

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: {type: "json_object"},
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON with keys licensePlate, vin, owner, brand and model. Use an empty string for unknown or unreadable values.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "You are an expert in vehicle registration documents. Extract all relevant vehicle data from this image.",
            },
            ...imageContent,
          ],
        },
      ],
    }),
  });

  if (!openAiResponse.ok) {
    const errorBody = await openAiResponse.text();
    console.error("OpenAI API error.", openAiResponse.status, errorBody);
    throw new Error("OpenAI API request failed");
  }

  const data = await openAiResponse.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return parseAiJson(content);
}

exports.vehicleDocumentPlaceholder = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    response.status(500).json({error: "OpenAI API key is not configured"});
    return;
  }

  try {
    const images = getRequestImages(request);

    if (images.length === 0) {
      response.status(400).json({error: "No image provided"});
      return;
    }

    const result = await extractVehicleData(images, apiKey);
    response.status(200).json({...EMPTY_RESULT, ...result});
  } catch (error) {
    console.error("Vehicle document extraction failed.", error);
    response.status(500).json({error: "Could not process vehicle document"});
  }
});
