const { Component } = require("@nortex/handler");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "panel-new-application",
		});
	}

	async run(interaction) {
		await interaction.deferReply({ ephemeral: true });
		this.client.ticketManager
			.createApplication(interaction.guild, interaction.user)
			.then((ticketMessage) => {
				interaction.editReply({
					embeds: [
						this.client.embed.success(
							`${interaction.user}, created an application ticket for you.\n[[Jump to]](https://discord.com/channels/${interaction.guild.id}/${ticketMessage.channel.id}/${ticketMessage.id})`
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
