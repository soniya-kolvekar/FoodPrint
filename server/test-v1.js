const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testV1() {
  const key = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_3;
  if (!key) return;

  // Forcing v1 version
  const genAI = new GoogleGenerativeAI(key);
  
  const ids = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];

  for (const id of ids) {
    try {
      console.log(`\n--- Testing ${id} on v1 ---`);
      // The Node SDK doesn't have a direct way to toggle v1/v1beta in the constructor easily, 
      // but we can see if the ID works better.
      const model = genAI.getGenerativeModel({ model: id });
      const result = await model.generateContent("hi");
      console.log(`[SUCCESS] ${id}: ${await result.response.text()}`);
    } catch (e) {
      console.log(`[FAILED] ${id}: ${e.message}`);
    }
  }
}

testV1();
