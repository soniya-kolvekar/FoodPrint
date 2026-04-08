const multer = require('multer');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration fallback
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true }); // Reads directly from CLOUDINARY_URL
}

// Ensure multipart operations go straight to memory 
const storage = multer.memoryStorage();
exports.upload = multer({ storage });

/**
 * Intelligent Data Normalization & NLP Filters
 */
function parseGroceryText(rawText) {
  const items = [];
  const lines = rawText.split('\n');
  
  lines.forEach(line => {
    line = line.trim().toLowerCase();
    if (line.length < 3) return; // skip garbage
    
    let quantity = 1;
    let unit = "unit";
    let name = line;

    // Remove numbers and extract quantities if leading
    const leadingQty = line.match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|lbs|oz|x)?\s+(.*)/);
    if (leadingQty) {
       quantity = parseFloat(leadingQty[1]);
       if (leadingQty[2]) unit = leadingQty[2];
       name = leadingQty[3];
    }
    
    // Clean name: Drop special chars and numbers
    name = name.replace(/[^a-z ]/g, '').trim();

    // 1. Aggressive Noise Dictionary 
    // Targets financials, store data, locations, staff, and policies.
    const noise = [
       'total', 'subtotal', 'tax', 'cash', 'card', 'change', 'sale', 'save', 'store', 
       'receipt', 'visa', 'mastercard', 'qty', 'amount', 'balance', 'due', 'supermarket', 
       'market', 'grocery', 'walmart', 'target', 'costco', 'kroger', 'manager', 'cashier', 
       'date', 'time', 'pm', 'am', 'website', 'www', '.com', 'returns', 'policy', 'phone', 
       'tel', 'california', 'san diego', 'ca', 'tx', 'ny', 'street', 'blvd', 'ave', 'dr',
       'highway', 'hwy', 'parkway', 'plaza', 'center', 'thank you', 'welcome', 'visited'
    ];
    
    if (noise.some(n => name.includes(n))) return;
    
    // 2. Heuristic checks
    if (name.length < 3) return; // Too short
    if (name.split(' ').length > 4) return; // Grocery items are rarely 5+ words long (usually just "Organic 2% Milk")
    if (!/[aeiou]/.test(name)) return; // Must contain at least one vowel to be a real word
    
    // 3. Fallback normalizer
    if (name.includes('milk')) name = 'milk';
    else if (name.includes('egg')) name = 'eggs';
    else if (name.includes('apple')) name = 'apples'; // Map strictly to dictionary
    else if (name.includes('chicken')) name = 'chicken';
    else if (name.includes('tomato')) name = 'tomatoes';
    else if (name.includes('cheese')) name = 'cheese';
    else if (name.includes('bread')) name = 'bread';

    items.push({
      name: name,
      quantity,
      unit
    });
  });
  
  // Deduplicate array
  const uniqueItems = Array.from(new Set(items.map(a => a.name)))
     .map(name => items.find(a => a.name === name));
     
  return uniqueItems;
}

exports.processScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imageBuffer = req.file.buffer;
    let rawText = "";

    console.log("Processing Scan natively via Tesseract...");
    
    // 1. Primary Engine: FREE NATIVE TESSERACT OCR
    try {
        const { data: { text, confidence } } = await Tesseract.recognize(imageBuffer, 'eng');
        console.log(`Tesseract completed. Confidence: ${confidence}`);
        
        if (text && text.trim().length > 10) {
            rawText = text;
        } else {
            throw new Error("Tesseract text low confidence / empty");
        }
    } catch(err) {
        console.log("Tesseract failed. Engaging OCR.space fallback...", err.message);
        
        // 2. Fallback Engine: OCR.space Base64
        if (process.env.OCR_SPACE_API_KEY) {
            const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
            
            const formData = new URLSearchParams();
            formData.append('base64Image', base64Image);
            formData.append('apikey', process.env.OCR_SPACE_API_KEY);
            formData.append('OCREngine', '2'); // Engine 2 better for numbers/receipts
            
            const ocrRes = await axios.post('https://api.ocr.space/parse/image', formData);
            if (ocrRes.data && !ocrRes.data.IsErroredOnProcessing) {
                 rawText = ocrRes.data.ParsedResults[0].ParsedText;
            }
        }
    }

    if (!rawText) {
        return res.status(422).json({ error: "Could not read text from image. Please try a clearer picture." });
    }

    // 3. NLP Normalization
    const extractedItems = parseGroceryText(rawText);

    // Optional: Push to Cloudinary async for UI rendering history if URL provided
    let uploadedUrl = null;
    if (process.env.CLOUDINARY_URL) {
       // Just uploading it sync as an example (ideally do this async without blocking if just for logs)
       try {
           uploadedUrl = await new Promise((resolve) => {
               cloudinary.uploader.upload_stream({ folder: 'receipts' }, (error, result) => {
                   if(result) resolve(result.secure_url);
                   else resolve(null);
               }).end(imageBuffer);
           });
       } catch (e) {
           console.log("Cloudinary upload ignored");
       }
    }

    return res.status(200).json({
      success: true,
      items: extractedItems,
      imageUrl: uploadedUrl,
      rawOutput: rawText
    });

  } catch (err) {
    console.error("Scan Controller Error: ", err);
    return res.status(500).json({ error: "Failed to process image scan" });
  }
};
