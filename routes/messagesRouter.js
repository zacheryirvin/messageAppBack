const express = require('express');
const router = express.Router();
const messageDb = require('../database/actions/messageActions.js');
const restrictedCheck = require('./helpers/helpers.js').restricted

router.get('/:id', restrictedCheck, async (req,res) => {
  try {
    const toId = req.params.id
    const userId = req.session.user.id
    const conversation = await messageDb.getConversation(userId, toId);
    const listen = messageDb.listenConversation();
    return res.status(200).json(conversation['rows']);
  } catch (err) {
    console.log(err);
  }
});

router.post('/', restrictedCheck, async (req, res) => {
  try {
    const {toId, message} = req.body;
    console.log(message)
    const userId = req.session.user.id;
    const friendCheck = await messageDb.friendCheck(userId, toId);
    if (friendCheck['rows'][0]['isfriend'] === true) {
      const sendMessage = await messageDb.addMessage(userId, toId, message);
      console.log(sendMessage)
      return res.status(201).json("success");
    }
    return res.status(500).json("error");
  } catch(err) {
    console.log(err);
  }
});

router.delete('/', restrictedCheck, async (req, res) => {
  try {
    const {toId} = req.body;
    const {userId} = req.session.user;
    const deleteConversation = await messageDb.deleteConversation(userId, toId);
    return res.status(204).json(deleteConversation);
  }catch(err) {
    console.log(err);
  }
});

module.exports=router;
