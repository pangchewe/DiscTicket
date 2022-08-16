const { Command } = require("@nortex/handler");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "logchannel",
			category: "Configuration",
			description: "Set the channel for ticket logs.",
			usage: '<new value or "none">',
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message, args, { settings }) {
		let key = "logChannel";
		const value = args.join(" ");
		if (!value) return message.channel.send({ embeds: [this.client.embed.error(`Correct usage: \`${this.usage}\`.`)] });
		if (value.toLowerCase() === "none") {
			delete settings[key];
			return settings
				.save()
				.then(() => message.channel.send({ embeds: [this.client.embed.success(`Removed ticket logging.`)] }))
				.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
		}
		const channel =
			message.mentions.channels.first() ||
			message.guild.channels.cache.find((r) => r.type === "GUILD_TEXT" && r.name.toLowerCase() === value.toLowerCase()) ||
			message.guild.channels.cache.find((r) => r.type === "GUILD_TEXT" && r.id === value);
		if (!channel) return message.channel.send({ embeds: [this.client.embed.error(`This is not a valid channel mention/name/id.`)] });
		settings[key] = channel.id;
		settings
			.save()
			.then(() => message.channel.send({ embeds: [this.client.embed.success(`Set logging channel to \`${channel.name}\`.`)] }))
			.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
	}
};
