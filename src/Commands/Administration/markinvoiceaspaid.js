const { Command } = require("@nortex/handler");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "markinvoiceaspaid",
			category: "Administration",
			description: "Mark an invoice as paid",
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message) {
		const comm = await this.client.db.Commission.findOne({ guildId: message.guild.id, channelId: message.channel.id, closed: false });
		if (!comm) return message.reply({ embeds: [this.client.embed.error("This is not a ticket channel or this is an archived ticket.")], ephemeral: true });
		if (comm.invoiceId) {
			const invoice = await this.client.db.Invoice.findOne({ id: comm.invoiceId });
			if (invoice) return message.reply({ embeds: [this.client.embed.error("The invoice has already been created.")], ephemeral: true });
		}
		const newInvoice = await new this.client.db.Invoice({
			userId: comm.authorId,
			ticketId: comm.id,
			amount: 0,
			paid: true,
		}).save();

		comm.invoiceId = newInvoice.id;
		await comm.save();

		message.channel.send({ embeds: [this.client.embed.success(`Marked invoice as paid.`)] });
	}
};
