// One label below SST's `template.developing.company`, like terraform's `tf.`, so the
// stacks never contend for a hostname.
const base = "alc.template.developing.company";

export const permanent = (stage: string) => ["prod", "dev"].includes(stage);

export function host(name: string, stage: string) {
  if (stage === "prod") return `${name}.${base}`;
  if (stage === "dev") return `${name}.dev.${base}`;
  return `${name}.${stage}.dev.${base}`;
}
