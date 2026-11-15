import { FixedWindow as fixedWindow } from "./algo";
import type { FixedOptions as Fixed } from "./algo";
import { catalog as makeCatalog, subject as makeSubject } from "./catalog";
import type { Built } from "./catalog";
import { Exceeded as LimitExceeded } from "./error";
import type * as port from "./port";
import { Limits } from "./rules";

/** Central, typed rate-limit rules. Callers consume before doing protected work. */
export namespace Limit {
  export type Subject = port.Subject;
  export type Result = port.Result;
  export type Store = port.Store;
  export type Policy<Options> = port.Policy<Options>;
  export type Rule = port.Rule;
  export type Catalog<Tree> = Built<Tree>;

  export const subject = makeSubject;
  export const catalog = makeCatalog;

  export namespace Err {
    export type Exceeded = InstanceType<typeof LimitExceeded>;
    export const Exceeded = LimitExceeded;
  }

  export namespace Algo {
    export type Type<Options> = port.Algorithm<Options>;
    export type FixedOptions = Fixed;
    export const FixedWindow = fixedWindow;
  }
}

export { Limits };
