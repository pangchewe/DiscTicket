const { Command } = require("@nortex/handler");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "viewpaypal",
			category: "Administration",
			description: "View someone's PayPal email address.",
			usage: "<user to lookup>",
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(message, args, { settings }) {
		const user = message.mentions.users.first() || message.guild.members.cache.find((m) => m.user.username === args.join(" ")) || message.guild.members.cache.get(args[0]);
		if (!user) return message.channel.send({ embeds: [this.client.embed.error(`Usage: ` + this.usage)] });
		const profile = await this.client.db.getProfile(user.id);
		if (!profile.paypalEmail) return message.channel.send({ embeds: [this.client.embed.error(`${user.username} has not set a PayPal email address.`)] });
		return message.channel.send({ embeds: [this.client.embed.success(`${user.username}'s PayPal email address is \`${profile.paypalEmail}\`.`)] });
	}
};
