require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const calculateAndUpdateDeal = require('./index');

const app = express();
app.use(bodyParser.json());

app.post('/webhook/deal-updated', async (req, res) => {
  const dealId = req.body.objectId || req.body.dealId;
  if (!dealId) return res.status(400).send("Missing deal ID");

  try {
    await calculateAndUpdateDeal(dealId);
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
