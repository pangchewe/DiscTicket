
### Arkromikz Bot | Ticketing & Invoicing

"Arkromikz bot" is a bot originally made for Ticket Services.
Licenced use is prohibited 

#### How to setup the bot:
1. You must have a MongoDB database . You can get a free plan at [MongoDB Atlas](https://www.mongodb.com/). (Set network access to 0.0.0.0, or for improved security, only your (and VPS/VDS) IP, and create a new admin user after creating the database.)
2. Create a token in the [Discord Developer Portal](https://discord.com/developers/applications/). The token can be seen in the "Bot" tab of an application.
3. Input these, and other values into the `config.js` file visible in the root directory.
4. If you want to use the web api (which is experimental as of now), opt-in by switching the `web.enable` key to `true`. IT means you will need to input the clientID and clientSecret values.
5. Run `npm install` to install the required dependencies.
6. Run `npm run start` in the terminal to run. Run `npm run dev` to run with the nodemon file watcher.
Optional:
7. To run permanently an [ubuntu] server, install `pm2` with `npm i -g pm2` and run using `cd directory/to/bot && pm2 start src/index.js --name "arkromikzservicesbot"`.

