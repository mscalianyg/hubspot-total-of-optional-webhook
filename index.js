require("dotenv").config();
const axios = require("axios");

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

async function getLineItemsForDeal(dealId) {
  const url = `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/line_items`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return res.data.results;
}

async function getLineItemDetails(lineItemId) {
  const url = `https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    params: {
      properties: ["price", "quantity", "hs_discount", "createdate"].join(","),
    },
  });

  return res.data.properties;
}

async function updateDealTotal(dealId, total) {
  const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;
  await axios.patch(
    url,
    {
      properties: {
        custom_total_lineitems: total,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function calculateAndUpdateDeal(dealId) {
  try {
    console.log(`📥 Calcolo per Deal ID: ${dealId}`);

    const associatedLineItems = await getLineItemsForDeal(dealId);

    if (!associatedLineItems.length) {
      console.warn("❗ Nessun line item associato al Deal.");
      return;
    }

    console.log("📦 Line items ricevuti:", associatedLineItems);

    // Ordina per data di creazione e rimuove il primo
    const sortedLineItems = [];

    for (const item of associatedLineItems) {
      const id = item.id || item.toObjectId || item.objectId;

      if (!id) {
        console.warn("⚠️ Line item senza ID valido:", item);
        continue;
      }

      const details = await getLineItemDetails(id);
      sortedLineItems.push({ id, ...details });
    }

    sortedLineItems.sort(
      (a, b) => new Date(a.createdate) - new Date(b.createdate)
    );

    const lineItemsToSum = sortedLineItems.slice(1);

    let total = 0;
    for (const item of lineItemsToSum) {
      const price = parseFloat(item.price || 0);
      const quantity = parseFloat(item.quantity || 1);
      const discount = parseFloat(item.hs_discount || 0);

      total += (price * quantity) * (1 - discount / 100);
    }

    console.log(`💰 Totale calcolato: ${total}`);

    await updateDealTotal(dealId, total);
    console.log("✅ Proprietà aggiornata con successo.");
  } catch (error) {
    console.error("❌ Errore durante l’elaborazione:", error);
  }
}

module.exports = { calculateAndUpdateDeal };
