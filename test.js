"use strict"
const { createClient } = require("oicq")
const { log } = require("oicq/lib/common")

const account = 0
const password = "******"

const client = createClient(account, {
	log_level: "warn",
})
client.on("system.login.slider", function (e) {
	console.log("input ticket：")
	process.stdin.once("data", ticket => this.submitSlider(String(ticket).trim()))
}).on("system.login.device", function (e) {
	process.stdin.once("data", _ => this.login())
}).login(password)

const known = [
	"OnlinePush.PbPushGroupMsg",
	"OnlinePush.PbPushDisMsg",
	"OnlinePush.ReqPush",
	"OnlinePush.PbPushTransMsg",
	"OnlinePush.PbC2CMsgSync",
	"MessageSvc.PushNotify",
	"MessageSvc.PushReaded",
	"ConfigPushSvc.PushDomain",
	"ConfigPushSvc.PushReq",
	"QualityTest.PushList",
]

client.on("internal.sso", function (cmd, payload) {
	if (known.includes(cmd)) return
	console.log("received:", cmd)
	log(payload)
	console.log("")
})
