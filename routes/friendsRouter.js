const express = require('express');
const router = express.Router();
const friendsDb = require('../database/actions/friendsActions.js');
const restrictedCheck = require('./helpers/helpers.js').restricted;

router.get('/', restrictedCheck, async (req, res) => {
  try {
    const id = req.session.user.id
    const friends = await friendsDb.getFriends(id);
    return res.status(200).json(friends['rows']);
  } catch (err) {
    console.log(err);
  }
});

router.post('/add', restrictedCheck, async (req, res) => {
  try {
    const {toId} = req.body;
    const id = req.session.user.id;
    const requestFriend = await friendsDb.addFriend(id, toId);
    // console.log(requestFriend);
    res.status(201).json(requestFriend)
  }catch(err) {
    console.log(err);
  }
})

router.post('/confirm', restrictedCheck, async (req, res) => {
  try {
    const {toId} = req.body;
    const id = req.session.user.id;
    const ConfirmFriend = await friendsDb.confirmFriend(id, toId);
    res.status(201).json({Message: 'Friend Confirmed'})
  }catch(err) {
    console.log(err);
  }
})

router.delete('/', restrictedCheck, async (req, res) => {
  try {
    const {toId} = req.body
    const id = req.session.user.id
    toId.forEach(async (x) => {
      const del = await friendsDb.deleteFriend(id, x)
    })
    return res.status(200).json({Message: "Friends deleted"})
  }catch (err) {
    console.log(err);
  } 
})

module.exports=router;
