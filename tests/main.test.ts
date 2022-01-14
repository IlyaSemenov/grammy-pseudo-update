import "grammy-pseudo-update"

import { Chat } from "@grammyjs/types"
import { Bot } from "grammy"
import { PseudoUpdatePayload } from "grammy-pseudo-update"
import tap from "tap"

declare module "grammy-pseudo-update" {
	interface PseudoUpdatePayload {
		test?: true
	}
}

function init() {
	const bot = new Bot("invalid_token")
	bot.botInfo = {} as any
	const log: string[] = []
	bot.pseudo((ctx, next) => {
		log.push("mw")
		if (!ctx.pseudo?.test) {
			return next()
		}
	})
	return { bot, log }
}

const chat: Chat = { type: "private", id: 12345, first_name: "John" }
const payload: PseudoUpdatePayload = { test: true }

tap.test("simple", async (tap) => {
	const { bot, log } = init()
	await bot.handlePseudoUpdate({ chat })
	tap.same(log, ["mw"])
})

tap.test("simple with payload", async (tap) => {
	const { bot, log } = init()
	await bot.handlePseudoUpdate({ chat, payload })
	tap.same(log, ["mw"])
})

tap.test("final handler called when no payload", async (tap) => {
	const { bot, log } = init()
	await bot.handlePseudoUpdate({ chat }, () => {
		log.push("final")
	})
	tap.same(log, ["mw", "final"])
})

tap.test("final handler ignored when payload provided", async (tap) => {
	const { bot, log } = init()
	await bot.handlePseudoUpdate({ chat, payload }, () => {
		log.push("final")
	})
	tap.same(log, ["mw"])
})

tap.test("final handler ignored when payload provided", async (tap) => {
	const { bot, log } = init()
	await bot.handlePseudoUpdate({ chat }, () => {
		log.push("final")
	})
	await bot.handlePseudoUpdate({ chat })
	tap.same(log, ["mw", "final", "mw"])
})

tap.test("custom update_id", async (tap) => {
	const { bot } = init()
	const update_id = 4 // https://xkcd.com/221/
	await bot.handlePseudoUpdate({ chat, update_id }, (ctx) => {
		tap.same(ctx.update.update_id, update_id)
	})
})
