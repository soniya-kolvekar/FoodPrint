const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function test() {
  const key = process.env.GEMINI_API_KEY_1;
  console.log("Using Key ending in:", key.substring(key.length - 4));
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Simple text prompt to test basic key functionality first
    const result = await model.generateContent("Hello, respond with JSON: []");
    const text = await result.response.text();
    console.log("SUCCESS TEXT ONLY:", text);

  } catch (err) {
    console.error("FAIL TEXT ONLY:", err.message);
    if (err.response) console.error("Response:", JSON.stringify(err.response, null, 2));
  }
}

test();
