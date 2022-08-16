const { Component } = require("@nortex/handler");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = class extends Component {
	constructor(...args) {
		super(...args, {
			customId: "message-new",
			queryingMode: "startsWith",
		});
	}

	async run(interaction) {
		/*
		 * FREELANCER (from "Message" button on quote) >>> CLIENT (commission channel)
		 * */
		const commId = interaction.customId.split("-")[2];
		const comm = await this.client.db.Commission.findOne({ id: commId }).exec();
		if (!comm) return interaction.reply({ embeds: [this.client.embed.error(`This commission doesn't exist anymore.`)] });
		const ticketChannel = await this.client.channels.fetch(comm.channelId);
		if (!ticketChannel) return interaction.reply({ embeds: [this.client.embed.error(`This channel has been deleted.`)] });
		const freelancer = interaction.user;
		await interaction.reply({ embeds: [this.client.embed.info(`Please move to DMs.`)], ephemeral: true });
		if (!freelancer.dmChannel) await freelancer.createDM();
		const dm = await freelancer.dmChannel.send({
			embeds: [this.client.embed.info(`Type in the message you want to send to the customer:`)],
		});
		const collector = freelancer.dmChannel.createMessageCollector({ filter: (m) => m.author.id === freelancer.id, time: 60000 });

		collector.on("collect", async (m) => {
			m.delete().catch(() => {
				/*ignore*/
			});
			if (m.content.length > 1000) return freelancer.dmChannel.send({ embeds: [this.client.embed.error(`Message is too long.`)] });
			const row = new MessageActionRow().addComponents(
				new MessageButton({ label: "Click to Reply", emoji: "📨", style: "PRIMARY", customId: `message-reply-${comm.id}-${freelancer.id}` })
			);
			await ticketChannel.send({
				embeds: [this.client.embed.info(`\`\`\`\n${m.content}\`\`\``).setTitle(`Message from freelancer (${freelancer.tag}):`)],
				components: [row],
			});
			await dm.edit({ embeds: [this.client.embed.success(`Message sent.`)] });
			await interaction.editReply({ embeds: [this.client.embed.success(`Message sent.`)] });
			collector.stop();
		});

		collector.on("end", (_, reason) => {
			if (reason === "time") {
				dm.delete().catch(() => {});
			}
		});
	}
};
