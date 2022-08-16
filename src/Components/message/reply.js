const { Component } = require("@nortex/handler");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "message-reply",
			queryingMode: "startsWith",
		});
	}

	async run(interaction) {
		/*
		 * CLIENT (from "Reply" button on OP) >>> FREELANCER (dm)
		 * */
		const commId = interaction.customId.split("-")[2];
		const comm = await this.client.db.Commission.findOne({ id: commId }).exec();
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error(`This commission doesn't exist anymore.`)] });
		const ticketChannel = await this.client.channels.fetch(comm.channelId);
		if (!ticketChannel) return interaction.reply({ embeds: [this.client.embed.error(`This channel has been deleted.`)] });
		const freelancerId = interaction.customId.split("-")[3];
		const freelancer = await this.client.users.fetch(freelancerId);
		if (!freelancer) return interaction.reply({ embeds: [this.client.embed.error(`This freelancer is invalid (might've left).`)] });

		const client = interaction.user;

		if (!client.dmChannel) await client.createDM();

		await interaction.reply({ embeds: [this.client.embed.info(`Please type in what you want to reply:`)], ephemeral: true });

		// create a collector
		const collector = interaction.channel.createMessageCollector({ filter: (m) => m.author.id === client.id, time: 60000 });

		collector.on("collect", async (m) => {
			await m.delete().catch(() => {
				/*ignore*/
			});
			if (m.content.length > 1000) return interaction.reply({ embeds: [this.client.embed.error(`Message is too long.`)] });
			const row = new MessageActionRow().addComponents(new MessageButton({ customId: `message-new-${comm.id}`, label: "Message", style: "SECONDARY", emoji: "✉️" }));
			await freelancer.dmChannel.send({
				embeds: [this.client.embed.info(`\`\`\`\n${m.content}\`\`\``).setTitle(`Response from client (${client.tag}):`)],
				components: [row],
			});
			await interaction.editReply({ embeds: [this.client.embed.success(`Message sent.`)] });
			collector.stop();
		});

		collector.on("end", (_, reason) => {
			if (reason === "time") {
				interaction.editReply({ embeds: [this.client.embed.error(`Reply timed out.`)] }).catch(() => {});
			}
		});
	}
};
