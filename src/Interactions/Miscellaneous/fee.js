const { InteractionCommand } = require("@nortex/handler");

module.exports = class extends InteractionCommand {
	constructor(handler, filename) {
		super(handler, filename, {
			name: "fee",
			category: "Miscellaneous",
			description: "Calculate the service cut for a price.",
			options: [
				{
					type: "INTEGER",
					name: "price",
					description: "The amount.",
					required: true,
				},
			],
		});
	}

	async run(interaction) {
		const price = interaction.options.getInteger("price");
		const cut = this.client.config.serviceCut;
		interaction.reply({
			embeds: [
				this.client.embed.info(
					`You will be paid **$${price * (1 - cut)}** (*${cut * 100}%*) if you quote **$${price}**.\nTo receive **$${price}**, charge **$${price + price * cut}**.`
				),
			],
			ephemeral: true,
		});
	}
};
