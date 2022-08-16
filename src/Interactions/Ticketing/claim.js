const { InteractionCommand } = require("@nortex/handler");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "claim",
			category: "Ticketing",
			description: "Claim this commission.",
		});
	}

	async run(interaction) {
		if (!interaction.member.roles.cache.has(this.client.config.managerRoleId))
			return interaction.reply({ embeds: [this.client.embed.error("You must be a manager to do this.")], ephemeral: true });
		const comm = await this.client.db.Commission.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id, closed: false }).exec();
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error("This is not a ticket channel or this is an archived ticket.")], ephemeral: true });
		if (comm.managerId) return interaction.reply({ embeds: [this.client.embed.error(`This ticket has already been claimed by <@${comm.managerId}>.`)], ephemeral: true });
		if (comm.complete) return interaction.reply({ embeds: [this.client.embed.error("This commission ticket has already been marked as completed.")], ephemeral: true });
		comm.managerId = interaction.user.id;
		await comm.save();
		interaction.reply({
			embeds: [this.client.embed.success(`**${interaction.user}** has claimed this commission.`).setTitle("Commission Claimed")],
		});
	}
};
