export const EXAMPLE_SECRET = new sst.Secret("EXAMPLE_SECRET", "");

export const environment = {
  NO_COLOR: $app.stage === "prod" ? "1" : "",
  EXAMPLE_SECRET: EXAMPLE_SECRET.value,
};
