const { MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
const moment = require("moment");
const { QuestionType } = require("../../configenums");

module.exports = class TicketManager {
	constructor(client) {
		this.client = client;
	}

	createCommission(guild, user) {
		return new Promise(async (res, rej) => {
			try {
				const settings = await this.client.db.getGuildSettings(guild.id);

				const useAfter = this.client.useNewAfter.get(user.id) || moment();

				if (useAfter && useAfter > Date.now()) return rej(new Error(`Please wait ${moment(useAfter).fromNow(true)} to create a new commission ticket.`));
				this.client.useNewAfter.set(user.id, Date.now() + 60 * 1000);

				const ticketCount = await this.client.db.Commission.countDocuments({ guildId: guild.id });

				const ticketChannel = await guild.channels.create(`pending-${ticketCount + 1}`, {
					type: "GUILD_TEXT",
					topic: `🎫 Ticket created by ${user}`,
					parent: settings.commissionCategory || undefined,
				});

				await ticketChannel.permissionOverwrites.create(guild.roles.everyone.id, { SEND_MESSAGES: false, VIEW_CHANNEL: false });
				await ticketChannel.permissionOverwrites.create(user.id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });
				await ticketChannel.permissionOverwrites.create(this.client.user.id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });

				this.client.db.logTicketInfo(
					guild,
					"✉ Pending Commission Ticket Created",
					[
						{ name: "» User", value: `${user}` },
						{ name: "» Created At", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
						{ name: "» Channel Name", value: `${ticketChannel.name}` },
					],
					ticketChannel.id
				);

				const ticketDoc = await new this.client.db.Commission({
					guildId: guild.id,
					channelId: ticketChannel.id,
					authorId: user.id,
					serial: ticketCount + 1,
				}).save();

				const originalMessage = await this.commissionPrompts2(guild, user, ticketChannel, ticketDoc, settings);
				res(originalMessage);
			} catch (err) {
				rej(err);
			}
		});
	}

	createApplication(guild, user) {
		return new Promise(async (res, rej) => {
			try {
				const settings = await this.client.db.getGuildSettings(guild.id);
				const useAfter = this.client.useNewAfter.get(user.id) || moment();
				if (useAfter && useAfter > Date.now()) return rej(new Error(`Please wait ${moment(useAfter).fromNow(true)} to create a new ticket.`));
				this.client.useNewAfter.set(user.id, Date.now() + 60 * 1000);

				const ticketCount = await this.client.db.Application.countDocuments({ guildId: guild.id });

				const ticketChannel = await guild.channels.create(`application-${ticketCount + 1}`, {
					type: "GUILD_TEXT",
					topic: `🎫 Application created by ${user}`,
					parent: settings.applicationCategory || undefined,
				});

				await ticketChannel.permissionOverwrites.create(guild.roles.everyone.id, { SEND_MESSAGES: false, VIEW_CHANNEL: false });
				await ticketChannel.permissionOverwrites.create(user.id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });
				await ticketChannel.permissionOverwrites.create(this.client.user.id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });

				this.client.db.logTicketInfo(
					guild,
					"✉ Pending Application Ticket Created",
					[
						{ name: "» User", value: `${user}` },
						{ name: "» Created At", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
						{ name: "» Channel Name", value: `${ticketChannel.name}` },
					],
					ticketChannel.id
				);

				const ticketDoc = await new this.client.db.Application({
					guildId: guild.id,
					channelId: ticketChannel.id,
					authorId: user.id,
					serial: ticketCount + 1,
				}).save();

				const originalMessage = await this.applicationPrompts(guild, user, ticketChannel, ticketDoc, settings);
				res(originalMessage);
			} catch (err) {
				rej(err);
			}
		});
	}

	createSupport(guild, user) {
		return new Promise(async (res, rej) => {
			try {
				const settings = await this.client.db.getGuildSettings(guild.id);
				const useAfter = this.client.useNewAfter.get(user.id) || moment();
				if (useAfter && useAfter > Date.now()) return rej(new Error(`Please wait ${moment(useAfter).fromNow(true)} to create a new ticket.`));
				this.client.useNewAfter.set(user.id, Date.now() + 60 * 1000);

				const ticketCount = await this.client.db.Support.countDocuments({ guildId: guild.id });

				const ticketChannel = await guild.channels.create(`support-${ticketCount + 1}`, {
					type: "GUILD_TEXT",
					topic: `🎫 Support ticket created by ${user}`,
					parent: settings.supportCategory || undefined,
				});

				await ticketChannel.permissionOverwrites.create(guild.roles.everyone.id, { SEND_MESSAGES: false, VIEW_CHANNEL: false });
				await ticketChannel.permissionOverwrites.create(user.id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });
				await ticketChannel.permissionOverwrites.create(this.client.user.id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });

				this.client.db.logTicketInfo(
					guild,
					"✉ Pending Support Ticket Created",
					[
						{ name: "» User", value: `${user}` },
						{ name: "» Created At", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
						{ name: "» Channel Name", value: `${ticketChannel.name}` },
					],
					ticketChannel.id
				);

				const ticket = await new this.client.db.Support({
					guildId: guild.id,
					channelId: ticketChannel.id,
					authorId: user.id,
					serial: ticketCount + 1,
				}).save();

				const embed = this.client.embed.success(`**Welcome to your support ticket**.\n*A staff member will be with you any moment.*`);
				const originalMessage = await ticketChannel.send({
					content: `${user}`,
					embeds: [embed],
					components: [
						new MessageActionRow().addComponents(
							new MessageButton({ label: "Archive", customId: `archive-support-${ticket.id}`, style: "SECONDARY", emoji: "<a:NO:851113390869053470>" })
						),
					],
				});
				res(originalMessage);
			} catch (err) {
				rej(err);
			}
		});
	}

	async commissionPrompts(guild, user, channel, comm) {
		let answers = [];
		const serviceRow = new MessageActionRow().addComponents(
			new MessageSelectMenu({ customId: "newTicket-serviceSel", placeholder: "Select a service here..." }).addOptions(
				{ label: "Front end Web Developer", value: "frontwebdev", description: "Website design (HTML & CSS).", emoji: "<:front_develop:943769825891741696>" },
				{ label: "Back end Web Developer", value: "backwebdev", description: "Web servers and APIs.", emoji: "<:api:943768712727638026>" },
				{ label: "Full Stack Web Developer", value: "webdev", description: "Webside design & web servers combined.", emoji: "<:web_development:943771471904403486>" },
				{ label: "Bot Developer", value: "botdev", description: "Discord bot development.", emoji: "<:bot_development:943762423314276373>" },
				{ label: "GFX Artist", value: "gfx", description: "Graphics and logos.", emoji: "<:graphic_design:943770332790136833>" },
				{ label: "Illustrator", value: "illustrator", description: "Digital drawings.", emoji: "<:illustrator:943764633582448713>" },
				{ label: "System Administrator", value: "sysadmin", description: "Management of virtual servers.", emoji: "<:system:943779054786580480>" },
				{
					label: "Plugin Developer",
					value: "plugindev",
					description: "Minecraft: Java Edition server plugins development.",
					emoji: "<:plugin_developer:943765947519488000>",
				},
				{ label: "Builder", value: "builder", description: "Minecraft building services.", emoji: "<:builder:943772636998172712>" },
				{ label: "Terraformer", value: "terraformer", description: "Minecraft terrain terraforming service.", emoji: "<:terraformer2:943774588159017040>" }
			)
		);
		const embed = this.client.embed.success(
			`**Welcome to your ticket.**\nBefore inquiring about a project, please answer some questions that will help us categorize the ticket and provide quicker responses.\n\n*What service are you looking for?*`
		);
		const originalMessage = await channel.send({
			content: `${user}`,
			embeds: [embed],
			components: [
				serviceRow,
				new MessageActionRow().addComponents(
					new MessageButton({ label: "Archive", customId: `archive-commission-${comm.id}`, style: "SECONDARY", emoji: "<a:NO:851113390869053470>" })
				),
			],
		});

		const channelNames = {
			webdev: "web",
			frontwebdev: "frontend",
			backwebdev: "backend",
			botdev: "bot",
			gfx: "gfx",
			illustrator: "illustrator",
			sysadmin: "systemadmin",
			plugindev: "plugin",
			builder: "builder",
			terraformer: "terraformer",
		};

		originalMessage
			.awaitMessageComponent({ filter: (i) => i.user.id === user.id && i.customId === "newTicket-serviceSel", time: 10 * 60 * 1000 })
			.then(async (int1) => {
				const updatedTicket = await this.client.db.Commission.findOne({ id: comm.id }).exec();
				if (updatedTicket.closed) return int1.reply({ embeds: [this.client.embed.error(`This ticket has been archived.`)] });
				const service = int1.values[0];
				answers.push({ name: "Service", value: serviceRow.components[0].options.find((o) => o.value === service)?.label });

				const deadlineRow = new MessageActionRow().addComponents(
					new MessageSelectMenu({ customId: "newTicket-deadlineSel", placeholder: "Select a deadline here..." }).addOptions(
						{ label: "<1 day", value: "under1" },
						{ label: "1-3 days", value: "1to3" },
						{ label: "3-5 days", value: "3to5" },
						{ label: "5-7 days", value: "5to7" },
						{ label: "7-14 days", value: "7to14" },
						{ label: "14-30 days", value: "14to30" },
						{ label: "30+ days", value: "over30" },
						{ label: "No deadline", value: "nodeadline" }
					)
				);
				await int1.reply({ embeds: [this.client.embed.success(`*What is the maximum time deadline for this project?*`)], components: [deadlineRow] });
				const intDeadline = await int1.channel.awaitMessageComponent({
					filter: (i) => i.user.id === user.id && i.customId === "newTicket-deadlineSel",
					time: 10 * 60 * 1000,
				});
				await intDeadline.deferUpdate();
				answers.push({ name: "Deadline", value: deadlineRow.components[0].options.find((o) => o.value === intDeadline.values[0])?.label });

				await int1.editReply({ embeds: [this.client.embed.success(`*What is your budget for this project? (in USD, reply "quote" for a quote)*`)], components: [] });
				const priceMsgs = await int1.channel.awaitMessages({ filter: (m) => m.author.id === user.id, max: 1, time: 10 * 60 * 1000 });
				const priceMsg = priceMsgs.first();
				priceMsg.delete();
				answers.push({ name: "Budget", value: priceMsg.content });

				await int1.editReply({
					embeds: [this.client.embed.success(`*Please provide a detailed description of the service you need.*`).setFooter({ text: "Max 1000 chars." })],
					components: [],
				});
				const descMsgs = await int1.channel.awaitMessages({ filter: (m) => m.author.id === user.id, max: 1, time: 10 * 60 * 1000 });
				const descMsg = descMsgs.first();
				descMsg.delete();
				const attachments1 = descMsg.attachments.size
					? `\n**Description attachments**: ${[...descMsg.attachments.values()]
							.map((a, i) => `[[${i + 1}: ${a.name.length > 20 ? a.name.slice(0, 20) + "..." : a.name}]](${a.url})`)
							.join(", ")}`
					: "";
				const description = `${descMsg.content.length > 1000 ? descMsg.content.slice(0, 1000 - 3) + "..." : descMsg.content}${attachments1}`;
				answers.push({
					name: "Description",
					value: `${description}`,
				});

				await int1.editReply({
					embeds: [
						this.client.embed
							.success(`*Do you have any references and examples for this project? (links, images, videos, etc.)*`)
							.setFooter({ text: "Max 500 chars." }),
					],
					components: [],
				});

				const refMsgs = await int1.channel.awaitMessages({ filter: (m) => m.author.id === user.id, max: 1, time: 10 * 60 * 1000 });
				const refMsg = refMsgs.first();
				refMsg.delete();
				const truncatedContent = refMsg.content.length > 500 ? refMsg.content.slice(0, 500 - 3) + "..." : refMsg.content;
				const attachments2 = refMsg.attachments.size
					? `\n**References attachments**: ${[...refMsg.attachments.values()]
							.map((a, i) => `[[${i + 1}: ${a.name.length > 20 ? a.name.slice(0, 20) + "..." : a.name}]](${a.url})`)
							.join(", ")}`
					: "";
				const references = `${truncatedContent}${attachments2}`;
				answers.push({
					name: "References",
					value: references,
				});

				// Finish
				this.client.db.logTicketInfo(
					guild,
					"✉ Ticket Commission Info Submitted",
					[
						{ name: "» User", value: `${user}` },
						{ name: "» Created At", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
						{ name: "» Channel Name", value: `${channel.name}` },
					],
					channel.id
				);

				/* Separate thread */
				(async () => {
					const settings = await this.client.db.getGuildSettings(guild.id);
					if (!settings.commissionLog) return;
					const commissionLog = await guild.channels.fetch(settings.commissionLog).catch(() => {});
					if (!commissionLog) return;
					const row = new MessageActionRow().addComponents(
						new MessageButton({ customId: `quote-${comm.id}`, label: "Quote", style: "SUCCESS", emoji: "💵" }),
						new MessageButton({ customId: `message-new-${comm.id}`, label: "Message", style: "SECONDARY", emoji: "✉️" })
					);
					const l = await commissionLog.send({
						content: this.client.config.roles[service] ? `<@&${this.client.config.roles[service]}>` : undefined,
						embeds: [
							this.client.embed
								.success()
								.addFields(answers)
								.setTitle("New Commission Submitted")
								.setFooter({ text: `Commission ID: ${comm.id}` }),
						],
						components: [row],
					});
					comm.logMsg = l.id;
					await comm.save();
				})();

				await int1.editReply({
					embeds: [
						this.client.embed.success(
							`**Thanks for answering all the questions.**\nWe will reply to you soon.\n\n${answers.map(({ name, value }) => `**${name}**:\n${value}`).join("\n")}`
						),
					],
					components: [],
				});
				comm.pending = false;
				await comm.save();

				channel.setName(`${channelNames[service]}-${comm.serial}`);
			})
			.catch(async () => {
				this.close(channel, user).catch(() => {
					/*ignore errors from guildDelete and channelDelete*/
				});
			});

		return originalMessage;
	}

	async commissionPrompts2(guild, user, channel, comm) {
		let answers = [];
		const serviceRow = new MessageActionRow().addComponents(
			new MessageSelectMenu({ customId: "newTicket-serviceSel", placeholder: "Select a service here..." }).addOptions(
				{ label: "Front end Web Developer", value: "frontwebdev", description: "Website design (HTML & CSS).", emoji: "<:front_develop:943769825891741696>" },
				{ label: "Back end Web Developer", value: "backwebdev", description: "Web servers and APIs.", emoji: "<:api:943768712727638026>" },
				{ label: "Full Stack Web Developer", value: "webdev", description: "Webside design & web servers combined.", emoji: "<:web_development:943771471904403486>" },
				{ label: "Bot Developer", value: "botdev", description: "Discord bot development.", emoji: "<:bot_development:943762423314276373>" },
				{ label: "GFX Artist", value: "gfx", description: "Graphics and logos.", emoji: "<:graphic_design:943770332790136833>" },
				{ label: "Illustrator", value: "illustrator", description: "Digital drawings.", emoji: "<:illustrator:943764633582448713>" },
				{ label: "System Administrator", value: "sysadmin", description: "Management of virtual servers.", emoji: "<:system:943779054786580480>" },
				{
					label: "Plugin Developer",
					value: "plugindev",
					description: "Minecraft: Java Edition server plugins development.",
					emoji: "<:plugin_developer:943765947519488000>",
				},
				{ label: "Builder", value: "builder", description: "Minecraft building services.", emoji: "<:builder:943772636998172712>" },
				{ label: "Terraformer", value: "terraformer", description: "Minecraft terrain terraforming service.", emoji: "<:terraformer2:943774588159017040>" }
			)
		);
		const embed = this.client.embed.success(
			`**Welcome to your ticket.**\nBefore inquiring about a project, please answer some questions that will help us categorize the ticket and provide quicker responses.\n\n*What service are you looking for?*`
		);
		const originalMessage = await channel.send({
			content: `${user}`,
			embeds: [embed],
			components: [
				serviceRow,
				new MessageActionRow().addComponents(
					new MessageButton({ label: "Archive", customId: `archive-commission-${comm.id}`, style: "SECONDARY", emoji: "<a:NO:851113390869053470>" })
				),
			],
		});

		const channelNames = {
			webdev: "web",
			frontwebdev: "frontend",
			backwebdev: "backend",
			botdev: "bot",
			gfx: "gfx",
			illustrator: "illustrator",
			sysadmin: "systemadmin",
			plugindev: "plugin",
			builder: "builder",
			terraformer: "terraformer",
		};

		originalMessage
			.awaitMessageComponent({ filter: (i) => i.user.id === user.id && i.customId === "newTicket-serviceSel", time: 10 * 60 * 1000 })
			.then(async (int1) => {
				const updatedTicket = await this.client.db.Commission.findOne({ id: comm.id }).exec();
				if (updatedTicket.closed) return int1.reply({ embeds: [this.client.embed.error(`This ticket has been archived.`)] });
				const service = int1.values[0];
				answers.push({ name: "Service", value: serviceRow.components[0].options.find((o) => o.value === service)?.label });

				/* Begin prompting system */
				const questions = this.client.config.questions.commissions;

				for (let question of questions) {
					if (question.type === QuestionType.SELECT_MENU) {
						const row = new MessageActionRow().addComponents(
							new MessageSelectMenu({
								customId: "newTicket-selection",
								placeholder: question.selectMenuData.placeholder || "Select an option here...",
								minValues: question.min || 1,
								maxValues: question.max || 1,
							}).addOptions(question.selectMenuData.values.map((r, i) => ({ label: r, value: `${i}` })))
						);
						await int1.reply({ embeds: [this.client.embed.info(question.question || "No message added here. Add one in config.js!")], components: [row] });
						const int = await int1.channel.awaitMessageComponent({
							filter: (i) => i.user.id === user.id && i.customId === "newTicket-selection",
							time: 10 * 60 * 1000,
						});
						await int.deferUpdate();
						answers.push({ name: question.fieldName, value: row.components[0].options.find((o) => o.value === int.values[0])?.label });
					} else {
						await int1.editReply({ embeds: [this.client.embed.info(question.question)], components: [] });
						const priceMsgs = await int1.channel.awaitMessages({ filter: (m) => m.author.id === user.id, max: 1, time: 10 * 60 * 1000 });
						const msg = priceMsgs.first();
						msg.delete().catch(() => {});
						const attachments = msg.attachments.size
							? `\n**${question.fieldName} attachments**: ${[...msg.attachments.values()]
									.map((a, i) => `[[${i + 1}: ${a.name.length > 20 ? a.name.slice(0, 20) + "..." : a.name}]](${a.url})`)
									.join(", ")}`
							: "";
						if (msg.content.length > (question.max || 2000)) {
							msg.content = msg.content.slice(0, question.max || 2000) + "...";
						}
						msg.content = msg.content + attachments;
						answers.push({ name: question.fieldName, value: msg.content });
					}
				}

				// Finish
				this.client.db.logTicketInfo(
					guild,
					"✉ Ticket Commission Info Submitted",
					[
						{ name: "» User", value: `${user}` },
						{ name: "» Created At", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
						{ name: "» Channel Name", value: `${channel.name}` },
					],
					channel.id
				);

				/* Separate thread */
				(async () => {
					const settings = await this.client.db.getGuildSettings(guild.id);
					if (!settings.commissionLog) return;
					const commissionLog = await guild.channels.fetch(settings.commissionLog).catch(() => {});
					if (!commissionLog) return;
					const row = new MessageActionRow().addComponents(
						new MessageButton({ customId: `quote-${comm.id}`, label: "Quote", style: "SUCCESS", emoji: "💵" }),
						new MessageButton({ customId: `message-new-${comm.id}`, label: "Message", style: "SECONDARY", emoji: "✉️" })
					);
					const l = await commissionLog.send({
						content: this.client.config.roles[service] ? `<@&${this.client.config.roles[service]}>` : undefined,
						embeds: [
							this.client.embed
								.success()
								.addFields(answers)
								.setTitle("New Commission Submitted")
								.setFooter({ text: `Commission ID: ${comm.id}` }),
						],
						components: [row],
					});
					comm.logMsg = l.id;
					await comm.save();
				})();

				await int1.editReply({
					embeds: [
						this.client.embed.success(
							`**Thanks for answering all the questions.**\nWe will reply to you soon.\n\n${answers.map(({ name, value }) => `**${name}**:\n${value}`).join("\n")}`
						),
					],
					components: [],
				});
				comm.pending = false;
				await comm.save();

				channel.setName(`${channelNames[service]}-${comm.serial}`);
			})
			.catch(async () => {
				this.close(channel, user, "Commission").catch(() => {
					/*ignore errors from guildDelete and channelDelete*/
				});
			});

		return originalMessage;
	}

	async applicationPrompts(guild, user, channel, app) {
		let answers = [];
		const serviceRow = new MessageActionRow().addComponents(
			new MessageSelectMenu({ customId: "newTicket-serviceSel", placeholder: "Select a service here...", minValues: 1, maxValues: 5 }).addOptions(
				{ label: "Front end Web Developer", value: "frontwebdev", description: "Website design (HTML & CSS).", emoji: "<:front_develop:943769825891741696>" },
				{ label: "Back end Web Developer", value: "backwebdev", description: "Web servers and APIs.", emoji: "<:api:943768712727638026>" },
				{ label: "Full Stack Web Developer", value: "webdev", description: "Webside design & web servers combined.", emoji: "<:web_development:943771471904403486>" },
				{ label: "Bot Developer", value: "botdev", description: "Discord bot development.", emoji: "<:bot_development:943762423314276373>" },
				{ label: "GFX Artist", value: "gfx", description: "Graphics and logos.", emoji: "<:graphic_design:943770332790136833>" },
				{ label: "Illustrator", value: "illustrator", description: "Digital drawings.", emoji: "<:illustrator:943764633582448713>" },
				{ label: "System Administrator", value: "sysadmin", description: "Management of virtual servers.", emoji: "<:system:943779054786580480>" },
				{
					label: "Plugin Developer",
					value: "plugindev",
					description: "Minecraft: Java Edition server plugins development.",
					emoji: "<:plugin_developer:943765947519488000>",
				},
				{ label: "Builder", value: "builder", description: "Minecraft building services.", emoji: "<:builder:943772636998172712>" },
				{ label: "Terraformer", value: "terraformer", description: "Minecraft terrain terraforming service.", emoji: "<:terraformer2:943774588159017040>" }
			)
		);
		const embed = this.client.embed.success(
			`**Welcome to your application**.\nPlease fill it up as truthfully as you can, otherwise you will not be accepted.\nWe are also not accepting freelancers with experience span of less than 1 year.\n\n*Firstly, choose up to 5 specializations you want to accept commissions for.*`
		);
		const originalMessage = await channel.send({
			content: `${user}`,
			embeds: [embed],
			components: [
				serviceRow,
				new MessageActionRow().addComponents(
					new MessageButton({ label: "Archive", customId: `archive-application-${app.id}`, style: "SECONDARY", emoji: "<a:NO:851113390869053470>" })
				),
			],
		});

		originalMessage
			.awaitMessageComponent({ filter: (i) => i.user.id === user.id && i.customId === "newTicket-serviceSel", time: 10 * 60 * 1000 })
			.then(async (int1) => {
				const updatedApp = await this.client.db.Application.findOne({ id: app.id });
				if (updatedApp.closed) return int1.reply({ embeds: [this.client.embed.error(`This ticket has been archived.`)] });

				const services = int1.values;
				answers.push({ name: "Services", value: services.map((s) => serviceRow.components[0].options.find((o) => o.value === s)?.label).join(", ") });

				const questions = this.client.config.questions.applications;

				for (let question of questions) {
					if (question.type === QuestionType.SELECT_MENU) {
						const row = new MessageActionRow().addComponents(
							new MessageSelectMenu({
								customId: "newTicket-selection",
								placeholder: question.selectMenuData.placeholder || "Select an option here...",
								minValues: question.min || 1,
								maxValues: question.max || 1,
							}).addOptions(question.selectMenuData.values.map((r, i) => ({ label: r, value: `${i}` })))
						);
						await int1.reply({ embeds: [this.client.embed.info(question.question || "No message added here. Add one in config.js!")], components: [row] });
						const intDeadline = await int1.channel.awaitMessageComponent({
							filter: (i) => i.user.id === user.id && i.customId === "newTicket-selection",
							time: 10 * 60 * 1000,
						});
						await intDeadline.deferUpdate();
						answers.push({ name: question.fieldName, value: row.components[0].options.find((o) => o.value === intDeadline.values[0])?.label });
					} else {
						await int1.editReply({ embeds: [this.client.embed.info(question.fieldName)], components: [] });
						const priceMsgs = await int1.channel.awaitMessages({ filter: (m) => m.author.id === user.id, max: 1, time: 10 * 60 * 1000 });
						const msg = priceMsgs.first();
						msg.delete().catch(() => {});
						const attachments = msg.attachments.size
							? `\n**${question.fieldName} attachments**: ${[...msg.attachments.values()]
									.map((a, i) => `[[${i + 1}: ${a.name.length > 20 ? a.name.slice(0, 20) + "..." : a.name}]](${a.url})`)
									.join(", ")}`
							: "";
						if (msg.content.length > (question.max || 2000)) {
							msg.content = msg.content.slice(0, question.max || 2000) + "...";
						}
						msg.content = msg.content + attachments;
						answers.push({ name: question.fieldName, value: msg.content });
					}
				}

				// Finish
				this.client.db.logTicketInfo(
					guild,
					"✉ Ticket Application Info Submitted",
					[
						{ name: "» User", value: `${user}` },
						{ name: "» Created At", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
						{ name: "» Channel Name", value: `${channel.name}` },
					],
					channel.id
				);

				/* Separate thread */
				(async () => {
					const settings = await this.client.db.getGuildSettings(guild.id);
					if (!settings.applicationLog) return;
					const commissionLog = await guild.channels.fetch(settings.applicationLog).catch(() => {});
					if (!commissionLog) return;
					await commissionLog.send({
						embeds: [
							this.client.embed
								.success()
								.addFields(answers)
								.setTitle("New Commission Submitted")
								.setFooter({ text: `Application ID: ${app.id}` }),
						],
					});
				})();

				await int1.editReply({
					embeds: [
						this.client.embed.success(
							`**Thanks for answering all the questions.**\nWe will reply to you soon.\n\n${answers.map(({ name, value }) => `**${name}**:\n${value}`).join("\n")}`
						),
					],
					components: [],
				});
				app.pending = false;
				await app.save();

				channel.setName(`application-${app.serial}`);
			})
			.catch(async () => {
				this.close(channel, user, "Application").catch(() => {
					/*ignore errors from guildDelete and channelDelete*/
				});
			});

		return originalMessage;
	}

	close(channel, user, collection = "Commission") {
		return new Promise(async (res, rej) => {
			const settings = await this.client.db.getGuildSettings(channel.guild.id);
			const ticket = await this.client.db[collection].findOne({ channelId: channel.id });
			if (!ticket) return rej(new Error("This isn't a valid ticket channel."));
			if (ticket.closed) return rej(new Error("This ticket is already archived."));

			this.client.db.logTicketInfo(channel.guild, "⛔ Ticket Archived", [{ name: "» User", value: `${user}` }], channel.id, "#d94c4c");
			ticket.closed = true;
			ticket.pending = false;
			await ticket.save();
			await channel.permissionOverwrites.edit(ticket.authorId, { SEND_MESSAGES: false, VIEW_CHANNEL: false });
			if (settings.closedCategory)
				await channel.setParent(settings.closedCategory, { lockPermissions: false }).catch((err) => {
					channel.send({ embeds: [this.client.embed.error(`Failed to move channel to closed tickets category: ${err.message}`)] });
				});
			await channel.setName(`archived-${channel.name}`);
			res();
		});
	}

	async sendReview(guild, freelancerId, userId, stars, message, id) {
		const settings = await this.client.db.getGuildSettings(guild.id);
		if (!settings.reviewChannel) return;
		const reviewChannel = await guild.channels.fetch(settings.reviewChannel).catch(() => {});
		if (!reviewChannel) return;
		const freelancer = await guild.members.fetch(freelancerId);
		await reviewChannel.send({
			embeds: [
				this.client.embed
					.info()
					.setColor("RANDOM")
					.addFields([
						{ name: "Freelancer", value: `<@${freelancerId}>`, inline: true },
						{ name: "Customer", value: `<@${userId}>`, inline: true },
						{ name: "Rating", value: `${"⭐".repeat(stars)} ${stars}`, inline: true },
						{ name: "Message", value: `\`\`\`\n${message}\`\`\`` },
					])
					.setTitle("Review")
					.setFooter({ text: `Review ID: ${id}` })
					.setThumbnail(freelancer.displayAvatarURL()),
			],
		});
	}

	reopen(channel, user) {
		return new Promise(async (res, rej) => {
			const settings = await this.client.db.getGuildSettings(channel.guild.id);
			const ticket = await this.client.db.Commission.findOne({ channelId: channel.id }).exec();
			if (!ticket) return rej("This isn't a valid ticket channel.");
			if (!ticket.closed) return rej("This ticket isn't closed and can't be reopened.");
			this.client.db.logTicketInfo(channel.guild, "↩ Ticket Reopened", [{ name: "» User", value: `${user}` }], channel.id, "#d94c4c");
			ticket.closed = false;
			await ticket.save();
			await channel.permissionOverwrites.edit(user.id, { SEND_MESSAGES: true, VIEW_CHANNEL: true });
			if (settings.commissionCategory)
				channel.setParent(settings.commissionCategory, { lockPermissions: false }).catch((err) => {
					channel.send({ embeds: [this.client.embed.error(`Failed to move channel to open tickets category: ${err.message}`)] });
				});
			channel.send({
				embeds: [this.client.embed.info(`This ticket has been reopened by ${user}.`)],
				components: [new MessageActionRow().addComponents(new MessageButton({ label: "Close", emoji: "🔒", customId: "TICKET_CLOSE", style: "SECONDARY" }))],
			});
			res();
		});
	}
};
