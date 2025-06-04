require('dotenv').config();
const axios = require('axios');

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const headers = { Authorization: `Bearer ${HUBSPOT_TOKEN}` };

async function getLineItemIds(dealId) {
  const url = `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/line_items`;
  const res = await axios.get(url, { headers });
  return res.data.results.map(item => item.id);
}

async function getLineItemDetails(itemId) {
  const url = `https://api.hubapi.com/crm/v3/objects/line_items/${itemId}?properties=price,quantity,hs_discount,createdate`;
  const res = await axios.get(url, { headers });
  return res.data;
}

function calculateTotal(lineItems) {
  const sorted = lineItems.sort((a, b) => new Date(a.properties.createdate) - new Date(b.properties.createdate));
  const filtered = sorted.slice(1);
  let total = 0;
  for (const item of filtered) {
    const { price = 0, quantity = 1, hs_discount = 0 } = item.properties;
    const q = parseFloat(quantity) || 1;
    const p = parseFloat(price) || 0;
    const d = parseFloat(hs_discount) || 0;
    total += q * p * (1 - d / 100);
  }
  return Math.round(total * 100) / 100;
}

async function updateDeal(dealId, value) {
  const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;
  await axios.patch(url, {
    properties: { custom_total_lineitems: value }
  }, { headers });
  console.log(`✅ Deal aggiornato con valore: €${value}`);
}

module.exports = async function calculateAndUpdateDeal(dealId) {
  const ids = await getLineItemIds(dealId);
  const details = await Promise.all(ids.map(getLineItemDetails));
  const total = calculateTotal(details);
  await updateDeal(dealId, total);
}
