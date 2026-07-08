import { Context } from "./context"
import { Log } from "./util/log"

export namespace Actor {
  interface Public {
    type: "public"
    properties: {}
  }

  interface User {
    type: "user"
    properties: {
      userID: string
    }
  }

  export type Info = Public | User

  const ctx = Context.create<Info>()
  export const use = ctx.use

  const log = Log.create().tag("namespace", "actor")

  export function provide<R, T extends Info["type"]>(
    type: T,
    properties: Extract<Info, { type: T }>["properties"],
    cb: () => R,
  ) {
    return ctx.provide(
      {
        type,
        properties,
      } as any,
      () => {
        return Log.provide({ ...properties }, () => {
          log.info("provided")
          return cb()
        })
      },
    )
  }

  export function assert<T extends Info["type"]>(type: T) {
    const actor = use()
    if (actor.type !== type) {
      throw new Error(`Expected actor type ${type}, got ${actor.type}`)
    }
    return actor as Extract<Info, { type: T }>
  }

  export function userID() {
    return Actor.assert("user").properties.userID
  }
}
