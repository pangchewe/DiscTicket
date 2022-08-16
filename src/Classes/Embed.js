const { MessageEmbed } = require("discord.js");

module.exports = class Database {
	constructor(client) {
		this.client = client;
	}

	baseEmbed(content) {
		let embed = new MessageEmbed().setFooter({ text: "Light Services" }).setTimestamp();
		if (content) embed.setDescription(content).setColor("#dbb33a");
		return embed;
	}

	info(content) {
		return this.baseEmbed(content).setColor("#dbb33a");
	}

	error(content) {
		return this.baseEmbed(content).setColor("#c44242");
	}

	success(content) {
		return this.baseEmbed(content).setColor("#42c460");
	}
};
