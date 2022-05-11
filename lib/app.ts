import EventEmitter from "events"
import { Client, ApiRejection } from "oicq"
import { pb } from "oicq/lib/core"
import { lock, NOOP, log } from "oicq/lib/common"
import { onFirstView, onGroupProMsg } from "./internal"
import { Guild } from "./guild"
import { GuildMessage } from "./message"

declare module "oicq" {
	export interface Client {
		sendOidbSvcTrpcTcp: (cmd: string, body: Uint8Array) => Promise<pb.Proto>
	}
}

Client.prototype.sendOidbSvcTrpcTcp = async function (cmd: string, body: Uint8Array) {
	const sp = cmd //OidbSvcTrpcTcp.0xf5b_1
		.replace("OidbSvcTrpcTcp.", "")
		.split("_");
	const type1 = parseInt(sp[0], 16), type2 = parseInt(sp[1]);
	body = pb.encode({
		1: type1,
		2: type2,
		4: body,
		6: "android " + this.apk.ver,
	})
	const payload = await this.sendUni(cmd, body)
	log(payload)
	const rsp = pb.decode(payload)
	if (rsp[3] === 0) return rsp[4]
	throw new ApiRejection(rsp[3], rsp[5])
}

export interface GuildApp {
	on(event: "ready", listener: (this: this) => void): this;
	on(event: "message", listener: (this: this, e: GuildMessage) => void): this;
	once(event: "ready", listener: (this: this) => void): this;
	once(event: "message", listener: (this: this, e: GuildMessage) => void): this;
	off(event: "ready", listener: (this: this) => void): this;
	off(event: "message", listener: (this: this, e: GuildMessage) => void): this;
}

/** 获取应用程序入口 */
export class GuildApp extends EventEmitter {

	protected readonly c: Client

	/** 我的频道id */
	tiny_id = ""

	/** 我加入的频道列表 */
	guilds = new Map<string, Guild>()

	/** 获得所属的客户端对象 */
	get client() {
		return this.c
	}

	protected constructor(client: Client) {
		super()
		client.on("internal.sso", (cmd: string, payload: Buffer) => {
			if (cmd === "trpc.group_pro.synclogic.SyncLogic.PushFirstView")
				onFirstView.call(this, payload)
			else if (cmd === "MsgPush.PushGroupProMsg")
				onGroupProMsg.call(this, payload)
		})
		client.on("system.online", _ => this.tiny_id = client.tiny_id)
		this.c = client
		lock(this, "c")
	}

	/** 绑定QQ客户端 */
	static bind(client: Client) {
		return new GuildApp(client)
	}

	/** 重新加载频道列表 */
	reloadGuilds(): Promise<void> {
		this.c.sendUni("trpc.group_pro.synclogic.SyncLogic.SyncFirstView", pb.encode({ 1: 0, 2: 0, 3: 0 })).then(payload => {
			this.tiny_id = String(pb.decode(payload)[6])
		}).catch(NOOP)
		return new Promise((resolve, reject) => {
			const id = setTimeout(reject, 5000)
			this.once("ready", () => {
				clearTimeout(id)
				resolve()
			})
		})
	}
}
