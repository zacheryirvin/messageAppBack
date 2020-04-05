const pool = require('./config.js')
const Pusher = require('pusher');

const query = async (text, values) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(text, values);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    return err;
  } finally {
    await client.release();
  }
}

const messageQuery = async () => {
  const pusher = new Pusher({
    appId: '976291',
    key: '5033bb4cfc6d9a9ce2ea',
    secret: 'de189c42289477c7806c',
    cluster: 'us3',
  });
  const client = await pool.connect((err, client) => {
    if (err) {
      console.log(err)
    }

    client.on('notification', (msg) => {
      pusher.trigger('watch_messages', 'new_record', JSON.parse(msg.payload));
    })
    const query = client.query('listen watch_messages');
  })
}

module.exports={
  query,
  messageQuery
};
