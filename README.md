# grammy-pseudo-update

`grammy-pseudo-update` is a plugin for [grammY](https://grammy.dev/) that injects a manually generated `Update` object into grammy middleware stack, as if it were coming from Telegram.

This could be useful e.g. with [grammy-scenes](https://github.com/IlyaSemenov/grammy-scenes) when you want to move a scene with an externally generated event.

## Install

```
yarn add grammy-pseudo-update
```

## Use

### With composer middleware

```ts
// Monkey patch grammy.
import "grammy-pseudo-update"

import { Bot } from "grammy"

const bot = new Bot(process.env.BOT_TOKEN)

bot.pseudo(async (ctx, next) => {
	// Access payload with ctx.pseudo or ctx.update.pseudo.payload
	await ctx.reply(`External event occured: ${ctx.pseudo}`)
})

some_external_event_listener((chat_id, payload) => {
	bot.handlePseudoUpdate({ chat_id, payload })
})

bot.start()
```

### With ad-hoc middleware

```ts
// Monkey patch grammy.
import "grammy-pseudo-update"

import { Bot } from "grammy"

const bot = new Bot(process.env.BOT_TOKEN)

some_external_event_listener((chat_id, payload) => {
	bot.handlePseudoUpdate({ chat_id }, (ctx) => {
		// Note: this will only be called if no other middleware handles the update
		await ctx.reply(`External event occured: ${payload}`)
	})
})

bot.start()
```

### Typescript

Augment the payload interface:

```ts
declare module "grammy-pseudo-update" {
	interface PseudoUpdatePayload {
		foo?: FooData
	}
}
```

Note that it is marked as interface (not type) so that multiple plugins could use the same payload type/data object with their dedicated keys.
