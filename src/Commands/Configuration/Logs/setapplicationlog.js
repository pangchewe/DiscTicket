const { Command } = require("@nortex/handler");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "setapplicationlog",
			category: "Configuration",
			description: "Set the channel for logging applications.",
			usage: '<new value or "none">',
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message, args, { settings }) {
		const key = "applicationLog";
		const value = args.join(" ");
		if (!value) return message.channel.send({ embeds: [this.client.embed.error(`Correct usage: \`${this.usage}\`.`)] });
		if (value.toLowerCase() === "none") {
			delete settings[key];
			return settings
				.save()
				.then(() => message.channel.send({ embeds: [this.client.embed.success(`Removed application log.`)] }))
				.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
		}
		const category =
			message.mentions.channels.first() ||
			message.guild.channels.cache.find((r) => r.type === "GUILD_TEXT" && r.name.toLowerCase() === value.toLowerCase()) ||
			message.guild.channels.cache.find((r) => r.type === "GUILD_TEXT" && r.id === value);
		if (!category) return message.channel.send({ embeds: [this.client.embed.error(`This is not a valid channel name or id.`)] });
		settings[key] = category.id;
		settings
			.save()
			.then(() => message.channel.send({ embeds: [this.client.embed.success(`Set application log to \`${category.name}\`.`)] }))
			.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
	}
};
