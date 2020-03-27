const express = require('express');
const router = express.Router();
const messageDb = require('../database/actions/messageActions.js');

router.get('/', async (req,res) => {
  try {
    const {userId, toId} = req.body;
    const conversation = await messageDb.getConversation(userId, toId);
    return res.status(200).json(conversation.rows);
  } catch (err) {
    console.log(err);
  }
});

router.post('/', async (req, res) => {
  try {
    const {userId, toId, message} = req.body;
    const friendCheck = await messageDb.friendCheck(userId, toId);
    if (friendCheck['rows'][0]['isfriend'] === true) {
      const sendMessage = await messageDb.addMessage(userId, toId, message);
      return res.status(201).json("success");
    }
    return res.status(500).json("error");
  } catch(err) {
    console.log(err);
  }
});

router.delete('/', async (req, res) => {
  try {
    const {userId, toId} = req.body;
    const deleteConversation = await messageDb.deleteConversation(userId, toId);
    return res.status(204).json(deleteConversation);
  }catch(err) {
    console.log(err);
  }
});

module.exports=router;