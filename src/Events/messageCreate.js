const { Event } = require("@nortex/handler");

module.exports = class extends Event {
	constructor(...args) {
		super(...args, {
			name: "messageCreate",
		});
	}

	async run(msg) {
		const settings = await this.client.db.getGuildSettings(msg.guild?.id);
		this.client.commandHandler.runCommand(msg, { settings }).catch((err) => {
			if (err.code === "COMMAND_NOT_FOUND") return;
			msg.reply({ embeds: [this.client.embed.error(`**Error:** ${err.message}`)] });
		});
	}
};
