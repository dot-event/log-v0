import dotEvent from "dot-event"
import dotStore from "dot-store"
import { readFile } from "fs-extra"
import log from "../dist/log"

test("logs text", async () => {
  const events = dotEvent()
  const store = dotStore(events)

  log({ events, keep: false, store })

  await events.log("test", ["hello"])
  const out = await readFile(store.get("log.test.path"))

  expect(out.toString()).toMatch(/hello/)
})

test("logs events", async () => {
  const events = dotEvent()
  const store = dotStore(events)

  log({ events, keep: false, store })

  events.onAny(async ({ event }) => {
    if (event.op !== "log") {
      await events.log("any", { event })
    }
  })

  await events.emit("hello", "world")
  const out = await readFile(store.get("log.any.path"))

  expect(out.toString()).toMatch(/emit\thello\t"world"/)
})
