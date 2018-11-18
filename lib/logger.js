const hasWindow = typeof window !== "undefined"
const streams = new Map()

export default options => {
  const { events, store } = options

  if (events.ops.has("logger")) {
    return options
  }

  events.onAny("logger", async ({ event }) => {
    if (event.props && event.props[0] === "event") {
      return
    }

    const eventArg = event.args
      ? event.args[0].event
      : undefined

    const out = eventArg
      ? eventToLog(eventArg)
      : event.args[0]

    if (!hasWindow) {
      const stream = await getStreamCache({
        event,
        keep: true,
        store,
      })

      stream.write(out.join("\t") + "\n\n")
    }
  })

  if (options.attach !== false) {
    events.onAny("before", async ({ event }) => {
      if (
        event.op !== "logger" &&
        (!event.props || event.props.indexOf("log") < 0)
      ) {
        await events.logger("any", { event })
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

  await store.set([...event.props, "log"], path)

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
    const options = JSON.stringify(
      event.args[0],
      null,
      1
    ).replace(/\n\s*/g, " ")

    msg.push(options)
  } else if (event.args) {
    msg.push(event.args[0])
  }

  return msg
}
