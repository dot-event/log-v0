// Packages
import dotEvent from "dot-event"
import dotStore from "@dot-event/store"
import { readFile } from "fs-extra"

// Helpers
import dotLog from "../"

// Tests
test("logs text", async () => {
  const events = dotEvent()

  dotLog({ events })
  dotStore({ events })

  await events.log("test", ["hello"])
  const out = await readFile(events.get("test.log"))

  expect(out.toString()).toMatch(/hello/)
})

test("logs events", async () => {
  const events = dotEvent()

  dotLog({ events })
  dotStore({ events })

  await events.emit("hello", "world")
  const out = await readFile(events.get("any.log"))

  expect(out.toString()).toMatch(/emit\thello\t"world"/)
})
