// routes/chat.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

// Optional: if you have auth middleware, use it here
// const restricted = require("./helpers/helpers").restricted;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", /*restricted,*/ async (req, res) => {
  try {
    const { messages } = req.body;

    // Basic validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    // IMPORTANT: keep only last N messages to control cost
    const trimmed = messages.slice(-12);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant inside a messaging app. Be concise. If you don't know, say so."
        },
        ...trimmed
      ],
      temperature: 0.6
    });

    const reply = completion.choices?.[0]?.message?.content ?? "";
    return res.json({ reply });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "Chatbot failed" });
  }
});

module.exports = router;
