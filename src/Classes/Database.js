const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

module.exports = class Database {
	base = { createdAt: { type: Number, default: Date.now }, id: { type: String, default: () => nanoid() } };

	GUILD_SCHEMA = mongoose.Schema({
		...this.base,
		// Log channels
		logChannel: { type: String }, // General purpose log channel
		commissionLog: { type: String },
		applicationLog: { type: String },
		reviewChannel: { type: String },
		// Roles
		freelancerRole: { type: String },
		// Categories
		commissionCategory: { type: String },
		applicationCategory: { type: String },
		supportCategory: { type: String },
		closedCategory: { type: String },
	});

	COMMISSION_SCHEMA = mongoose.Schema({
		...this.base,
		serial: { type: Number, unique: true, required: true },
		guildId: { type: String, required: true },
		channelId: { type: String, required: true, unique: true },
		authorId: { type: String, required: true },
		invoiceId: { type: String },
		managerId: { type: String },
		freelancerId: { type: String },
		pending: { type: Boolean, default: true, required: true },
		closed: { type: Boolean, default: false, required: true },
		complete: { type: Boolean, default: false, required: true },
		deliveryAccepted: { type: Boolean, default: false, required: true },
		logMsg: { type: String },
	});

	APPLICATION_SCHEMA = mongoose.Schema({
		...this.base,
		serial: { type: Number, unique: true, required: true },
		guildId: { type: String, required: true },
		channelId: { type: String, required: true, unique: true },
		authorId: { type: String, required: true },
		closed: { type: Boolean, default: false, required: true },
	});

	SUPPORT_SCHEMA = mongoose.Schema({
		...this.base,
		serial: { type: Number, unique: true, required: true },
		guildId: { type: String, required: true },
		channelId: { type: String, required: true, unique: true },
		authorId: { type: String, required: true },
		closed: { type: Boolean, default: false, required: true },
	});

	INVOICE_SCHEMA = mongoose.Schema({
		...this.base,
		userId: { type: String, required: true },
		ticketId: { type: String, required: true },
		amount: { type: Number, required: true },
		payUrl: { type: String },
		paypalOrderId: { type: String },
		paid: { type: Boolean, default: false, required: true },
	});

	PROFILE_SCHEMA = mongoose.Schema({
		...this.base,
		userId: { type: String, required: true },
		bio: { type: String, default: "No bio" },
		portfolio: { type: String, default: "No portfolio" },
		timezone: { type: String, default: "Unset" },
		balance: { type: Number, default: 0 },
		paypalEmail: { type: String },
	});

	REVIEW_SCHEMA = mongoose.Schema({
		...this.base,
		commissionId: { type: String, required: true },
		userId: { type: String, required: true },
		freelancerId: { type: String, required: true },
		rating: { type: Number, required: true },
		message: { type: String, required: true },
	});

	QUOTE_SCHEMA = mongoose.Schema({
		...this.base,
		commissionId: { type: String, required: true },
		freelancerId: { type: String, required: true },
		incomingQuoteMsg: { type: String, required: true },
		price: { type: Number, required: true },
	});

	constructor(client) {
		this.client = client;
		mongoose.connect(client.config.mongoUri);
		this.Guild = mongoose.model("guild", this.GUILD_SCHEMA);
		this.Commission = mongoose.model("commission", this.COMMISSION_SCHEMA);
		this.Invoice = mongoose.model("invoice", this.INVOICE_SCHEMA);
		this.Profile = mongoose.model("profile", this.PROFILE_SCHEMA);
		this.Review = mongoose.model("review", this.REVIEW_SCHEMA);
		this.Application = mongoose.model("application", this.APPLICATION_SCHEMA);
		this.Support = mongoose.model("support", this.SUPPORT_SCHEMA);
		this.Quote = mongoose.model("quote", this.QUOTE_SCHEMA);
	}

	async getGuildSettings(guildId) {
		let settings = await this.Guild.findOne({ guildId: guildId }).exec();
		if (!settings) settings = await new this.Guild({ guildId: guildId }).save();
		return settings;
	}

	async getProfile(userId) {
		let prof = await this.Profile.findOne({ userId });
		if (!prof) prof = await this.Profile.create({ userId });
		return prof;
	}

	async logTicketInfo(guild, title, fields, ticketId, color) {
		const settings = await this.getGuildSettings(guild.id);
		if (!settings.logChannel) return;
		const logChannel = await guild.channels.fetch(settings.logChannel).catch(() => {});
		if (!logChannel) return;
		logChannel.send({
			embeds: [
				new MessageEmbed()
					.setAuthor({ name: title })
					.addFields(fields)
					.setColor(color || "#3c96b0"),
			],
			components: ticketId
				? [new MessageActionRow().addComponents(new MessageButton({ label: "Open", style: "LINK", url: `https://discord.com/channels/${guild.id}/${ticketId}` }))]
				: [],
		});
	}
};
