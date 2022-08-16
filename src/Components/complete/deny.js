const { Component } = require("@nortex/handler");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "complete-deny",
			queryingMode: "startsWith",
		});
	}

	async run(interaction) {
		const ticketId = interaction.customId.split("-")[2];
		const comm = await this.client.db.Commission.findOne({ guildId: interaction.guild.id, id: ticketId });
		if (!comm) return;
		if (interaction.user.id !== comm.authorId)
			return interaction.reply({ embeds: [this.client.embed.error(`Only the author of this ticket can accept, deny or review the commission.`)] });

		if (comm.deliveryAccepted)
			return interaction.reply({
				embeds: [this.client.embed.error("You already accepted this delivery.\nPlease contact support to resolve any issues.")],
				ephemeral: true,
			});
		comm.complete = false;
		await comm.save();
		await interaction.reply({
			embeds: [
				this.client.embed
					.info(`Please provide a reason to why you're denying this delivery, and what should be changed in the order.`)
					.setFooter({ text: `You have 60 seconds.` }),
			],
		});
		const reasonResponse = await interaction.channel
			.awaitMessages({
				filter: (msg) => msg.author.id === interaction.user.id,
				max: 1,
				time: 60 * 1000,
			})
			.catch(() => {});
		if (!reasonResponse?.size) return;
		return interaction.editReply({
			embeds: [this.client.embed.error(`**Reason for denial:** ${reasonResponse.first().content}`).setTitle(`The delivery has been denied.`)],
		});
	}
};
