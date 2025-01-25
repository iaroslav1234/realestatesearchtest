import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: "This is a test input.",
    });
    console.log("Response:", response);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testOpenAI();
