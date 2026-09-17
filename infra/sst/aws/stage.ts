export const isPermanentStage = ["prod", "dev"].includes($app.stage);

export const baseDomain = "template.developing.company"

export const domain = (() => {
  if ($app.stage === "prod") return baseDomain
  if ($app.stage === "dev") return `dev.${baseDomain}`
  return `${$app.stage}.dev.${baseDomain}`
})()

export function subdomain(name: string) {
  if (isPermanentStage) return $interpolate`${name}.${domain}`;
  return $interpolate`${name}-${domain}`;
}
