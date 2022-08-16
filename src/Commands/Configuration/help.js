const { Command } = require("@nortex/handler");
const Fuse = require("fuse.js");

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			name: "help",
			description: "Displays the help menu.",
			category: "Informational",
			usage: "[command]",
			aliases: ["h"],
			userCooldown: 3,
		});
	}

	async run(message, args) {
		const commandsArray = this.handler.commands;
		if (args[0]) {
			const searcher = new Fuse(commandsArray, {
				keys: ["name", "aliases"],
			});
			const result = searcher.search(args[0]);
			const firstResult = result[0];
			if (!firstResult) return message.channel.send({ embeds: [this.client.embed.error(`No command found: \`${args[0]}\`.`)] });
			const command = firstResult.item;
			if (command.category === "Owner") return message.channel.send({ embeds: [this.client.embed.error(`You do not have permission to view help of this command.`)] });
			const stringifiedAliases = command.aliases.map((a) => `\`${a}\``).join(", ");
			const fields = [
				`${command.description || "No description."}`,
				`**Category:** ${command.category}`,
				`**Aliases:** ${command.aliases?.length ? `${stringifiedAliases}` : "No aliases"}`,
			];
			if (command.usage) fields.push(`**Usage:** \`${command.usage}\``);
			if (command.allowDm && command.onlyDm) fields.push(`**Only works in DMs.**`);
			if (command.userCooldown) fields.push(`**Cooldown:** \`${command.userCooldown} seconds\``);
			if (command.guildCooldown) fields.push(`**Guild-wide Cooldown:** \`${command.userCooldown} seconds\``);
			if (command.userPermissions.length)
				fields.push(
					`**Required Permissions:** \`${command.userPermissions
						.map((v) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase())
						.join(", ")
						.replace(/_/g, " ")}\``
				);

			const embed = this.client.embed.info(fields.join("\n")).setTitle(`Displaying help for: ${command.name}`);
			if (command.name !== args[0]) embed.setFooter({ text: `Your search query: "${args[0]}" did not match anything, but was close to: "${command.name}", so I showed it.` });
			message.channel.send({
				embeds: [embed],
			});
		} else {
			let categories = [...new Set(commandsArray.map((c) => c.category))];
			if (!this.client.config.owners.includes(message.author.id)) categories = categories.filter((c) => c !== "Owner");
			const embed = this.client.embed.info().setTitle("Command list");
			categories.forEach((category) => {
				const commandsInCategory = commandsArray.filter((v) => v.category === category);
				embed.addField(`${category}`, `${commandsInCategory.map((v) => `\`${v.name}\``).join(", ")}`);
			});
			embed.setFooter({ text: `Use ${this.client.commandHandler.prefix[0]}help [search] to get more info about a specific command.` });
			embed.setThumbnail(this.client.user.displayAvatarURL({ size: 128, dynamic: true }));
			message.channel.send({
				embeds: [embed],
			});
		}
	}
};
