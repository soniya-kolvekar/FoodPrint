const multer = require('multer');
const sharp = require('sharp');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// Ensure multipart operations go straight to memory 
const storage = multer.memoryStorage();
exports.upload = multer({ storage });

const SYSTEM_PROMPT = `
You are an AI-powered grocery and pantry extraction engine.

Your task is to analyze an input image of groceries, receipts, or pantry items and extract structured, clean, and normalized data for a smart pantry management system.

---

# 🎯 OBJECTIVE
From the given image, extract ALL identifiable food or grocery items and return them in a structured JSON format suitable for database storage.

---

# 📦 OUTPUT FORMAT (STRICT)
Return ONLY valid JSON. No explanations.
Format:
[
  {
    "name": "string",
    "quantity": number,
    "unit": "string",
    "category": "string",
    "confidence": number
  }
]

---

# 📌 FIELD RULES

### 1. name
* Lowercase
* Singular form (e.g., "eggs" → "egg" only if quantity > 1 still use plural if natural)
* Remove brand names
* Normalize:
  * "full cream milk" → "milk"
  * "brown bread loaf" → "bread"

### 2. quantity
* Extract numeric value if available
* If not visible, default to 1

### 3. unit
Use standardized units ONLY:
* "litre", "ml", "kg", "grams", "pieces", "pack", "bottle"
If unknown → use "unit"

### 4. category
Classify into ONE of:
* dairy, vegetable, fruit, grain, protein, beverage, snack, spice, other

### 5. confidence
* Value between 0 and 1 based on how certain you are about detection

---

# 🧠 INTELLIGENT PROCESSING RULES
1. Merge duplicates: If same item appears multiple times → combine quantities
2. Ignore non-food items: Example: soap, tissue, utensils → discard
3. Handle noisy input: Fix OCR mistakes, Remove irrelevant text
4. Estimate missing data: If quantity unclear → assume 1, If unit unclear → "unit"
5. Prioritize clarity over guessing: If unsure → lower confidence

---

# 📸 INPUT TYPES YOU may RECEIVE
* Grocery receipts
* Raw grocery photos
* Pantry shelf images
* Mixed clutter images

---

# ❗ STRICT RULES
* DO NOT return text outside JSON
* DO NOT hallucinate unrealistic items
* DO NOT include explanations
* DO NOT include empty fields
* ONLY return detected food items

User pantry context: Indian household groceries
`;

