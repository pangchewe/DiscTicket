const { Event } = require("@nortex/handler");

module.exports = class extends Event {
	constructor(...args) {
		super(...args, {
			name: "ready",
			once: true,
		});
	}

	async run() {
		console.log("Ready as", this.client.user.tag);
		this.client.interactionHandler.updateInteractions();
	}
};
