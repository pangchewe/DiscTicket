const { InteractionCommand } = require("@nortex/handler");

module.exports = class extends InteractionCommand {
	constructor(...args) {
		super(...args, {
			name: "set",
			category: "Profile",
			description: "Set a profile setting.",
			options: [
				{
					type: "SUB_COMMAND",
					name: "portfolio",
					description: `Update the portfolio link.`,
					options: [
						{
							type: "STRING",
							name: "link",
							description: "The new portfolio link.",
							required: true,
						},
					],
				},
				{
					type: "SUB_COMMAND",
					name: "bio",
					description: `Update your bio.`,
					options: [
						{
							type: "STRING",
							name: "content",
							description: "The new bio.",
							required: true,
						},
					],
				},
				{
					type: "SUB_COMMAND",
					name: "timezone",
					description: `Update your timezone.`,
					options: [
						{
							type: "STRING",
							name: "timezone",
							description: "The new timezone.",
							required: true,
							choices: [
								{ name: "GMT -11:00", value: "-11:00" },
								{ name: "GMT -10:00", value: "-10:00" },
								{ name: "GMT -09:00", value: "-09:00" },
								{ name: "GMT -08:00", value: "-08:00" },
								{ name: "GMT -07:00", value: "-07:00" },
								{ name: "GMT -06:00", value: "-06:00" },
								{ name: "GMT -05:00", value: "-05:00" },
								{ name: "GMT -04:00", value: "-04:00" },
								{ name: "GMT -03:30", value: "-03:30" },
								{ name: "GMT -03:00", value: "-03:00" },
								{ name: "GMT -02:00", value: "-02:00" },
								{ name: "GMT -01:00", value: "-01:00" },
								{ name: "GMT 00:00", value: "00:00" },
								{ name: "GMT +01:00", value: "+01:00" },
								{ name: "GMT +02:00", value: "+02:00" },
								{ name: "GMT +03:00", value: "+03:00" },
								{ name: "GMT +03:30", value: "+03:30" },
								{ name: "GMT +04:00", value: "+04:00" },
								{ name: "GMT +04:30", value: "+04:30" },
								{ name: "GMT +05:00", value: "+05:00" },
								{ name: "GMT +06:00", value: "+06:00" },
								{ name: "GMT +07:00", value: "+07:00" },
								{ name: "GMT +08:00", value: "+08:00" },
								{ name: "GMT +09:00", value: "+09:00" },
								{ name: "GMT +10:00", value: "+10:00" },
							],
						},
					],
				},
				{
					type: "SUB_COMMAND",
					name: "paypal",
					description: `Set your PayPal email to accept withdrawals.`,
					options: [
						{
							type: "STRING",
							name: "email",
							description: "The email to set. This is not shown anywhere except managers.",
							required: true,
						},
					],
				},
			],
		});
	}

	async run(interaction, { settings }) {
		if (settings.freelancerRole && !interaction.member.roles.cache.has(settings.freelancerRole))
			return interaction.reply({ embeds: [this.client.embed.error("You must be a freelancer to do this commissions.")], ephemeral: true });
		const sub = interaction.options.getSubcommand();
		const profile = await this.client.db.getProfile(interaction.user.id);
		if (sub === "portfolio") {
			const value = interaction.options.getString("link");
			try {
				const url = new URL(value);
				profile.portfolio = url.href;
				await profile.save();
				return interaction.reply({ embeds: [this.client.embed.success(`Portfolio link updated to \`${url.href}\`.`)], ephemeral: true });
			} catch (e) {
				return interaction.reply({ embeds: [this.client.embed.error(`This is an invalid link. Please provide a valid http/https link.`)], ephemeral: true });
			}
		} else if (sub === "bio") {
			const value = interaction.options.getString("content");
			if (value.length > 500) return interaction.reply({ embeds: [this.client.embed.error(`Your bio must be less than 500 characters.`)], ephemeral: true });
			profile.bio = value;
			await profile.save();
			return interaction.reply({ embeds: [this.client.embed.success(`Your bio has been updated to \`${value}\`.`)], ephemeral: true });
		} else if (sub === "timezone") {
			const timezone = interaction.options.getString("timezone");
			profile.timezone = timezone;
			await profile.save();
			return interaction.reply({ embeds: [this.client.embed.success(`Timezone has been set to ${timezone}.`)], ephemeral: true });
		} else if (sub === "paypal") {
			const email = interaction.options.getString("email");
			profile.paypalEmail = email;
			await profile.save();
			return interaction.reply({ embeds: [this.client.embed.success(`PayPal has been set to ${email}.`)], ephemeral: true });
		}
	}
};
