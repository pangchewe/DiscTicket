const { Component } = require("@nortex/handler");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "respondquote",
			queryingMode: "startsWith",
		});
	}

	async run(interaction, { settings }) {
		// First query the quote from the ID provided in customId
		const quoteId = interaction.customId.split("-")[2];

		const quoteDoc = await this.client.db.Quote.findOne({ id: quoteId }).exec();
		if (!quoteDoc) return interaction.reply({ embeds: [this.client.embed.error(`This quote was invalidated. Please create a new one.`)], ephemeral: true });

		// Then query the commission from the ID in quote doc
		const comm = await this.client.db.Commission.findOne({ id: quoteDoc.commissionId }).exec();
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error("This commission doesn't exist anymore.")], ephemeral: true });
		if (comm.freelancerId)
			return interaction.reply({
				embeds: [this.client.embed.error("This commission has got another quote that was accepted already. If you want to switch, contact support.")],
				ephemeral: true,
			});
		if (comm.authorId !== interaction.user.id) return interaction.reply({ embeds: [this.client.embed.error("You can't respond to this quote.")], ephemeral: true });
		const commChannel = await interaction.guild.channels.fetch(comm.channelId).catch(() => {});
		if (!commChannel) return;

		// Query the freelancer user
		const freelancer = this.client.users.cache.get(quoteDoc.freelancerId);
		if (!freelancer) return interaction.reply({ embeds: [this.client.embed.error("This freelancer doesn't exist anymore.")], ephemeral: true });

		// Create DM channel if it doesn't exist
		if (!freelancer.dmChannel) await freelancer.createDM();

		const type = interaction.customId.split("-")[1];

		await commChannel.messages.fetch();
		const incomingQuoteMsg = commChannel.messages.cache.get(quoteDoc.incomingQuoteMsg);

		if (type === "accept") {
			await commChannel.permissionOverwrites.edit(freelancer.id, {
				SEND_MESSAGES: true,
				VIEW_CHANNEL: true,
			});
			await freelancer.dmChannel.send({
				embeds: [this.client.embed.success(`${interaction.user} has __accepted__ your quote of $${quoteDoc.price}.\nThe commission is now assigned to you.`)],
			});
			freelancer.dmChannel.send({ embeds: [this.client.embed.success(`Quote of $${quoteDoc.price} has been **accepted.**`)], components: [] });
			interaction.deferUpdate();
			comm.freelancerId = freelancer.id;
			await comm.save();
			if (incomingQuoteMsg) incomingQuoteMsg.edit({ embeds: [this.client.embed.success(`Quote accepted.`)], components: [] });

			// Log the claimage
			if (!settings.commissionLog) return;
			const commissionLog = await interaction.guild.channels.fetch(settings.commissionLog).catch(() => {});
			if (!commissionLog) return;
			const commissionMessage = await commissionLog.messages.fetch(comm.logMsg);
			if (commissionMessage) await commissionMessage.delete();
			commissionLog.send({
				embeds: [
					this.client.embed.info(
						`[Commission #${comm.id}](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${comm.logMsg}) has been claimed by ${freelancer}.`
					),
				],
			});
		} else if (type === "decline") {
			interaction.reply({ embeds: [this.client.embed.info(`Please provide a reason for declining this offer.`)], ephemeral: true });
			const reasons = await interaction.channel
				.awaitMessages({
					filter: (m) => m.author.id === interaction.user.id,
					max: 1,
					time: 60 * 1000,
				})
				.catch(() => {});
			if (!reasons?.size) return interaction.editReply({ embeds: [this.client.embed.error("Declining the quote timed out.")], ephemeral: true });
			reasons.first().delete();
			await freelancer.dmChannel.send({
				embeds: [
					this.client.embed.success(`${interaction.user} has __declined__ your quote of $${quoteDoc.price}.\n**Reason:**\n\`\`\`\n${reasons.first().content}\`\`\``),
				],
			});
			await interaction.editReply({ embeds: [this.client.embed.success(`Successfully sent a decline information to the freelancer.`)], components: [] });
			if (incomingQuoteMsg) incomingQuoteMsg.edit({ embeds: [this.client.embed.info(`Quote declined.`)], components: [] });
		} else if (type === "counter") {
			await interaction.reply({ embeds: [this.client.embed.info(`Please type in a price. (USD, don't include the \`$\` sign)`)], ephemeral: true });
			const counter = await interaction.channel
				.awaitMessages({
					filter: (m) => m.author.id === interaction.user.id,
					max: 1,
					time: 60 * 1000,
				})
				.catch(() => {});
			if (!counter?.size) return;
			counter.first().delete();
			await freelancer.dmChannel.send({
				embeds: [
					this.client.embed.success(
						`${interaction.user} has __counteroffered__ your quote of $${quoteDoc.price}.\n**Suggested price:** $${
							counter.first().content
						}\nClick the "Quote" button again if you want to accept.`
					),
				],
			});
			await interaction.editReply({ embeds: [this.client.embed.success(`Successfully sent a counteroffer to the freelancer.`)], components: [] });
			if (incomingQuoteMsg) incomingQuoteMsg.edit({ embeds: [this.client.embed.info(`Quote counteroffered.`)], components: [] });
		}
	}
};