exports.processScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // --- Image Optimization Segment ---
    // High-res receipts often exceed Gemini's payload limits. 
    // We downscale to max 1600px width and compress to JPEG 80 quality.
    let optimizedBuffer = imageBuffer;
    let finalMimeType = mimeType;

    try {
      console.log(`[DEBUG] Received image: ${mimeType}, Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      console.log(`[DEBUG] Original Dimensions: ${metadata.width}x${metadata.height}`);
      
      // ALWAYS optimize and convert to JPEG. Gemini does NOT support AVIF or very high-res photos.
      console.log(`[DEBUG] Converting to JPEG/Optimizing...`);
      optimizedBuffer = await image
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      finalMimeType = "image/jpeg";
      console.log(`[DEBUG] Final Payload Size: ${(optimizedBuffer.length / 1024).toFixed(2)} KB`);
    } catch (optErr) {
      console.error("[DEBUG] Optimization error (Defaulting to raw):", optErr);
    }

    // Construct Inline Payload for Gemini
    const imageParts = [{
      inlineData: {
        data: optimizedBuffer.toString("base64"),
        mimeType: finalMimeType
      }
    }];

    // Extracted keys from Env
    const keys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(k => k && k.trim() !== "" && !k.includes("your"));

    console.log(`[DEBUG] Active API Keys: ${keys.length}`);
    if (keys.length === 0) {
      return res.status(500).json({ error: "No Gemini API keys configured. Please add them to your backend .env file." });
    }

    let rawOutput = null;
    let success = false;
    // Using the latest 2.5 and 2.0 series models as per the user's AI Studio console
    const modelsToTry = [
      "gemini-2.5-flash", 
      "gemini-2.5-flash-lite",
      "gemini-2.5-pro"
    ];

    // Unified Safety Settings to prevent receipts (which have lots of numbers/codes) from being blocked
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    // Failover Loop: Cycles through API keys AND models if rate-limits or errors occur
    for (let i = 0; i < keys.length; i++) {
      for (let j = 0; j < modelsToTry.length; j++) {
        try {
          const currentModel = modelsToTry[j];
          console.log(`[SCAN] Trying Key ${i + 1} with ${currentModel}...`);

          const genAI = new GoogleGenerativeAI(keys[i]);
          
          // Use JSON mode for 2.0 models to ensure structured output
          const generationConfig = {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096, // Increased to prevent truncation of long receipts
          };

          if (currentModel.includes("2.0") || currentModel.includes("2-flash")) {
             generationConfig.responseMimeType = "application/json";
          }

          const model = genAI.getGenerativeModel({ 
            model: currentModel,
            safetySettings,
            generationConfig
          });

          const result = await model.generateContent([SYSTEM_PROMPT, ...imageParts]);
          const response = await result.response;
          
          // Check for block reason if response was not successful 
          if (response.promptFeedback?.blockReason) {
             console.warn(`[BLOCKED] Key ${i+1} | Reason: ${response.promptFeedback.blockReason}`);
             continue;
          }

          rawOutput = response.text();

          // HEURISTIC: Check if JSON seems complete (ends with ])
          // Truncation happens sometimes on early access models
          if (rawOutput && !rawOutput.trim().endsWith("]")) {
             console.warn(`[TRUNCATED] Key ${i+1} | Output stopped mid-sentence. Retrying with next model...`);
             continue;
          }

          if (rawOutput) {
            success = true;
            console.log(`[SUCCESS] Key ${i + 1} parsed with ${currentModel}`);
            break;
          }
        } catch (err) {
          console.error(`[DEBUG] Attempt Failed | Key ${i + 1} | Model: ${modelsToTry[j]}`);
          if (err.message && (err.message.includes("429") || err.message.includes("503"))) {
             console.log(">>> Rate limited or High demand. Waiting 1s before next key...");
             await new Promise(r => setTimeout(r, 1000));
          }
          if (err.response) {
            console.error(">>> Status:", err.response.status);
            console.dir(err.response.data, { depth: null });
          } else {
            console.error(">>> Error:", err.message || err);
          }
        }
      }
      if (success) break;
    }

    if (!success || !rawOutput) {
      console.error("[CRITICAL] All models and keys failed to process this receipt.");
      return res.status(502).json({ error: "All OCR/Vision API fallback keys failed. Please try again later." });
    }

    console.log("[DEBUG] Raw AI Output Received:", rawOutput.substring(0, 200) + "...");
    
    // Scrub Markdown if the AI stubbornly forces it
    let cleanedJsonString = rawOutput.trim();
    if (cleanedJsonString.startsWith("```json")) {
      cleanedJsonString = cleanedJsonString.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanedJsonString.startsWith("```")) {
      cleanedJsonString = cleanedJsonString.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let extractedItems = [];
    try {
      extractedItems = JSON.parse(cleanedJsonString);
      console.log(`[DEBUG] Successfully parsed ${extractedItems.length} items`);
    } catch (e) {
      console.error("[DEBUG] JSON Parse Failure. Cleaned string:", cleanedJsonString);
      return res.status(422).json({ error: "AI failed to format JSON accurately", raw: rawOutput });
    }

    return res.status(200).json({
      success: true,
      items: extractedItems,
      source: "gemini_multimodal"
    });

  } catch (err) {
    console.error("Scan Controller Error: ", err);
    return res.status(500).json({ error: "Failed to process image scan" });
  }
};
