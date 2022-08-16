const { Command } = require("@nortex/handler");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "panel",
			category: "Configuration",
			description: "Create ticket panel",
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message) {
		const row = new MessageActionRow().addComponents(
			new MessageButton({ label: "Commission", customId: "panel-new-commission", style: "SECONDARY", emoji: "<:commission:943811867338502204>" }),
			new MessageButton({ label: "Apply", customId: "panel-new-application", style: "SECONDARY", emoji: "<:apply:943811882702241802>" }),
			new MessageButton({ label: "Support", customId: "panel-new-support", style: "SECONDARY", emoji: "<:support:943811853417607208>" })
		);

		message.channel.send({
			embeds: [
				this.client.embed
					.info()
					.setTimestamp(null)
					.setFooter(null)
					.setColor("#f89903")
					.setTitle(`Create a ticket`)
					.setImage(`https://media.discordapp.net/attachments/923189263569403925/943810909132951582/bannerr3.png`),
			],
			components: [row],
		});
	}
};
