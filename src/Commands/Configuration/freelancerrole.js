const { Command } = require("@nortex/handler");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "freelancerrole",
			category: "Configuration",
			description: "Set the freelancer role",
			usage: '<new value or "none">',
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message, args, { settings }) {
		let key = "freelancerRole";
		const value = args.join(" ");
		if (!value) return message.channel.send({ embeds: [this.client.embed.error(`Correct usage: \`${this.usage}\`.`)] });
		if (value.toLowerCase() === "none") {
			delete settings[key];
			return settings
				.save()
				.then(() => message.channel.send({ embeds: [this.client.embed.success(`Removed freelancer role.`)] }))
				.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
		}
		const role =
			message.mentions.roles.first() ||
			message.guild.roles.cache.find((r) => r.name.toLowerCase() === value.toLowerCase()) ||
			message.guild.roles.cache.find((r) => r.id === value);
		if (!role) return message.channel.send({ embeds: [this.client.embed.error(`This is not a valid channel mention/name/id.`)] });
		settings[key] = role.id;
		settings
			.save()
			.then(() => message.channel.send({ embeds: [this.client.embed.success(`Set freelancer role to \`${role.name}\`.`)] }))
			.catch((err) => message.channel.send({ embeds: [this.client.embed.error(`Failed to save settings: \`${err.message}\`.`)] }));
	}
};
