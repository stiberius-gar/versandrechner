exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { plz, l, b, h, kg } = JSON.parse(event.body);

    const params = new URLSearchParams({
      userid: '10042328',
      password: 'dROoxLzCaIuc2Yl8UMmSUbivSy3XKvp5wDqUozUR',
      submit: 'price',
      sendshipping: '0',
      'length[0]': l,
      'width[0]': b,
      'height[0]': h,
      'weight[0]': kg,
      'valueofgoods[0]': '500',
      picup_company: 'Gartenholz.org',
      picup_firstname: 'Tiberius',
      picup_lastname: 'Sondermann',
      picup_street: 'Uferstrasse 4',
      picup_zip: '57413',
      picup_city: 'Finnentrop',
      picup_country: 'DE',
      delivery_company: 'Kunde',
      delivery_firstname: 'Max',
      delivery_lastname: 'Mustermann',
      delivery_street: 'Musterstrasse 1',
      delivery_zip: plz,
      delivery_city: 'Zielort',
      delivery_country: 'DE',
    });

    const response = await fetch('https://www.cargointernational.de/api/shipping/new_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
