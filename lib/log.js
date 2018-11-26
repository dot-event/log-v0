const hasWindow = typeof window !== "undefined"
const streams = new Map()

const ignoreOps = ["log", "setState"]

export default options => {
  const { events } = options

  if (events.ops.has("log")) {
    return options
  }

  events.onAny("log", async ({ event }) => {
    if (event.props[0] === "event") {
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
        events,
        keep: true,
      })

      stream.write(out.join("\t") + "\n\n")
    }
  })

  if (options.attach !== false) {
    events.onAny("before", async ({ event }) => {
      if (
        ignoreOps.indexOf(event.op) < 0 &&
        event.props.indexOf("log") < 0
      ) {
        await events.log("any", { event })
      }
    })
  }

  return options
}

async function getStreamCache({ event, events, keep }) {
  const props = event.props.join(".")
  const cache = streams.get(props)

  if (cache) {
    return cache
  }

  const promise = getStream({ event, events, keep })
  streams.set(props, promise)

  return promise
}

async function getStream({ event, events, keep }) {
  const { path } = await require("tmp-promise").file({
    keep,
    postfix: ".log",
  })

  await events.set([...event.props, "log"], path)

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

    if (typeof event.args[0] === "function") {
      msg.push("[Function]")
    } else if (typeof options === "string") {
      msg.push(options.replace(/\n\s*/g, " "))
    }
  } else if (event.args) {
    msg.push(event.args[0])
  }

  return msg
}
