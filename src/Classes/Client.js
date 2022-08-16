require("dotenv").config();
const { Client, Intents } = require("discord.js");
const { EventHandler, InteractionHandler, CommandHandler, ComponentHandler } = require("@nortex/handler");
const Database = require("./Database.js");
const Embed = require("./Embed.js");
const TicketManager = require("./TicketManager");
const PayPalManager = require("./PayPalManager");
const WebServer = require("./WebServer");

module.exports = class extends Client {
	constructor(config = {}) {
		super({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES] });
		this.config = config;

		this.commandHandler = this.createCommandHandler();
		this.interactionHandler = this.createInteractionHandler();
		this.componentHandler = this.createComponentHandler();
		this.createEventHandler();

		this.embed = new Embed(this);
		this.db = new Database(this);
		this.ticketManager = new TicketManager(this);
		this.paypal = new PayPalManager(this);
		if (this.config.web.enable) this.web = new WebServer(this);

		this.useNewAfter = new Map();

		console.log("Client initialized.");
	}

	async run() {
		try {
			await super.login(this.config.token);
		} catch (err) {
			console.error("Can't login as the bot.", err);
		}
	}

	createCommandHandler() {
		const handler = new CommandHandler({
			client: this,
			directory: "./src/Commands",
			prefix: this.config.prefix,
		});
		handler.on("debug", (m) => console.log(`[C] ${m}`));
		return handler;
	}

	createInteractionHandler() {
		const handler = new InteractionHandler({
			client: this,
			directory: "./src/Interactions",
		});
		handler.on("debug", (m) => console.log(`[I] ${m}`));
		return handler;
	}

	createEventHandler() {
		const handler = new EventHandler({
			client: this,
			directory: "./src/Events",
		});
		handler.on("debug", (m) => console.log(`[E] ${m}`));
		return handler;
	}

	createComponentHandler() {
		const handler = new ComponentHandler({
			client: this,
			directory: "./src/Components",
		});
		handler.on("debug", (m) => console.log(`[MC] ${m}`));
		return handler;
	}
};
