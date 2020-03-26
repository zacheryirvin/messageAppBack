const pool = require('./config.js')

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

module.exports=query;
