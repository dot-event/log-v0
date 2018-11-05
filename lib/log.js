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
      const stream = await getStreamCache({
        event,
        keep,
        store,
      })
      stream.write(out.join("\t") + "\n\n")
    }
  })

  if (options.attach !== false) {
    events.onAny("before", async ({ event }) => {
      if (event.op !== "log") {
        await events.log("any", { event })
      }
    })
  }

  return options
}

async function getStreamCache({ event, keep, store }) {
  const props = event.props.join(".")
  const cache = streams.get(props)

  if (cache) {
    return cache
  }

  const promise = getStream({ event, keep, store })
  streams.set(props, promise)

  return promise
}

async function getStream({ event, keep, store }) {
  const { path } = await require("tmp-promise").file({
    keep,
    postfix: ".log",
  })

  await store.set(["log", ...event.props, "path"], path)

  // eslint-disable-next-line no-console
  console.log(`\n📝 Logging to ${path}\n`)

  return require("fs").createWriteStream(path, {
    flags: "a",
  })
}

function eventToLog(event) {
  const msg = [event.op]

  if (event.props) {
    msg.push(event.props.join("."))
  }

  if (!hasWindow && event.args) {
    const options = JSON.stringify(event.args[0], null, 1)
      .replace(/\n /g, " ")
      .replace(/\n/g, " ")

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
