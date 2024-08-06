<script lang="ts">
  export let value: number = 0

  // let amountFormatted = '0.00'
  let amountFormatted = (value / 100).toFixed(2)
  let currencyInput: HTMLInputElement
  // $: console.log('amountFormatted: ' + amountFormatted)

  const handleChange = () => {
    // console.log('currentInput: ' + currencyInput.value)

    let cleanedInput = currencyInput.value
      .replace(/\D*/gm, '') // remove non digits
      .replace(/^0+/gm, '') // remove leading zeros
    // console.log('cleanedInput.length: ' + cleanedInput.length)

    if (cleanedInput.length === 0) {
      console.log('setting amountFormatted to 0.00 --- BUT IT does not work ')
      amountFormatted = '0.00' // ERROR this never works
    } else {
      amountFormatted = (parseInt(cleanedInput, 10) / 100).toString()
    }
    value = Number(amountFormatted.replace('.', ''))
  }
</script>

<label class="input input-bordered flex items-center gap-2">
  R$
  <input
    type="tel"
    class=" w-28"
    value={amountFormatted}
    bind:this={currencyInput}
    on:input={handleChange}
    on:change
  />
</label>
