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
}

/** To be merged with Context */
export interface PseudoUpdateFlavor {
	readonly pseudo?: PseudoUpdatePayload
}

export type PseudoUpdateFlavoredContext<C extends Context = Context> = C &
	PseudoUpdateFlavor

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
		pseudo<C2 extends PseudoUpdateFlavoredContext<C>>(
			handler: MiddlewareFn<C2>
		): Composer<C2>
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
	const thisAsAny = this as any
	const thisHandler = thisAsAny.handler
	if (middleware) {
		// Oy vey!
		// Patch this.handler so that this.middleware() inside handleUpdate calls us
		thisAsAny.handler = new Composer(thisHandler, middleware).middleware()
	}
	return this.handleUpdate({
		update_id: update.update_id || 0,
		pseudo: { chat, payload: update.payload },
	}).finally(() => {
		if (middleware) {
			// Restore this.handler
			thisAsAny.handler = thisHandler
		}
	})
}

// FIXME: replace `any` with C/C2 from the interface declaration
Composer.prototype.pseudo = function (
	this: Composer<any>,
	handler: MiddlewareFn<any>
) {
	return this.use((ctx, next) =>
		ctx.update.pseudo ? handler(ctx, next) : next()
	)
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
