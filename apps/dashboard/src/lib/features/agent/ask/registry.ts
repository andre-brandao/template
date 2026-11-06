import { defineRegistry } from "@json-render/svelte";
import Card from "../panel/blocks/Card.svelte";
import Row from "../panel/blocks/Row.svelte";
import Text from "../panel/blocks/Text.svelte";
import Choice from "./blocks/Choice.svelte";
import Confirm from "./blocks/Confirm.svelte";
import DateField from "./blocks/DateField.svelte";
import Form from "./blocks/Form.svelte";
import MultiChoice from "./blocks/MultiChoice.svelte";
import NumberField from "./blocks/NumberField.svelte";
import TextField from "./blocks/TextField.svelte";
import { catalog } from "./catalog";

/** The `ask` catalog's components; Card, Row and Text are the panel's own. */
export const { registry } = defineRegistry(catalog, {
  components: {
    Form,
    Card,
    Row,
    Text,
    Choice,
    MultiChoice,
    TextField,
    NumberField,
    DateField,
    Confirm,
  },
});
