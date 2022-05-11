import { GuildApp } from "./app"
import { pb } from "oicq/lib/core"
import { Guild } from "./guild"
import { GuildMessage } from "./message"

export function onFirstView(this: GuildApp, payload: Buffer) {
	const proto = pb.decode(payload)
	if (!proto[3]) return
	if (!Array.isArray(proto[3])) proto[3] = [proto[3]]
	const tmp = new Set<string>()
	for (let p of proto[3]) {
		const id = String(p[1]), name = String(p[4])
		tmp.add(id)
		if (!this.guilds.has(id))
			this.guilds.set(id, new Guild(this, id))
		const guild = this.guilds.get(id)!
		guild._renew(name, p[3])
	}
	for (let [id, _] of this.guilds) {
		if (!tmp.has(id))
			this.guilds.delete(id)
	}
	this.client.logger.mark(`[Guild] 加载了${this.guilds.size}个频道`)
	this.emit("ready")
}

export function onGroupProMsg(this: GuildApp, payload: Buffer) {
	try {
		var msg = new GuildMessage(pb.decode(payload))
	} catch {
		return
	}
	this.client.logger.info(`[Guild: ${msg.guild_name}, Member: ${msg.sender.nickname}]` + msg.raw_message)
	const channel = this.guilds.get(msg.guild_id)?.channels.get(msg.channel_id)
	if (channel)
		msg.reply = channel.sendMessage.bind(channel)
	this.emit("message", msg)
}
