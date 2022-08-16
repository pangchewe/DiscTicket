const { Command } = require("@nortex/handler");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "supportcategory",
			category: "Configuration",
			description: "Set the support ticket category.",
			usage: '<new value or "none">',
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message, args, { settings }) {
		let key = "supportCategory";
		const value = args.join(" ");
		if (!value) return message.channel.send({ embeds: [this.client.embed.error(`Correct usage: \`${this.usage}\`.`)] });
		if (value.toLowerCase() === "none") {
			delete settings[key];
			return settings
				.save()
				.then(() => message.channel.send({ embeds: [this.client.embed.success(`Removed support ticket category.`)] }))
				.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
		}
		const category =
			message.guild.channels.cache.find((r) => r.type === "GUILD_CATEGORY" && r.name.toLowerCase() === value.toLowerCase()) ||
			message.guild.channels.cache.find((r) => r.type === "GUILD_CATEGORY" && r.id === value);
		if (!category) return message.channel.send({ embeds: [this.client.embed.error(`This is not a valid channel name or id.`)] });
		settings[key] = category.id;
		settings
			.save()
			.then(() => message.channel.send({ embeds: [this.client.embed.success(`Set support ticket category to \`${category.name}\`.`)] }))
			.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
	}
};
