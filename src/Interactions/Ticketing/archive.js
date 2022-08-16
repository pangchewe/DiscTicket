const { InteractionCommand } = require("@nortex/handler");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "archive",
			category: "Ticketing",
			description: "Archive a ticket.",
		});
	}

	async run(interaction) {
		const comm = await this.client.db.Commission.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id, closed: false });
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error("This is not a ticket channel or this is an archived ticket.")], ephemeral: true });
		const channel = await this.client.channels.fetch(comm.channelId);
		this.client.ticketManager.close(channel, interaction.user).then(() => {
			interaction.reply({
				embeds: [this.client.embed.success(`Ticket archived.`)],
			});
		});
	}
};
