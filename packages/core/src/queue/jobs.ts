/**
 * Jobs are defined next to the module that pushes them; importing them here gives a
 * process running `Queue.work()` one module to import for every handler to resolve.
 * Push with `jobs.email.push({ ... })`.
 */
export { job as email } from "../email/adapter/queue";
