import { defineRegistry } from "@json-render/svelte";
import Card from "./blocks/Card.svelte";
import Chart from "./blocks/Chart.svelte";
import Metric from "./blocks/Metric.svelte";
import Row from "./blocks/Row.svelte";
import Table from "./blocks/Table.svelte";
import Text from "./blocks/Text.svelte";
import { catalog } from "./catalog";

/** The catalog's components, drawn by json-render's Renderer. */
export const { registry } = defineRegistry(catalog, {
  components: { Card, Row, Metric, Chart, Table, Text },
});
