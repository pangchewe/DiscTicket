const { QuestionType } = require("./configenums");

module.exports = {
	// The token of the bot from the Discord Developer Portal
	token: "",
	// The prefix of the bot - could be a single String or an Array of Strings to accept many
	prefix: "?",
	// The owner(s) of the bot
	owners: [""],
	// URL to the MongoDB database
	mongoUri: "",
	// The cut from the total paid amount given to the freelancer (0.15% is 15%, meaning the freelancer will get 85% of the total paid amount)
	serviceCut: 0.15, // 15% cut for the service
	// The amount to add on top of the requested maount in an invoice
	handlingFee: 0.1, // 10% handling fee (accounts for PayPal fee)
	// The role id of the manager role
	managerRoleId: "",
	// Individual role IDs for each profession
	roles: {
		frontwebdev: "",
		backwebdev: "",
		webdev: "",
		botdev: "",
		gfx: "",
		illustrator: "",
		sysadmin: "",
		plugindev: "",
		builder: "",
		terraformer: "",
	},
	gateways: {
		paypal: {
			useSandbox: true, // Whether to use the PayPal sandbox or not - remember to set to false for production!
			clientId: "",
			clientSecret: "",
			returnUrl: "",
			cancelUrl: "",
			currency: "USD",
		},
	},
	// Web module (BETA) configuration
	web: {
		// whether or not to enable the web module
		enable: false,
		// Port to run the web API on
		port: 1003,
		// A secret key that is going to be used for storing sessions
		sessionSecret: "",
		// Oauth configuration
		oauth: {
			clientID: "",
			clientSecret: "",
			callbackURL: "/auth/callback", // The callback URL - has to be added to the DDP application
		},
	},
	// Ticket prompting configuration
	questions: {
		commissions: [
			// Question to select the service type is added automatically.
			{
				type: QuestionType.SELECT_MENU,
				fieldName: "Deadline",
				question: "What is the deadline for the commission?",
				selectMenuData: {
					placeholder: "Select a deadline here...",
					// min: 1,
					// max: 1,
					values: ["<1 day", "1-3 days", "3-5 days", "5-7 days", "7-14 days", "14-30 days", "30+ days", "No deadline"],
				},
			},
			{
				type: QuestionType.TEXT,
				fieldName: "Budget",
				question: `*What is your budget for this project? (in USD, reply "quote" for a quote)*`,
			},
			{
				type: QuestionType.TEXT,
				fieldName: "Description",
				question: `*Please provide a detailed description of the service you need.*`,
				footer: "Max 1000 chars",
			},
			{
				type: QuestionType.TEXT,
				fieldName: "References",
				question: "*Do you have any references and examples for this project? (links, images, videos, etc.)*",
				max: 500,
				footer: "Max 500 chars",
			},
			{
				type: QuestionType.TEXT,
				fieldName: "Additional",
				question: "*Anything else you want to add?*",
				max: 500,
				footer: "Max 500 chars",
			},
		],
		applications: [
			{
				type: QuestionType.TEXT,
				fieldName: "Experience Length",
				question: "*How long have you been doing this (these)?*",
			},
			{
				type: QuestionType.TEXT,
				fieldName: "Portfolio",
				question: "*What is your portfolio link (if any)?*",
				footer: "Max 1000 chars",
			},
			{
				type: QuestionType.TEXT,
				fieldName: "Country & Timezone",
				question: "*Where are you from and what is your timezone?*",
				max: 500,
				footer: "Max 500 chars",
			},
			{
				type: QuestionType.TEXT,
				fieldName: "Languages",
				question: "*What languages do you speak? Rate your skills in each in a scale 1-10.*",
				max: 500,
				footer: "Max 500 chars",
			},
			{
				type: QuestionType.TEXT,
				fieldName: "Notes",
				question: "*Would you like to add anything else?*",
				max: 500,
				footer: "Max 500 chars",
			},
		],
	},
};
