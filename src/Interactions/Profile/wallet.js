const { InteractionCommand } = require("@nortex/handler");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "wallet",
			category: "Profile",
			description: "View your balance.",
		});
	}

	async run(interaction, { settings }) {
		if (settings.freelancerRole && !interaction.member.roles.cache.has(settings.freelancerRole))
			return interaction.reply({ embeds: [this.client.embed.error("You must be a freelancer to do this.")], ephemeral: true });
		const profile = await this.client.db.getProfile(interaction.user.id);
		interaction.reply({
			embeds: [this.client.embed.info(`You currently have $${profile.balance.toFixed(2)} available.`)],
			ephemeral: true,
		});
	}
};
