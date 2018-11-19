import dotEvent from "dot-event"
import dotStore from "@dot-event/store"
import { readFile } from "fs-extra"

import dotLog from "../dist/log"

test("logs text", async () => {
  const events = dotEvent()
  const store = dotStore({ events })

  dotLog({ events, store })

  await events.log("test", ["hello"])
  const out = await readFile(store.get("test.log"))

  expect(out.toString()).toMatch(/hello/)
})

test("logs events", async () => {
  const events = dotEvent()
  const store = dotStore({ events })

  dotLog({ events, store })

  await events.emit("hello", "world")
  const out = await readFile(store.get("any.log"))

  expect(out.toString()).toMatch(/emit\thello\t"world"/)
})
