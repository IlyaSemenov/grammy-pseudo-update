import { Chat } from "@grammyjs/types"
import { Bot, Composer, Context, MiddlewareFn } from "grammy"

/**
Pseudo update payload (ctx.pseudo, ctx.update.pseudo.payload)

Extend with:

```ts
declare module "grammy-pseudo-update" {
	interface PseudoUpdatePayload {
		myData?: {
			...
		}
	}
}
```
*/
export interface PseudoUpdatePayload {
	// Empty - for external augmentation
}

/** ctx.update.pseudo */
export interface PseudoUpdate {
	chat: Chat
	payload?: PseudoUpdatePayload
	middleware?: MiddlewareFn<any>
}

/** To be merged with Context */
export interface PseudoUpdateFlavor {
	readonly pseudo?: PseudoUpdatePayload
}

type PseudoUpdateArg = ({ chat_id: number } | { chat: Chat }) & {
	update_id?: number
	payload?: PseudoUpdatePayload
}

declare module "grammy" {
	interface Bot<C extends Context = Context> {
		handlePseudoUpdate(
			arg: PseudoUpdateArg,
			middleware?: MiddlewareFn<C>
		): Promise<void>
	}
	interface Composer<C extends Context> {
		pseudo(...middleware: MiddlewareFn<C>[]): Composer<C>
	}
	interface Context extends PseudoUpdateFlavor {}
}

declare module "@grammyjs/types" {
	interface Update {
		pseudo?: PseudoUpdate
	}
}

Bot.prototype.handlePseudoUpdate = async function <C extends Context>(
	this: Bot<C>,
	update: PseudoUpdateArg,
	middleware?: MiddlewareFn<C>
): Promise<void> {
	const chat =
		"chat" in update ? update.chat : await this.api.getChat(update.chat_id)
	return this.handleUpdate({
		update_id: update.update_id || 0,
		pseudo: { chat, payload: update.payload, middleware },
	})
}

/**
 *
 * Middleware to process ad-hoc pseudo updates.
 *
 * Usage:
 *
 * bot.use(pseudoUpdate)
 * ...
 * bot.handlePseudoUpdate({ chat_id }, ctx => ctx.reply("Update."))
 *
 * */
export const pseudoUpdate: MiddlewareFn = (ctx, next) => {
	const mw = ctx.update.pseudo?.middleware
	if (mw) {
		return mw(ctx, next)
	} else {
		return next()
	}
}

Composer.prototype.pseudo = function <C extends Context>(
	this: Composer<C>,
	...middleware: MiddlewareFn<C>[]
) {
	return this.filter((ctx) => !!ctx.update.pseudo, ...middleware)
}

const Context_chat_prop = Object.getOwnPropertyDescriptor(
	Context.prototype,
	"chat"
)

Object.defineProperty(Context.prototype, "chat", {
	...Context_chat_prop,
	get(this: Context) {
		return this.update.pseudo
			? this.update.pseudo.chat
			: Context_chat_prop?.get?.call(this)
	},
})

Object.defineProperty(Context.prototype, "pseudo", {
	get(this: Context) {
		return this.update.pseudo?.payload
	},
})
