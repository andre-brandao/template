/** A claimed unit of work. `payload` is validated against the job's schema before it runs. */
export type Job = {
  id: string;
  name: string;
  payload: unknown;
  /** Actor captured at push time, restored around the handler. Null for public/system pushes. */
  userID: string | null;
  attempts: number;
};

export type Push = {
  name: string;
  payload: unknown;
  userID: string | null;
  /** Seconds to hold the job before it becomes runnable. */
  delay?: number;
};

/** Where jobs live between push and run. sync (inline), memory (in-process), db (postgres). */
export interface Port {
  push(job: Push): Promise<string>;
  /** Claims the next runnable job, or null when nothing is due. */
  reserve(): Promise<Job | null>;
  /** The job finished — drop it. */
  ack(job: Job): Promise<void>;
  /** Release for a retry, or bury the job once `retries` is exhausted. */
  fail(job: Job, err: Error): Promise<void>;
}

export type Config = {
  /** Attempts before a job is buried. Default 3. */
  retries?: number;
  /** Seconds to wait before a released job is runnable again. Default 0. */
  backoff?: number;
  /** Seconds a reserved job may run before another worker may reclaim it. Default 60. */
  timeout?: number;
};
