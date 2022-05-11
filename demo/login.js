"use strict"
const { createClient } = require("oicq")
const { GuildApp } = require("../lib/index")

const account = 0
const password = ""

const client = createClient(account)
client.on("system.login.slider", function (e) {
	console.log("input ticket：")
	process.stdin.once("data", ticket => this.submitSlider(String(ticket).trim()))
}).login(password)

const app = GuildApp.bind(client)

app.on("ready", function () {
	console.log("My guild list:")
	console.log(this.guilds)
})

app.on("message", e => {
	console.log(e)
	if (e.raw_message === "hello")
		e.reply(`Hello, ${e.sender.nickname}!`)
})
