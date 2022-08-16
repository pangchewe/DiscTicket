const { Component } = require("@nortex/handler");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "archive",
			queryingMode: "startsWith",
		});
	}

	async run(interaction) {
		if (!interaction.member.permissions.has("MANAGE_GUILD"))
			return interaction.reply({ embeds: [this.client.embed.error(`You don't have permission to do that.\nIf you want to cancel, ask support.`)] /*todo: add /cancel*/ });
		const type = interaction.customId.split("-")[1];
		const commId = interaction.customId.split("-")[2];
		const collection = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
		const comm = await this.client.db[collection].findOne({ guildId: interaction.guild.id, id: commId });
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error(`This commission doesn't exist anymore.`)] });
		const channel = await this.client.channels.fetch(comm.channelId);
		if (!channel) return interaction.reply({ embeds: [this.client.embed.error(`This channel has been deleted.`)] });

		this.client.ticketManager
			.close(channel, interaction.user, collection)
			.then(async () => {
				await interaction.reply({ embeds: [this.client.embed.success(`Ticket archived.`)] });
			})
			.catch(async (err) => {
				await interaction.reply({ embeds: [this.client.embed.error(`${err.message}`)] });
			});
	}
};
