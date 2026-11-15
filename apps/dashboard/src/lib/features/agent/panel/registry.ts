import { defineRegistry } from "@json-render/svelte";
import Card from "../render/blocks/Card.svelte";
import Chart from "./blocks/Chart.svelte";
import Metric from "./blocks/Metric.svelte";
import Row from "../render/blocks/Row.svelte";
import Table from "./blocks/Table.svelte";
import Text from "../render/blocks/Text.svelte";
import { catalog } from "./catalog";

/** The catalog's components, drawn by json-render's Renderer. */
export const { registry } = defineRegistry(catalog, {
  components: { Card, Row, Metric, Chart, Table, Text },
});
