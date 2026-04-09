const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testConnectivity() {
  const key = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_3;
  if (!key) {
    console.error("No API key found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(key);
  
  const ids = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-8b"
  ];

  for (const id of ids) {
    try {
      console.log(`\n--- Testing ${id} ---`);
      const model = genAI.getGenerativeModel({ model: id });
      const result = await model.generateContent("hi");
      const text = await result.response.text();
      console.log(`[SUCCESS] ${id}: ${text.substring(0, 10)}`);
    } catch (e) {
      console.log(`[FAILED] ${id}: ${e.message}`);
    }
  }
}

testConnectivity();
