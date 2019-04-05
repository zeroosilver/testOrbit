let request = require('request');
let moment = require('moment');

const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

// variables for foobot request
let user_id = "yoo@byoo.net";
let auth_token = "eyJhbGciOiJIUzI1NiJ9.eyJncmFudGVlIjoieW9vQGJ5b28ubmV0IiwiaWF0IjoxNDgyMTcwMTQ5LCJ2YWxpZGl0eSI6LTEsImp0aSI6IjBCQjlFNkRFLUE0QjYtNDM5NS1BNTNDLTNDQTQzQUI3QzVGQSIsInBlcm1pc3Npb25zIjpbImRldmljZTpyZWFkIiwidXNlcjpyZWFkIl0sInF1b3RhIjoxNTAwMCwicmF0ZUxpbWl0Ijo1fQ.LG0UYX9qmmHiAF9cW-XGjM3u1Fx2k4naJ20CVTCJx7g";
let average = 0;
// Foobot uuid - 이름 매칭 name matching
let foobot = new Map();
// sensor 값 - 순서 매칭 sequence matching
let sensorsOrder = new Map();

const ipfsOptions = { EXPERIMENTAL: { pubsub: true } }
const ipfs = new IPFS(ipfsOptions)

ipfs.on('error', (e) => console.error(e))
ipfs.on('ready', async () => {

	// Open a database
	const orbitdb = new OrbitDB(ipfs)
	const docstore = await orbitdb.docstore('foobot', { indexBy: "time" })
	await docstore.load()

	intervalFunc(docstore)
	//Store foobot data every 5 minutes
	// setInterval(function () { intervalFunc(docstore) }, 300000)
})



async function intervalFunc(docstore) {
	// login 요청 객체 생성
	new FoobotAPI().login(user_id, auth_token, function (result) {

		// console.log(result.length);

		//uuid - Name 매칭
		for (let j = 0; j < result.length; j++)
			foobot.set(result[j].uuid, result[j].name)

		//Yoo-Foobot의 수 만큼 getData 수행
		//Perform getData as many as Yoo-Forbot
		for (i = 0; i < result.length; i++) {
			
			
			//get the very last data point.
			new FoobotAPI().getData(result[i].uuid, auth_token, average, function (result, remainCount) {
				//sensors - order 매칭
				for (let j = 0; j < result.sensors.length; j++)
					sensorsOrder.set(result.sensors[j], j);

				let dataAirQuality = {}
				result.datapoints.forEach(datapoint => {
					// { index: 'dynamotoes',
					// 	name: 'Yoo-Foobot06',
					// 	time: '2019-03-26T17:58:12+09:00',
					// 	'@timestamp': '2019-03-26T17:58:12+09:00',
					// 	particle: 28.540009,
					// 	temp: 18.961,
					// 	humidity: 32.929,
					// 	co2: 1085,
					// 	voc: 300,
					// 	pollution: 52.52858 }
					dataAirQuality = {
						"index": { _index: 'dynamotoes', _type: 'logs' },
						"name": foobot.get(result.uuid),
						"time": moment(datapoint[sensorsOrder.get('time')] * 1000 + 3600).format(),
						"@timestamp": moment(datapoint[sensorsOrder.get('time')] * 1000 + 3600).format(),
						"particle": datapoint[sensorsOrder.get('pm')],
						"temp": datapoint[sensorsOrder.get('tmp')],
						"humidity": datapoint[sensorsOrder.get('hum')],
						"co2": datapoint[sensorsOrder.get('co2')],
						"voc": datapoint[sensorsOrder.get('voc')],
						"pollution": datapoint[sensorsOrder.get('allpollu')]
					};
				});

				// console.log(dataAirQuality);

				if (!(Object.keys(dataAirQuality).length === 0)) {
					//Output hash for stored data
					docstore.put(dataAirQuality).then((hash) => console.log(hash))
						// .then(function () {
						// 	//orbitDB에 저장된 모든 foobot 데이터 출력
						// 	// const all = docstore.query((doc) => doc.name = 'Yoo-Foobot06')
						// 	// console.log(all)
						// })
				} else console.log("dataAirQuality is null");
			})
		}

		//Outputs all saved foobot data
		const profile = docstore.get('');
		console.log(profile)

	});
}

function FoobotAPI() {
	//getData 함수
	this.getData = function (uuid, auth_token, average, callback) {
		//GET /v2/device/{uuid}/datapoint/{period}/last/{averageBy}/
		//Use period = 0 and averageBy = 0 to get the very last data point.
		//let url = 'http://api.foobot.io/v2/device/'+uuid+'/datapoint/'+start+'/'+end+'/'+average+'/'
		let getLastUrl = 'http://api.foobot.io/v2/device/' + uuid + '/datapoint/0/last/' + average + '/';

		//header 설정
		let headers = {
			'Content-Type': 'application/json',
			'X-API-KEY-TOKEN': auth_token
		};

		//request 옵션
		let options = {
			url: getLastUrl,
			method: 'GET',
			headers: headers
		};

		//URL Request
		request(options, function (error, response, body) {

			if (!error && response.statusCode == 200) {
				//console.log("foobot api get data called")
				result = JSON.parse(body);
				callback(result, response.headers['x-api-key-limit-remaining'])
			}
			else {
				console.log("Fail : " + response.statusCode);
				console.log(body)
			}
		})
	};

	this.login = function (user_id, auth_token, callback) {

		//setting header
		let headers = {
			'Content-Type': 'application/json',
			'X-API-KEY-TOKEN': auth_token
		};

		//request option
		let options = {
			url: 'http://api.foobot.io/v2/owner/' + user_id + '/device/',
			method: 'GET',
			headers: headers
		};

		//URL request
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("foobot api login called");
				result = JSON.parse(body);
				callback(result)
			}
			else {
				console.log("Fail : " + response.statusCode);
				console.log(body)
			}
		})
	}
}