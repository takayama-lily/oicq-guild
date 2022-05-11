import { pb } from "oicq/lib/core"
import { lock } from "oicq/lib/common"
import { GuildApp } from "./app"
import { Channel} from "./channel"

export enum GuildRole {
	Member = 1,
	GuildAdmin = 2,
	Owner = 4,
	ChannelAdmin = 5,
}

export interface GuildMember {
	tiny_id: string
	card: string
	nickname: string
	role: GuildRole
	join_time: number
}

const members4buf = pb.encode({
	1: 1,
	2: 1,
	3: 1,
	4: 1,
	5: 1,
	6: 1,
	7: 1,
	8: 1,
})

export class Guild {

	guild_name = ""
	channels = new Map<string, Channel>()

	constructor(public readonly app: GuildApp, public readonly guild_id: string) {
		lock(this, "app")
		lock(this, "guild_id")
	}

	_renew(guild_name: string, proto: pb.Proto | pb.Proto[]) {
		this.guild_name = guild_name
		if (!Array.isArray(proto))
			proto = [proto]
		const tmp = new Set<string>()
		for (const p of proto) {
			const id = String(p[1]), name = String(p[8]),
				notify_type = p[7], channel_type = p[9]
			tmp.add(id)
			if (!this.channels.has(id))
				this.channels.set(id, new Channel(this, id))
			const channel = this.channels.get(id)!
			channel._renew(name, notify_type, channel_type)
		}
		for (let [id, _] of this.channels) {
			if (!tmp.has(id))
				this.channels.delete(id)
		}
	}

	/** 获取频道成员列表 */
	async getMemberList() {
		let index = 0 // todo member count over 500
		const body = pb.encode({
			1: BigInt(this.guild_id),
			2: 3,
			3: 0,
			4: members4buf,
			6: index,
			8: 500,
			14: 2,
		})
		const rsp = await this.app.client.sendOidbSvcTrpcTcp("OidbSvcTrpcTcp.0xf5b_1", body)
		const list: GuildMember[] = []
		const members = Array.isArray(rsp[5]) ? rsp[5] : [rsp[5]]
		const admins = Array.isArray(rsp[25]) ? rsp[25] : [rsp[25]]
		for (const p of admins) {
			const role = p[1] as GuildRole
			const m = Array.isArray(p[2]) ? p[2] : [p[2]]
			for (const p2 of m) {
				list.push({
					tiny_id: String(p2[8]),
					card: String(p2[2]),
					nickname: String(p2[3]),
					role,
					join_time: p2[4],
				})
			}
			
		}
		for (const p of members) {
			list.push({
				tiny_id: String(p[8]),
				card: String(p[2]),
				nickname: String(p[3]),
				role: GuildRole.Member,
				join_time: p[4],
			})
		}
		return list
	}
}
