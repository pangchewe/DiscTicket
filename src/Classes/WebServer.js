const express = require("express");
const cors = require("cors");
const app = express();
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");

function checkAuth(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/");
}

module.exports = class WebServer {
	constructor(client) {
		this.client = client;
		this.createPassport();
		this.run();
	}

	run() {
		app.use(cors());
		app.use(express.json());

		app.get("/", (req, res) => {
			res.send("Hello World!");
		});

		app.get("/api/invoice/:id", async (req, res) => {
			const invoice = await this.client.db.Invoice.findOne({ id: req.params.id });
			if (!invoice) return res.status(404).json({ ok: false, message: "Invoice not found" });
			res.json({ ok: true, data: { invoice } });
		});

		app.listen(this.client.config.web.port, () => {
			console.log(`Web server is listening on port http://localhost:${this.client.config.web.port}`);
		});
	}

	createPassport() {
		app.use(
			session({
				secret: this.client.config.web.sessionSecret,
				resave: false,
				saveUninitialized: true,
			})
		);

		app.use(passport.initialize());
		app.use(passport.session());

		passport.serializeUser((user, done) => {
			done(null, user);
		});

		passport.deserializeUser((obj, done) => {
			done(null, obj);
		});

		passport.use(
			new DiscordStrategy(
				{
					clientID: this.client.config.web.oauth.clientID,
					clientSecret: this.client.config.web.oauth.clientSecret,
					callbackURL: this.client.config.web.oauth.callbackURL,
					scope: ["identify", "guilds"],
				},
				(accessToken, refreshToken, profile, done) => {
					return done(null, profile);
				}
			)
		);

		app.get("/auth", passport.authenticate("discord"));
		app.get("/auth/callback", passport.authenticate("discord", { failureRedirect: "/" }), (req, res) => {
			res.redirect("/");
		});

		app.get("/api/user", (req, res) => {
			if (!req.user) return res.status(401).json({ ok: false, message: "Not logged in" });
			res.json({ ok: true, data: { user: req.user } });
		});

		app.get("/api/logout", (req, res) => {
			req.logout();
			res.redirect("/");
		});
	}
};
