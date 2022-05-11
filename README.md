# oicq-guild

[oicq](https://github.com/takayama-lily/oicq) guild plugin

**Install:**

```bash
npm i oicq-guild
```

**Usage:**

```js
const { createClient } = require("oicq")
const { GuildApp } = require("oicq-guild")

// input with your account and password
const account = 0
const password = ""

// create oicq client
const client = createClient(account)
client.login(password)

// create guild app and bind it to an oicq client
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
```

**how to clear the slider captcha:**

<https://github.com/takayama-lily/oicq/wiki/01.使用密码登录-(滑动验证码教程)>
