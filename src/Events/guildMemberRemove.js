const { Event } = require("@nortex/handler");

module.exports = class extends Event {
	constructor(...args) {
		super(...args, {
			name: "guildMemberRemove",
		});
	}

	async run(member) {
		const commissions = await this.client.db.Commission.find({
			guild: member.guild.id,
			authorId: member.id,
		});
		for (const commission of commissions) {
			const channel = this.client.channels.cache.get(commission.channelId);
			this.client.ticketManager.close(channel, member.user);
		}
		const applications = await this.client.db.Application.find({
			guild: member.guild.id,
			authorId: member.id,
		});
		for (const application of applications) {
			const channel = this.client.channels.cache.get(application.channelId);
			this.client.ticketManager.close(channel, member.user);
		}
		const supports = await this.client.db.Support.find({
			guild: member.guild.id,
			authorId: member.id,
		});
		for (const support of supports) {
			const channel = this.client.channels.cache.get(support.channelId);
			this.client.ticketManager.close(channel, member.user);
		}
	}
};
