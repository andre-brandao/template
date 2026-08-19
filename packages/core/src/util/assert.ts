import { VisibleError, ErrorCodes } from "../error";

export namespace Assert {
  /**
   * Assertions about one resource, so its name is written once per module.
   *
   * @param resource The noun a miss is reported under — `Todo not found`.
   */
  export function create(resource = "Resource") {
    return {
      /**
       * Narrows `null`/`undefined` away, from a lookup still in flight or a value in hand.
       *
       * @throws {VisibleError} `not_found`, which the API and the dashboard both serve as a 404.
       */
      exists: async <V>(v: V | Promise<V>) => {
        const value = await v;
        // Loose on purpose: `rows.at(0)` misses as `undefined`, a left join as `null`.
        if (value == null)
          throw new VisibleError(
            "not_found",
            ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
            `${resource} not found`,
          );
        return value as NonNullable<V>;
      },
    };
  }

  /** The unlabelled assertion, for a caller with no resource worth naming. */
  export const exists = create().exists;
}
