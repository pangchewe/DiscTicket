const axios = require("axios");

module.exports = class PayPalManager {
	constructor(client) {
		this.client = client;
		this.rootUrl = client.config.gateways.paypal.useSandbox ? "https://api-m.sandbox.paypal.com/v2" : "https://api-m.paypal.com/v2";
		this.clientId = process.env.PAYPAL_CLIENT_ID || client.config.gateways.paypal.clientSecret || "";
		this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || client.config.gateways.paypal.clientSecret || "";
		this.returnUrl = client.config.gateways.paypal.returnUrl;
		this.cancelUrl = client.config.gateways.paypal.cancelUrl;
		this.currency = client.config.gateways.paypal.currency;
	}

	async createOrder({ ticket, pretax, posttax, interaction }) {
		return new Promise(async (resolve, reject) => {
			const invoice = new this.client.db.Invoice({ ticketId: ticket.id, userId: ticket.authorId, amount: posttax });
			axios({
				url: this.rootUrl + "/checkout/orders",
				method: "POST",
				headers: {
					Authorization: "Basic " + Buffer.from(this.clientId + ":" + this.clientSecret).toString("base64"),
					"Content-Type": "application/json",
				},
				data: {
					intent: "CAPTURE",
					application_context: {
						shipping_preference: "NO_SHIPPING",
					},
					return_urls: {
						return_url: this.returnUrl,
						cancel_url: this.cancelUrl,
					},
					purchase_units: [
						{
							description: `Light Services | Commission payment - Invoice ID #${invoice.id} - Ticket ID ${invoice.ticketId}`,
							amount: {
								currency_code: this.currency,
								value: posttax.toFixed(2),
							},
						},
					],
				},
			})
				.then(async (res) => {
					invoice.paypalOrderId = res.data.id;
					invoice.payUrl = res.data.links[1].href;
					await invoice.save();
					resolve(invoice);
					let maxTries = 40;
					let tries = 0;
					const intervalId = setInterval(async () => {
						tries++;
						if (tries >= maxTries) {
							clearInterval(intervalId);
							await interaction.editReply({
								embeds: [
									this.client.embed
										.error(`Invoice for ${posttax.toFixed(2)} USD has __not__ been paid in time.`)
										.setTitle(`Invoice #${invoice.id}`)
										.addField(`Amount`, `$${pretax.toFixed(2)}`, true)
										.addField(`Handling Fee (10%)`, `$${(pretax * this.client.config.handlingFee).toFixed(2)}`, true)
										.addField(`Total`, `$${posttax.toFixed(2)}`, true)
										.addField(`Status`, `❌ Voided`)
										.setTimestamp(),
								],
							});
							invoice.delete();
							return;
						}
						const paid = await this.checkIfOrderPaid(invoice.paypalOrderId);
						if (!paid) return;
						clearInterval(intervalId);
						invoice.paid = true;
						await invoice.save();
						await interaction.editReply({
							embeds: [
								this.client.embed
									.success(`Invoice for ${posttax.toFixed(2)} USD has been paid.`)
									.setTitle(`Invoice #${invoice.id}`)
									.addField(`Amount`, `$${pretax.toFixed(2)}`, true)
									.addField(`Handling Fee (10%)`, `$${(pretax * this.client.config.handlingFee).toFixed(2)}`, true)
									.addField(`Total`, `$${posttax.toFixed(2)}`, true)
									.addField(`Status`, `✅ Paid`)
									.setTimestamp(),
							],
							components: [],
						});
						await interaction.followUp({
							content: `<@${ticket.freelancerId}>`,
							embeds: [this.client.embed.success(`Invoice #${invoice.id} has been paid successfully.`)],
						});
					}, 30 * 1000);
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	async checkIfOrderPaid(orderId) {
		return new Promise((resolve) => {
			axios({
				url: `${this.rootUrl}/checkout/orders/${orderId}/capture`,
				method: "POST",
				headers: {
					Authorization: "Basic " + Buffer.from(this.clientId + ":" + this.clientSecret).toString("base64"),
					"Content-Type": "application/json",
				},
			})
				.then(async (res) => {
					if (res.data.status === "COMPLETED") resolve(true);
				})
				.catch(() => {
					resolve(false);
				});
		});
	}
};
