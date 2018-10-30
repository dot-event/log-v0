const hasWindow = typeof window !== "undefined"
const streams = new Map()

export default options => {
  const { events, keep = true, store } = options

  if (events.ops.has("log")) {
    return options
  }

  events.onAny("log", async ({ event }) => {
    const eventArg = event.args
      ? event.args[0].event
      : undefined

    if (
      eventArg &&
      eventArg.props &&
      eventArg.props[0] === "log"
    ) {
      return
    }

    const out = eventArg
      ? eventToLog(eventArg)
      : event.args[0]

    if (hasWindow) {
      // eslint-disable-next-line no-console
      console.log(...out)
    } else {
      const log = await writeStream({
        event,
        keep,
        store,
      })
      log.write(out.join("\t") + "\n\n")
    }
  })

  return options
}

async function writeStream({ event, keep, store }) {
  if (hasWindow) {
    return
  }

  const props = event.props.join(".")
  const cache = streams.get(props)

  if (cache) {
    return cache
  }

  const { path } = await require("tmp-promise").file({
    keep,
    postfix: ".log",
    prefix: "task-",
  })

  await store.set(["log", ...event.props, "path"], path)

  // eslint-disable-next-line no-console
  console.log(`Logging to ${path}`)

  const stream = require("fs").createWriteStream(path, {
    flags: "a",
  })

  streams.set(props, stream)

  return stream
}

function eventToLog(event) {
  const msg = [event.op]

  if (event.props) {
    msg.push(event.props.join("."))
  }

  if (!hasWindow && event.args) {
    const options = JSON.stringify(event.args[0])

    if (options.length < 256) {
      msg.push(options)
    } else {
      msg.push(
        `{ ${Object.keys(event.args[0]).join(", ")} }`
      )
    }
  } else if (event.args) {
    msg.push(event.args[0])
  }

  return msg
}
