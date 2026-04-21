exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: ''
    };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { plz, l, b, h, kg } = JSON.parse(event.body);

    const SENDIFY_API_KEY = '172m.jHThf605WNoNNImpz5P3aZzoUaceNbXrDMXxVI3ucuo=';

    // Schritt 1: Sendung anlegen (POST /shipments)
    const shipmentBody = {
      sender: {
        company: 'Gartenholz.org',
        name: 'Tiberius Sondermann',
        street: 'Uferstrasse 4',
        zip: '57413',
        city: 'Finnentrop',
        country: 'DE',
        phone: '',
        email: ''
      },
      recipient: {
        company: '',
        name: 'Empfaenger',
        street: 'Musterstrasse 1',
        zip: plz,
        city: 'Zielort',
        country: 'DE',
        phone: '',
        email: ''
      },
      parcels: [
        {
          weight: Math.round(kg * 10) / 10,
          length: Math.round(l),
          width: Math.round(b),
          height: Math.round(h)
        }
      ]
    };

    const shipmentResp = await fetch('https://api.sendify.com/v1/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SENDIFY_API_KEY
      },
      body: JSON.stringify(shipmentBody)
    });

    const shipmentData = await shipmentResp.json();

    if (!shipmentResp.ok) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Shipment creation failed', raw: shipmentData })
      };
    }

    const shipmentId = shipmentData.id || shipmentData.shipment_id || shipmentData.data?.id;

    if (!shipmentId) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No shipment ID in response', raw: shipmentData })
      };
    }

    // Schritt 2: Rates abrufen (GET /shipments/{id}/rates)
    const ratesResp = await fetch(`https://api.sendify.com/v1/shipments/${shipmentId}/rates`, {
      method: 'GET',
      headers: {
        'x-api-key': SENDIFY_API_KEY
      }
    });

    const ratesData = await ratesResp.json();

    if (!ratesResp.ok) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Rates fetch failed', raw: ratesData })
      };
    }

    // Günstigsten Preis extrahieren
    let bestPrice = null;
    let bestCarrier = null;
    let allOffers = [];

    // Mögliche Strukturen abfangen
    const offers =
      ratesData.rates ||
      ratesData.offers ||
      ratesData.products ||
      ratesData.data ||
      (Array.isArray(ratesData) ? ratesData : null);

    if (Array.isArray(offers) && offers.length > 0) {
      offers.forEach(o => {
        const price = parseFloat(o.price || o.total_price || o.amount || o.net_price || 0);
        const carrier = o.carrier || o.carrier_name || o.service || o.name || 'Sendify';
        allOffers.push({ carrier, price });
        if (bestPrice === null || price < bestPrice) {
          bestPrice = price;
          bestCarrier = carrier;
        }
      });
    } else if (ratesData.price || ratesData.total_price) {
      bestPrice = parseFloat(ratesData.price || ratesData.total_price);
      bestCarrier = 'Sendify';
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        price: bestPrice,
        carrier: bestCarrier,
        offers: allOffers,
        shipmentId,
        raw: ratesData
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
