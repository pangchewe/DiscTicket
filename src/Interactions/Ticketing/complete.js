const { InteractionCommand } = require("@nortex/handler");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "complete",
			category: "Ticketing",
			description: "Mark this commission as complete.",
			options: [
				{
					name: "message",
					type: "STRING",
					required: false,
					description: "An optional note to include with the completion.",
				},
			],
		});
	}

	async run(interaction, { settings }) {
		// if (settings.freelancerRole && !interaction.member.roles.cache.has(settings.freelancerRole))
		// return interaction.reply({ embeds: [this.client.embed.error("You must be a freelancer to complete commissions.")], ephemeral: true });
		const comm = await this.client.db.Commission.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id, closed: false });
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error("This is not a ticket channel or this is an archived ticket.")], ephemeral: true });
		if (!comm.freelancerId)
			return interaction.reply({
				embeds: [this.client.embed.error("This commission is not claimed by anybody. Quote it and get accepted by the client to do tFhat.")],
				ephemeral: true,
			});
		if (!comm.invoiceId)
			return interaction.reply({
				embeds: [this.client.embed.error("No invoice has been made for this order. Please cancel the order or create an invoice.")],
				ephemeral: true,
			});
		const linkedInvoice = await this.client.db.Invoice.findOne({ id: comm.invoiceId });
		if (!linkedInvoice.paid)
			return interaction.reply({
				embeds: [this.client.embed.error("The invoice has to been paid for before you can complete this order.")],
				ephemeral: true,
			});
		if (comm.complete) return interaction.reply({ embeds: [this.client.embed.error("This commission ticket has already been marked as completed.")], ephemeral: true });
		const message = interaction.options.getString("message");
		const row = new MessageActionRow().addComponents(
			new MessageButton({ label: "Accept", customId: `complete-accept-${comm.id}`, style: "SUCCESS" }),
			new MessageButton({ label: "Deny", customId: `complete-deny-${comm.id}`, style: "DANGER" })
		);
		comm.complete = true;
		await comm.save();
		interaction.reply({
			embeds: [
				this.client.embed
					.info(`**Use the buttons below to either accept the delivery or deny.**${message ? `\n\n**Message from freelancer:**\n${message}` : ""}`)
					.setTitle("Commission Marked As Complete"),
			],
			components: [row],
		});
	}
};
