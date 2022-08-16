const { Component } = require("@nortex/handler");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "complete-accept",
			queryingMode: "startsWith",
		});
	}

	async run(interaction) {
		const ticketId = interaction.customId.split("-")[2];
		const comm = await this.client.db.Commission.findOne({ guildId: interaction.guild.id, id: ticketId });
		if (!comm) return;
		if (interaction.user.id !== comm.authorId)
			return interaction.reply({ embeds: [this.client.embed.error(`Only the author of this ticket can accept, deny or review the commission.`)] });
		if (comm.deliveryAccepted) return interaction.reply({ embeds: [this.client.embed.error(`This ticket has been marked as complete already.`)], ephemeral: true });
		const stars = new MessageActionRow().addComponents(
			new MessageButton({ label: "⭐", customId: `complete-review-${comm.id}-1`, style: "SECONDARY" }),
			new MessageButton({ label: "⭐⭐", customId: `complete-review-${comm.id}-2`, style: "SECONDARY" }),
			new MessageButton({ label: "⭐⭐⭐", customId: `complete-review-${comm.id}-3`, style: "SECONDARY" }),
			new MessageButton({ label: "⭐⭐⭐⭐", customId: `complete-review-${comm.id}-4`, style: "SECONDARY" }),
			new MessageButton({ label: "⭐⭐⭐⭐⭐", customId: `complete-review-${comm.id}-5`, style: "SECONDARY" })
		);
		comm.deliveryAccepted = true;
		await comm.save();
		const invoice = await this.client.db.Invoice.findOne({ id: comm.invoiceId });
		const profile = await this.client.db.getProfile(comm.freelancerId);
		profile.balance += invoice.amount * (1 - this.client.config.serviceCut);
		await profile.save();
		interaction.reply({
			embeds: [
				this.client.embed.success(`The order has been finalized. You can leave a review for the freelancer below.`).setTitle("Delivery has been accepted by the customer."),
			],
			components: [stars],
		});
	}
};
