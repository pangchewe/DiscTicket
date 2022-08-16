const { Component } = require("@nortex/handler");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "complete-review",
			queryingMode: "startsWith",
		});
	}

	async run(interaction) {
		const ticketId = interaction.customId.split("-")[2];
		const comm = await this.client.db.Commission.findOne({ guildId: interaction.guild.id, id: ticketId }).exec();
		if (!comm) return;
		if (interaction.user.id !== comm.authorId)
			return interaction.reply({ embeds: [this.client.embed.error(`Only the author of this ticket can accept, deny or review the commission.`)] });
		if (!comm.deliveryAccepted)
			return interaction.reply({ embeds: [this.client.embed.error(`Before reviewing, please complete the order by accepting the delivery.`)], ephemeral: true });

		const existingReview = await this.client.db.Review.findOne({ commissionId: comm.id });
		if (existingReview) return interaction.reply({ embeds: [this.client.embed.error(`This delivery has already been reviewed.`)], ephemeral: true });

		interaction.reply({ embeds: [this.client.embed.error(`Type in your review of <@${comm.freelancerId}> in chat:`)], ephemeral: true });
		const reviewResponse = await interaction.channel
			.awaitMessages({
				filter: (msg) => msg.author.id === interaction.user.id,
				max: 1,
				time: 60 * 1000,
			})
			.catch(() => {});
		if (!reviewResponse || !reviewResponse.size) return interaction.editReply({ embeds: [this.client.embed.error(`Review timed out.`)] });
		const stars = parseInt(interaction.customId.split("-")[3]);
		const review = await this.client.db.Review.create({
			commissionId: comm.id,
			freelancerId: comm.freelancerId,
			userId: comm.authorId,
			rating: stars,
			message: reviewResponse.first().content.length > 500 ? reviewResponse.first().content.slice(0, 497) + "..." : reviewResponse.first().content,
		});

		this.client.ticketManager.sendReview(interaction.guild, review.freelancerId, review.userId, review.rating, review.message, review.id);

		interaction.editReply({ embeds: [this.client.embed.success(`Thank you for your feedback.\nYou have rated the freelancer ${stars} out of 5 stars.`)] });
	}
};
