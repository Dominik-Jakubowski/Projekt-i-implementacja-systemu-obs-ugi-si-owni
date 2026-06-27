require('dotenv').config();

const app = require('./app');
const { connectToDatabase } = require('./db/pool');

const port = process.env.PORT || 3000;

async function startServer() {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
