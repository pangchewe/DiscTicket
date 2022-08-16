const { InteractionCommand } = require("@nortex/handler");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "profile",
			category: "Profile",
			description: "View a profile",
			options: [
				{
					type: "USER",
					name: "freelancer",
					description: "The user to show the profile of.",
					required: true,
				},
			],
		});
	}

	async run(interaction, { settings }) {
		const user = interaction.options.getUser("freelancer");
		const member = interaction.guild.members.cache.get(user.id);
		if (!member.roles.cache.some((r) => r.id === settings.freelancerRole))
			return interaction.reply({ embeds: [this.client.embed.error(`${user.tag} is not a freelancer.`)], ephemeral: true });
		const profile = await this.client.db.getProfile(user.id);
		const completedTickets = await this.client.db.Commission.countDocuments({ freelancerId: user.id, complete: true });
		const reviews = await this.client.db.Review.find({ freelancerId: user.id });
		const averageReviews = reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length;
		const embed = this.client.embed.info(profile.bio).setTitle(`Profile of ${user.tag}`);
		if (profile.portfolio !== "No portfolio") embed.addField("Portfolio Link", profile.portfolio, true);
		if (profile.timezone !== "Unset") embed.addField("Timezone", `GMT ${profile.timezone}`, true);
		embed.addField("Completed Commissions", `${completedTickets}`, true);
		if (reviews.length) embed.addField("Reviews", `${"⭐".repeat(Math.round(averageReviews))} ${averageReviews.toFixed(1)}`, true);
		embed.setThumbnail(user.displayAvatarURL());
		interaction.reply({ embeds: [embed], ephemeral: true });
	}
};
