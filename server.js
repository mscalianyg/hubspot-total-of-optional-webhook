const express = require("express");
const bodyParser = require("body-parser");
const { calculateAndUpdateDeal } = require("./index"); // ✅ IMPORT CORRETTO
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post('/webhook/total-of-optionals', async (req, res) => {
  console.log("📬 Webhook ricevuto:");
  console.log(JSON.stringify(req.body, null, 2));

  if (!Array.isArray(req.body)) {
    console.log("❌ Payload non è un array");
    return res.status(400).send("Invalid payload format");
  }

  try {
    for (const event of req.body) {
      const dealId = event.objectId;

      if (typeof dealId === 'undefined' || dealId === null) {
        console.log("❌ Evento senza objectId:", JSON.stringify(event));
        continue;
      }

      console.log("👉 Deal ID ricevuto:", dealId);
      await calculateAndUpdateDeal(dealId);
      console.log("✅ Ricalcolo completato per Deal", dealId);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Errore durante l’elaborazione:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});
