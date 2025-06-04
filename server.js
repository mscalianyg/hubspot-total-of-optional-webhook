require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const calculateAndUpdateDeal = require('./index');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post('/webhook/total-of-optionals', async (req, res) => {
  console.log("📬 Webhook ricevuto:");
  console.log(JSON.stringify(req.body, null, 2));

  const dealId = req.body.objectId; // corretto per webhook da app privata

  if (!dealId) {
    console.log("❌ Errore: 'objectId' mancante nel payload");
    return res.status(400).send("Missing deal ID");
  }

  console.log("👉 Deal ID ricevuto:", dealId);

  try {
    await calculateAndUpdateDeal(dealId);
    console.log("✅ Ricalcolo completato con successo");
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Errore nel calcolo:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});
