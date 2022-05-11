"use strict"
const { createClient } = require("oicq")
const { log } = require("oicq/lib/common")
const { GuildApp } = require("./lib/index")

const account = Number(process.env.OICQ_GUILD_ACCOUNT)
const password = process.env.OICQ_GUILD_PASSWORD

const client = createClient(account, {
	log_level: "warn",
})
client.on("system.login.slider", function (e) {
	console.log("input ticket：")
	process.stdin.once("data", ticket => this.submitSlider(String(ticket).trim()))
}).on("system.login.device", function (e) {
	process.stdin.once("data", _ => this.login())
}).login(password)

const app = GuildApp.bind(client)

process.stdin.on("data", async (data) => {
	const cmd = String(data).trim()
	try {
		const res = await eval(cmd)
		console.log(res)
	} catch (e) {
		console.log(e)
	}
})
