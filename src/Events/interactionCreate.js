const { Event } = require("@nortex/handler");

module.exports = class extends Event {
	constructor(...args) {
		super(...args, {
			name: "interactionCreate",
		});
	}

	async run(interaction) {
		const settings = await this.client.db.getGuildSettings(interaction.guild?.id);
		if (interaction.isButton() || interaction.isSelectMenu()) {
			this.client.componentHandler.runComponent(interaction, { settings });
		} else {
			this.client.interactionHandler.runInteraction(interaction, { settings }).catch((err) => {
				interaction.reply({ embeds: [this.client.embed.error(`**Error:** ${err.message}`)] });
			});
		}
	}
};
