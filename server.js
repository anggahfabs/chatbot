import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  systemInstruction: "Anda adalah asisten asisten chatbot yang cerdas dan ramah. Selalu balas pesan menggunakan Bahasa Indonesia yang baik dan benar."
});

// Simpan context percakapan (format SDK: { role: 'user' | 'model', parts: [{ text: string }] })
let chatHistory = [];

// Endpoint chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    // Mulai chat session dengan history
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    // Update history di memori server agar bot ingat percakapan sebelumnya
    // (Penting: sendMessage otomatis menambah history di objek 'chat', 
    // tapi kita perlu simpan manual ke 'chatHistory' global kita jika ingin history tetap ada di request berikutnya)
    chatHistory.push({ role: "user", parts: [{ text: message }] });
    chatHistory.push({ role: "model", parts: [{ text: reply }] });

    res.json({ reply });

  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ 
      error: "AI error", 
      reply: "Maaf, terjadi kesalahan pada AI. Silakan coba lagi nanti." 
    });
  }
});

// Optional: reset chat history
app.post("/reset", (req, res) => {
  chatHistory = [];
  res.json({ status: "Chat history reset." });
});

// Endpoint untuk melihat history yang tersimpan
app.get("/history", (req, res) => {
  res.json(chatHistory);
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
