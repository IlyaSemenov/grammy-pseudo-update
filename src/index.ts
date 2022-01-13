import { Chat } from "@grammyjs/types"
import { Bot, Composer, Context, MiddlewareFn } from "grammy"

declare module "grammy" {
	interface Bot {
		handlePseudoUpdate(args: PseudoUpdateArg): Promise<void>
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

export interface PseudoUpdate {
	chat: Chat
	payload: PseudoUpdatePayload
}

/**
Pseudo update payload

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

export interface PseudoUpdateFlavor {
	readonly pseudo?: PseudoUpdatePayload
}

export type PseudoUpdateFlavoredContext<C extends Context = Context> = C &
	PseudoUpdateFlavor

type PseudoUpdateArg = ({ chat_id: number } | { chat: Chat }) & {
	payload: PseudoUpdatePayload
}

Bot.prototype.handlePseudoUpdate = async function (
	this: Bot,
	update: PseudoUpdateArg
): Promise<void> {
	const chat =
		"chat" in update ? update.chat : await this.api.getChat(update.chat_id)
	return this.handleUpdate({
		update_id: 0,
		pseudo: { chat, payload: update.payload },
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
