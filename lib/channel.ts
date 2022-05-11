import { randomBytes } from "crypto"
import { pb } from "oicq/lib/core"
import { lock } from "oicq/lib/common"
import { Sendable, Converter } from "oicq/lib/message"
import { ApiRejection } from "oicq"
import { Guild } from "./guild"

export enum NotifyType {
	Unknown = 0,
	AllMessages = 1,
	Nothing = 2,
}

export enum ChannelType {
	Unknown = 0,
	Text = 1,
	Voice = 2,
	Live = 5,
	App = 6,
	Forum = 7,
}

export class Channel {

	channel_name = ""
	channel_type = ChannelType.Unknown
	notify_type = NotifyType.Unknown

	constructor(public readonly guild: Guild, public readonly channel_id: string) {
		lock(this, "guild")
		lock(this, "channel_id")
	}

	_renew(channel_name: string, notify_type: NotifyType, channel_type: ChannelType) {
		this.channel_name = channel_name
		this.notify_type = notify_type
		this.channel_type = channel_type
	}

	/**
	 * 发送频道消息
	 * 暂时仅支持发送： 文本、AT、表情
	 */
	async sendMessage(content: Sendable): Promise<{ seq: number, rand: number, time: number}> {
		const payload = await this.guild.app.client.sendUni("MsgProxy.SendMsg", pb.encode({
			1: {
				1: {
					1: {
						1: BigInt(this.guild.guild_id),
						2: Number(this.channel_id),
						3: this.guild.app.client.uin
					},
					2: {
						1: 3840,
						3: randomBytes(4).readUInt32BE()
					}
				},
				3: {
					1: new Converter(content).rich
				}
			}
		}))
		const rsp = pb.decode(payload)
		if (rsp[1])
			throw new ApiRejection(rsp[1], rsp[2])
		return {
			seq: rsp[4][2][4],
			rand: rsp[4][2][3],
			time: rsp[4][2][6],
		}
	}

	/** 撤回频道消息 */
	async recallMessage(seq: number): Promise<boolean> {
		const body = pb.encode({
			1: BigInt(this.guild.guild_id),
			2: Number(this.channel_id),
			3: Number(seq)
		})
		await this.guild.app.client.sendOidbSvcTrpcTcp("OidbSvcTrpcTcp.0xf5e_1", body)
		return true
	}
}
