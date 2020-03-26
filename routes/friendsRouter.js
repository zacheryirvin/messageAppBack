const express = require('express');
const router = express.Router();
const friendsDb = require('../database/actions/friendsActions.js')

router.get('/', async (req, res) => {
  try {
    console.log(req.body)
    const {id} = req.body;
    const friends = await friendsDb.getFriends(id);
    console.log(friends);
    return res.status(200).json(friends.rows);
  } catch (err) {
    console.log(err);
  }
});

module.exports=router;
