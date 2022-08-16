const { InteractionCommand } = require("@nortex/handler");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "invoice",
			category: "Ticketing",
			description: "Create a new invoice for a certain amount.",
			options: [{ name: "amount", type: "INTEGER", required: true, description: "The amount to be paid." }],
		});
	}

	async run(interaction) {
		const comm = await this.client.db.Commission.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id, closed: false });
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error("This is not a ticket channel or this is an archived ticket.")], ephemeral: true });
		if (interaction.user.id !== comm.managerId) return interaction.reply({ embeds: [this.client.embed.error(`Only the ticket manager can create an invoice.`)] });
		if (comm.invoiceId) return interaction.reply({ embeds: [this.client.embed.error("The invoice has already been created for this order.")], ephemeral: true });
		if (comm.complete) return interaction.reply({ embeds: [this.client.embed.error("This commission ticket has already been marked as completed.")], ephemeral: true });
		const pretax = interaction.options.getInteger("amount");
		if (pretax <= 0) return interaction.reply({ embeds: [this.client.embed.error("The amount must be greater than 0.")], ephemeral: true });
		if (pretax > 10000) return interaction.reply({ embeds: [this.client.embed.error("The amount must be less than $10,000.")], ephemeral: true });
		const fee = this.client.config.handlingFee;
		const posttax = pretax + pretax * fee;
		const invoice = await this.client.paypal.createOrder({
			ticket: comm,
			freelancerId: interaction.user.id,
			pretax: pretax,
			posttax: posttax,
			interaction,
		});
		comm.invoiceId = invoice.id;
		await comm.save();
		const row = new MessageActionRow().addComponents(new MessageButton({ label: "Pay", style: "LINK", url: invoice.payUrl }));
		interaction.reply({
			embeds: [
				this.client.embed
					.info(`Invoice for ${pretax} USD, active for the next 20 minutes.`)
					.setTitle(`Invoice #${invoice.id}`)
					.addField(`Amount`, `$${pretax.toFixed(2)}`, true)
					.addField(`Handling Fee (10%)`, `$${(pretax * fee).toFixed(2)}`, true)
					.addField(`Total`, `$${posttax.toFixed(2)}`, true)
					.addField(`Status`, `🕐 Pending`)
					.setTimestamp(),
			],
			components: [row],
		});
	}
};
