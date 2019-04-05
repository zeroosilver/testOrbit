//2019.03.21 orbitDB docstore(local)에 smappee 데이터를 저장(pub)
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const smappee = require('./ko-smappee');
const moment = require('moment');

const ipfsOptions = { EXPERIMENTAL: { pubsub: true } }
const ipfs = new IPFS(ipfsOptions)

//setting schema url
const context = 'https://schema.iot.webizing.org'

ipfs.on('error', (e) => console.error(e))
ipfs.on('ready', async () => {

  // Open a database
  const orbitdb = new OrbitDB(ipfs)
  //docstore orbitdb
  const docstore = await orbitdb.docstore('smappee', { indexBy: "time" })
  await docstore.load()

  intervalFunc(docstore)

  //Store smappee data every 5 minutes
  // setInterval(function () { intervalFunc(docstore) }, 300000);
})


function intervalFunc(docstore) {
  
  let from = moment().subtract(30, 'minutes').valueOf();
  let to = moment().add(10, 'minutes').valueOf();
  console.log(moment().subtract(30, 'minutes'));
  console.log(moment().add(30, 'minutes'));

  //appliance id as described in the service location info 
  //There is no application with id of 7 in 26626. I don't know why he set id to 7.
  let applianceId = 7;

  //"26636": livinglab ID
  smappee.getEvents("26636", applianceId, from, to, "1000", function (output) {

    console.log("**getEvent**");

    if (output.length) {
      let dataEvent = {
        index: { _index: 'energyappliancemonitor', _type: 'event' },
        "@context": context,
        "@type": "EnergyApplianceMonitor",
        "name": "Smappee00",
        "time": moment(e.timestamp).format(),
        "user": "livingLab",
        "address": "kist-livinglab",
        "applianceId": e.applianceId,
        "activePower": e.activePower,
      };

      // console.log(dataEvent)

      docstore.put(dataEvent)
        // .then(() => docstore.get('Smappee00'))
        // .then((value) => console.log('orbitDB에 저장된 형태' + value))
    } else {
      console.log("Events is null");
    }
  });

  smappee.getLatestConsumption("26636", function (output) {
    console.log("**getLatestConsumption**");
    // console.log(output)
    let e = output
    let dataConsumption = { 
      index: { _index: 'energymonitor', _type: 'consumption' },
      "@context": context,
      "@type": "EnergyMonitor",
      "name": "Smappee00",
      "time": moment(e.timestamp).format(),
      "user": "livingLab",
      "address": "kist-livinglab",
      "consumption": e.consumption,
      "alwaysOn": e.alwaysOn,
      "solar": e.solar
    };

    // { index: { _index: 'energymonitor', _type: 'consumption' },
    //   '@context': 'http://localhost:8080',
    //   '@type': 'EnergyMonitor',
    //   name: 'Smappee00',
    //   time: '2019-03-25T17:35:00+09:00',
    //   user: 'livingLab',
    //   address: 'kist-livinglab',
    //   consumption: 45.4,
    //   alwaysOn: 328,
    //   solar: 0 
    // }

    // console.log(dataConsumption)
    docstore.put(dataConsumption).then((hash) => console.log(hash))
    //Outputs all saved smappee00 data
    .then(() => docstore.get('Smappee00'))
    let all = docstore.query((doc) => doc.name = "Smappee00")
    console.log('all data')
    console.log(all)
    
  });


}
