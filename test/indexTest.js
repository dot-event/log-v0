import dotEvent from "dot-event"
import dotStore from "dot-store"
import log from "../dist/log"

test("log", async () => {
  const events = dotEvent()
  const store = dotStore(events)

  log({ events, store })

  await events.log("writeJson.test", ["hello"])
})
