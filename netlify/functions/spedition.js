const PLZ_COORDS = {
  '01':[51.05,13.74],'02':[51.50,14.63],'03':[51.76,14.33],'04':[51.34,12.38],
  '06':[51.48,11.97],'07':[50.93,11.59],'08':[50.63,12.50],'09':[50.83,12.92],
  '10':[52.52,13.40],'12':[52.44,13.43],'13':[52.56,13.35],'14':[52.39,13.06],
  '15':[52.24,14.37],'16':[52.84,13.49],'17':[53.73,13.49],'18':[54.09,12.14],
  '19':[53.62,11.42],'20':[53.55,10.00],'21':[53.37,9.97],'22':[53.60,10.05],
  '23':[53.87,10.69],'24':[54.32,10.13],'25':[54.08,9.25],'26':[53.14,8.22],
  '27':[53.08,8.81],'28':[53.08,8.80],'29':[52.73,10.39],'30':[52.37,9.73],
  '31':[52.10,9.36],'32':[52.02,8.53],'33':[51.72,8.76],'34':[51.32,9.50],
  '35':[50.58,8.67],'36':[50.56,9.68],'37':[51.54,9.93],'38':[52.27,10.52],
  '39':[52.13,11.64],'40':[51.22,6.78],'41':[51.20,6.44],'42':[51.27,7.20],
  '44':[51.51,7.47],'45':[51.46,7.01],'46':[51.66,6.76],'47':[51.44,6.63],
  '48':[52.03,7.63],'49':[52.27,8.05],'50':[50.94,6.96],'51':[50.94,7.10],
  '52':[50.78,6.09],'53':[50.74,7.10],'54':[49.75,6.64],'55':[49.99,8.27],
  '56':[50.36,7.59],'57':[51.11,8.02],'58':[51.37,7.46],'59':[51.52,7.93],
  '60':[50.11,8.68],'61':[50.23,8.62],'63':[50.10,8.96],'64':[49.87,8.65],
  '65':[50.08,8.24],'66':[49.23,7.00],'67':[49.44,8.17],'68':[49.49,8.47],
  '69':[49.41,8.69],'70':[48.78,9.18],'71':[48.89,9.19],'72':[48.49,8.97],
  '73':[48.80,9.83],'74':[49.12,9.22],'75':[48.89,8.70],'76':[49.01,8.40],
  '77':[48.35,7.89],'78':[47.96,8.48],'79':[47.99,7.85],'80':[48.14,11.58],
  '81':[48.11,11.60],'82':[47.99,11.33],'83':[47.86,12.10],'84':[48.57,12.16],
  '85':[48.37,11.79],'86':[48.36,10.90],'87':[47.73,10.32],'88':[47.89,9.61],
  '89':[48.40,9.99],'90':[49.45,11.08],'91':[49.44,10.99],'92':[49.68,12.15],
  '93':[49.01,12.10],'94':[48.57,13.46],'95':[50.02,11.79],'96':[49.89,10.89],
  '97':[49.80,9.93],'98':[50.68,10.93],'99':[50.98,11.03],
};

function getCoords(plz){
  const p=plz.replace(/\s/g,'');
  return PLZ_COORDS[p.substring(0,3)]||PLZ_COORDS[p.substring(0,2)]||null;
}

function haversineKm(lat1,lng1,lat2,lng2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const FINNENTROP=[51.1167,8.0667];

exports.handler=async function(event){
  if(event.httpMethod==='OPTIONS'){
    return{statusCode:200,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'},body:''};
  }
  if(event.httpMethod!=='POST'){
    return{statusCode:405,body:'Method Not Allowed'};
  }

  try{
    const{plz,l,b,h,kg}=JSON.parse(event.body);

    // Entfernung berechnen
    let kmEigenfahrt=null;
    const zielCoords=getCoords(plz);
    if(zielCoords){
      const luftlinie=haversineKm(FINNENTROP[0],FINNENTROP[1],zielCoords[0],zielCoords[1]);
      kmEigenfahrt=Math.round(luftlinie*1.3);
    }

    // Pakettyp bestimmen
    const isPalette=kg>=40;
    const packagingType=isPalette?'disposable_pallet':'packet';

    const params=new URLSearchParams({
      userid:'10042328',
      password:'9z4SvYNnLViIujnkCIyAeyaWwy6zDq8u0XPnzInJ',
      submit:'price',
      sendshipping:'0',
      'length[0]':Math.round(l),
      'width[0]':Math.round(b),
      'height[0]':Math.round(h),
      'weight[0]':Math.round(kg),
      'valueofgoods[0]':'500',
      'packagingtype[0]':packagingType,
      picup_company:'Gartenholz.org',
      picup_firstname:'Tiberius',
      picup_lastname:'Sondermann',
      picup_street:'Uferstrasse 4',
      picup_zip:'57413',
      picup_city:'Finnentrop',
      picup_country:'DE',
      delivery_company:'Kunde',
      delivery_firstname:'Max',
      delivery_lastname:'Mustermann',
      delivery_street:'Musterstrasse 1',
      delivery_zip:plz,
      delivery_city:'Zielort',
      delivery_country:'DE',
    });

    const response=await fetch('https://www.cargointernational.de/api/shipping/new_order',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:params.toString(),
    });

    const data=await response.json();

    // Preis aus Antwort extrahieren
    let price=null;
    if(data.price) price=data.price;
    else if(data.total_price) price=data.total_price;
    else if(data.netto) price=data.netto;
    else if(data.data?.price) price=data.data.price;
    else if(data.offers?.[0]?.price) price=data.offers[0].price;
    else if(Array.isArray(data)&&data[0]?.price) price=data[0].price;
    else if(data['0']?.price) price=data['0'].price;

    return{
      statusCode:200,
      headers:{'Access-Control-Allow-Origin':'*'},
      body:JSON.stringify({price,km:kmEigenfahrt,raw:data}),
    };
  }catch(err){
    return{
      statusCode:500,
      headers:{'Access-Control-Allow-Origin':'*'},
      body:JSON.stringify({error:err.message}),
    };
  }
};
