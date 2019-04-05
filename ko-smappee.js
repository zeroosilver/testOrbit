/**
 * Created by KIST_W on 2017-08-22.
 */
var SmappeeAPI = require('smappee-nodejs');



var smappee = new SmappeeAPI({
	debug: false,

	clientId: "wrl",
	clientSecret: "kvR9j0SSoH",

	username: "wrl",
	password: "kistimrc"
});

/*
var smappee = new SmappeeAPI({
	debug: false,

	clientId: "anjuyeong",
	clientSecret: "tAdAAd9A2p",

	username: "juyoungahn",
	password: "a4809804"
});
*/
module.exports = smappee;