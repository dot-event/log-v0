const hasWindow = typeof window !== "undefined"
const streams = new Map()

export default options => {
  const { events } = options

  if (events.ops.has("log")) {
    return options
  }

  events.onAny("log", async ({ event }) => {
    const props = event.props
      ? event.props.join(".")
      : undefined

    const eventArg = event.args
      ? event.args[0].event
      : undefined

    const out = eventArg
      ? eventToLog({ event: eventArg, props })
      : event.args[0]

    if (hasWindow) {
      // eslint-disable-next-line no-console
      console.log(...out)
    } else {
      const log = await writeStream(props)
      log.write(out.join("\t") + "\n\n")
    }
  })

  return options
}

async function writeStream(props) {
  if (hasWindow) {
    return
  }

  const cache = streams.get(props)

  if (cache) {
    return cache
  }

  const { path } = await require("tmp-promise").file({
    keep: true,
    postfix: ".log",
    prefix: "task-",
  })

  // eslint-disable-next-line no-console
  console.log(`Logging to ${path}`)

  const stream = require("fs").createWriteStream(path, {
    flags: "a",
  })

  streams.set(props, stream)

  return stream
}

function eventToLog({ event, props }) {
  const msg = [event.op]

  if (props) {
    msg.push(props)
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
}
