const { InteractionCommand } = require("@nortex/handler");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "new",
			category: "Ticketing",
			description: "Open a new commission ticket.",
		});
	}

	async run(interaction) {
		await interaction.deferReply({ ephemeral: true });
		this.client.ticketManager
			.createCommission(interaction.guild, interaction.user)
			.then((ticketMessage) => {
				interaction.editReply({
					embeds: [
						this.client.embed.success(
							`${interaction.user}, created a commission ticket for you.\n[[Jump to]](https://discord.com/channels/${interaction.guild.id}/${ticketMessage.channel.id}/${ticketMessage.id})`
						),
					],
				});
			})
			.catch((err) => {
				interaction.editReply({
					embeds: [this.client.embed.error(`Couldn't make a ticket, because:\n${err.message}`)],
				});
			});
	}
};
