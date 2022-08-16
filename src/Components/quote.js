const { Component } = require("@nortex/handler");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "quote",
			queryingMode: "startsWith",
		});
	}

	async run(interaction) {
		const freelancer = interaction.user;
		await interaction.reply({ embeds: [this.client.embed.info(`Please move to DMs.`)], ephemeral: true });
		if (!freelancer.dmChannel) await freelancer.createDM();
		await freelancer.dmChannel.send({ embeds: [this.client.embed.info(`Type in how much you want to quote. (USD, don't include the \`$\` sign)`)] }).catch(async () => {
			await interaction.editReply({ embeds: [this.client.embed.error(`We can't Direct Massage to you. Please unlock your DMs.`)] });
		});
		const messages = await freelancer.dmChannel
			.awaitMessages({
				filter: (m) => m.author.id === freelancer.id,
				max: 1,
				time: 60 * 1000,
			})
			.catch(() => {});
		const message = messages.first();
		if (!message || !message.content) return freelancer.dmChannel.send({ embeds: [this.client.embed.error(`Quote submission timed out.`)] });
		const quote = parseInt(message.content);
		if (isNaN(quote)) return freelancer.dmChannel.send({ embeds: [this.client.embed.error(`Invalid quote.\nPlease specify a valid integer with __no__ \`$\` sign.`)] });
		const commId = interaction.customId.split("-")[1];
		const comm = await this.client.db.Commission.findOne({ id: commId });
		if (!comm) return freelancer.dmChannel.send({ embeds: [this.client.embed.error("This commission doesn't exist anymore.")] });
		if (comm.freelancerId) return freelancer.dmChannel.send({ embeds: [this.client.embed.error("This commission has already been claimed.")] });
		const commChannel = await interaction.guild.channels.fetch(comm.channelId).catch(() => {});
		if (!commChannel) return;
		const profile = await this.client.db.getProfile(freelancer.id);
		const embed = this.client.embed
			.success(`${freelancer} has quoted **$${quote}**\n\n**Portfolio:** ${profile.portfolio}\n**Timezone:** ${profile.timezone}\n**Bio:** ${profile.bio}`)
			.setTitle("Incoming Quote")
			.setThumbnail(freelancer.avatarURL());

		const quoteDoc = new this.client.db.Quote({
			commissionId: comm.id,
			freelancerId: freelancer.id,
			price: parseInt(quote),
		});

		const row = new MessageActionRow().addComponents(
			new MessageButton({ customId: "respondquote-accept-" + quoteDoc.id, label: `Accept $${quote}`, style: "SUCCESS" }),
			new MessageButton({ customId: "respondquote-decline-" + quoteDoc.id, label: "Decline", style: "DANGER" }),
			new MessageButton({ customId: "respondquote-counter-" + quoteDoc.id, label: "Counteroffer", style: "SECONDARY" })
		);

		// Reply to the DM message
		await freelancer.dmChannel.send({ embeds: [this.client.embed.success(`You successfully quoted $${quote} for this commission.`)] });
		// Edit the "Please move to DMs"
		await interaction.editReply({ embeds: [this.client.embed.success(`You quoted $${quote} for this commission.`)] });

		// Send the quote to the commission channel
		const quoteMsg = await commChannel.send({ embeds: [embed], components: [row] });
		quoteDoc.incomingQuoteMsg = quoteMsg.id;
		quoteDoc.save();
	}
};
