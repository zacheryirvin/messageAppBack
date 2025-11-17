const express = require('express')
const router = express.Router();
const messageDb = require('../database/action/messageActions.js');
const restrictedCheck = require('./helpers/helpers.js').restricted;
import OpenAI from "openai"

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

router.get('/:id', restrictedCheck, async (req,res) => {
  try {
    const toId = req.params.id
    const userId = req.session.user.id
    const conversation = await messageDb.getConversation(userId, toId);
    // const listen = messageDb.listenConversation();
    return res.status(200).json(conversation['rows']);
  } catch (err) {
    console.log(err);
  }
});

router.get('/:id/feed', restrictedCheck, async (req, res) => {
  try {
    const listen = messageDb.listenConversation();
    return res.status(200).json({Message: 'subscribe'})
  } catch (err) {
    console.log(err);
  }
})

router.post('/', restrictedCheck, async (req, res) => {
  try {
    const {toId}= req.body;
    const conversation= await messageDb.getConversation(userId, toId);
    const message = await openai.chat.completion.create({
      model: "gpt-4.1-mini",
      messages: conversation,
      temperature: 0.7,
      max_tokens: 300,
    });
    const botReplyText = completion.choices[0]?.message?.content?.trim() || "Sorry, I had trouble responding. Please try again.";
      
    const userId = req.session.user.id;
    const friendCheck = await messageDb.friendCheck(userId, toId);
    if (friendCheck['rows'][0]['isfriend'] === true) {
      const sendMessage = await messageDb.addMessage(userId, toId, botReplyText);
      return res.status(201).json("success");
    }
    return res.status(500).json("error");
  } catch(err) {
    console.log(err);
  }
});


module.exports=router;


