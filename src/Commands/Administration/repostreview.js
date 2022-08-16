const { Command } = require("@nortex/handler");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "repostreview",
			category: "Administration",
			description: "Reposts a review.",
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message, [id], { settings }) {
		if (!id) return message.channel.send({ embeds: [this.client.embed.error("Please provide a commission ID.")] });
		const commission = await this.client.db.Commission.findOne({ $or: [{ id: id }, { channelId: id }] }).exec();
		if (!commission) return message.channel.send({ embeds: [this.client.embed.error("Could not find a commission with that ID.")] });
		const review = await this.client.db.Review.findOne({ commissionId: commission.id }).exec();
		if (!review) return message.reply({ embeds: [this.client.embed.error("There is no review made for this commission.")], ephemeral: true });
		const reviewChannel = await message.guild.channels.fetch(settings.reviewChannel).catch(() => {});
		if (!reviewChannel) return message.reply({ embeds: [this.client.embed.error("There is no review channel set.")], ephemeral: true });
		this.client.ticketManager.sendReview(message.guild, review.freelancerId, review.userId, review.rating, review.message, review.id);
	}
};
