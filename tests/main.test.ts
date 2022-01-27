import "grammy-pseudo-update"

import { Chat } from "@grammyjs/types"
import { Bot, Context } from "grammy"
import { pseudoUpdate, PseudoUpdatePayload } from "grammy-pseudo-update"
import tap from "tap"

declare module "grammy-pseudo-update" {
	interface PseudoUpdatePayload {
		test?: string
	}
}

class TestBot<C extends Context = Context> extends Bot<C> {
	constructor() {
		super("invalid_token")
		this.botInfo = {} as any
	}
}

const chat: Chat = { type: "private", id: 12345, first_name: "John" }
const payload: PseudoUpdatePayload = { test: "hello" }

tap.test("simple", async (tap) => {
	const bot = new TestBot()
	const log: string[] = []
	bot.pseudo((ctx) => {
		log.push(`mw: ${ctx.pseudo?.test}`)
	})
	await bot.handlePseudoUpdate({ chat, payload })
	tap.same(log, ["mw: hello"])
})

tap.test("middleware flow", async (tap) => {
	const bot = new TestBot()
	const log: string[] = []
	bot.pseudo((ctx, next) => {
		log.push(`mw1: ${ctx.pseudo?.test}`)
		return next()
	})
	bot.pseudo((ctx) => {
		log.push(`mw2: ${ctx.pseudo?.test}`)
	})
	bot.pseudo((ctx) => {
		log.push(`mw3: ${ctx.pseudo?.test}`)
	})
	await bot.handlePseudoUpdate({ chat, payload })
	tap.same(log, ["mw1: hello", "mw2: hello"])
})

tap.test("multiple handlers", async (tap) => {
	const bot = new TestBot()
	const log: string[] = []
	bot.pseudo(
		(ctx, next) => {
			log.push(`mw1: ${ctx.pseudo?.test}`)
			return next()
		},
		(ctx, next) => {
			log.push(`mw2: ${ctx.pseudo?.test}`)
			return next()
		}
	)
	bot.pseudo().use((ctx, next) => {
		log.push(`mw3: ${ctx.pseudo?.test}`)
		return next()
	})
	bot.pseudo().use((ctx) => {
		log.push(`mw4: ${ctx.pseudo?.test}`)
	})
	bot.pseudo().use((ctx) => {
		log.push(`mw5: ${ctx.pseudo?.test}`)
	})
	await bot.handlePseudoUpdate({ chat, payload })
	tap.same(log, ["mw1: hello", "mw2: hello", "mw3: hello", "mw4: hello"])
})

tap.test("custom update_id", async (tap) => {
	const bot = new TestBot()
	const update_id = 4 // https://xkcd.com/221/
	await bot.handlePseudoUpdate({ chat, update_id }, (ctx) => {
		tap.same(ctx.update.update_id, update_id)
	})
})

tap.test("ad-hoc handler", async (tap) => {
	function init() {
		const bot = new TestBot<Context & { foo: string }>()
		const log: string[] = []
		bot.use((ctx, next) => {
			ctx.foo = "a"
			return next()
		})
		bot.pseudo((ctx, next) => {
			log.push(`mw1: ${ctx.foo} ${ctx.pseudo?.test}`)
			return next()
		})
		bot.use(pseudoUpdate)
		bot.use((ctx, next) => {
			ctx.foo = "b"
			return next()
		})
		bot.pseudo((ctx, next) => {
			log.push(`mw2: ${ctx.foo} ${ctx.pseudo?.test}`)
			return next()
		})
		return { bot, log }
	}
	tap.test("with ad-hoc middleware", async (tap) => {
		const { bot, log } = init()
		await bot.handlePseudoUpdate({ chat, payload }, (ctx) => {
			log.push(`ad-hoc: ${ctx.foo}`)
		})
		tap.same(log, ["mw1: a hello", "ad-hoc: a"])
	})
	tap.test("without ad-hoc middleware", async (tap) => {
		const { bot, log } = init()
		await bot.handlePseudoUpdate({ chat, payload })
		tap.same(log, ["mw1: a hello", "mw2: b hello"])
	})
})
