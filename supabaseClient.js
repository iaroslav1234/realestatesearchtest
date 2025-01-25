import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing!");
  throw new Error("Supabase environment variables are missing!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debugging logs
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key:", supabaseAnonKey);
console.log("OpenAI API Key:", process.env.OPENAI_API_KEY);

if (!process.env.OPENAI_API_KEY) {
  console.error("OpenAI API Key is missing!");
  throw new Error("OpenAI API Key is missing!");
}

// OpenAI configuration
let openaiClient;
try {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("OpenAI initialized successfully!");
} catch (error) {
  console.error("Error initializing OpenAI:", error.message);
  throw error;
}

export const openai = openaiClient;
