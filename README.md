# grammy-pseudo-update

`grammy-pseudo-update` is a plugin for [grammY](https://grammy.dev/) that injects a manually generated `Update` object into grammy middleware stack, as if it were coming from Telegram.

This could be useful e.g. with [grammy-scenes](https://github.com/IlyaSemenov/grammy-scenes) when you want to move a scene with an externally generated event.

## Install

```
yarn add grammy-pseudo-update
```

## Use

```ts
// Monkey patch grammy.
import "grammy-pseudo-update"

import { Bot } from "grammy"

const bot = new Bot(process.env.BOT_TOKEN)

bot.pseudo(async (ctx) => {
	console.log(ctx.pseudo) // Payload.
	await ctx.reply(`Got pseudo update`)
})

some_external_event_listener((chat_id, payload) => {
	bot.handlePseudoUpdate({ chat_id, payload })
})

bot.start()
```
