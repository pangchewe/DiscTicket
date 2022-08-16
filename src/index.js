const Client = require("./Classes/Client");
const config = require("../config.js");

const client = new Client(config);
client.run();
