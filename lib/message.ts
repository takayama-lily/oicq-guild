import { MessageElem, ApiRejection } from "oicq"
import { pb } from "oicq/lib/core"
import { parse, Sendable } from "oicq/lib/message"
import { lock } from "oicq/lib/common"

export class GuildMessage {
	/** 频道id */
	guild_id: string
	guild_name: string
	/** 子频道id */
	channel_id: string
	channel_name: string
	/** 消息序号(同一子频道中一般顺序递增) */
	seq: number
	rand: number
	time: number
	message: MessageElem[]
	raw_message: string
	sender: {
		tiny_id: string
		nickname: string
	}

	constructor(proto: pb.Proto) {
		const head1 = proto[1][1][1]
		const head2 = proto[1][1][2]
		if (head2[1] !== 3840)
			throw new Error("unsupport guild message type")
		const body = proto[1][3]
		const extra = proto[1][4]
		this.guild_id = String(head1[1])
		this.channel_id = String(head1[2])
		this.guild_name = String(extra[2])
		this.channel_name = String(extra[3])
		this.sender = {
			tiny_id: String(head1[4]),
			nickname: String(extra[1])
		}
		this.seq = head2[4]
		this.rand = head2[3]
		this.time = head2[6]
		const parsed = parse(body[1])
		this.message = parsed.message
		this.raw_message = parsed.brief
		lock(this, "proto")
	}

	/** 暂时仅支持发送： 文本、AT、表情 */
	async reply(content: Sendable): Promise<{ seq: number, rand: number, time: number }> {
		throw new ApiRejection(-999999, "no channel")
	}
}
