<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  import { website } from '$lib/config'

  let activeStep = 0

  let steps = [{ name: 'Welcome' }, { name: 'Password' }, { name: 'Username' }]
</script>

{#snippet nextStep({ text = 'Next', disabled = false })}
  <button
    class="btn btn-primary"
    {disabled}
    onclick={() => {
      if (activeStep === steps.length - 1) {
        return
      }
      activeStep += 1
    }}
  >
    {text}
  </button>
{/snippet}

{#snippet prevStep({ text = 'Back', disabled = false })}
  <button
    class="btn btn-primary"
    {disabled}
    onclick={() => {
      if (activeStep === 0) {
        return
      }
      activeStep -= 1
    }}
  >
    {text}
  </button>
{/snippet}

<main class="container mx-auto flex h-full items-center justify-center">
  <div class="card flex h-1/2 flex-col bg-base-200 p-5 text-base">
    <ul class="steps rounded bg-base-100 p-2">
      {#each steps as step, index}
        <li
          class="step step-primary transition-all"
          class:step-primary={index <= activeStep}
        >
          {step.name}
        </li>
      {/each}
    </ul>

    <div class="mt-4 flex flex-col">
      {#if activeStep === 0}
        <h1>Welcome to {website.siteTitle}</h1>

        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sequi non
          aspernatur architecto corporis ipsum earum!
        </p>

        <div>
          {@render nextStep({})}
        </div>
      {:else if activeStep === 1}
        <h1>Step 2</h1>

        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sequi non
          aspernatur architecto corporis ipsum earum!
        </p>
        <div>
          {@render prevStep({})}
          {@render nextStep({})}
        </div>
      {:else}
        Finish onboarding
        <div>
          {@render prevStep({})}
          {@render nextStep({ text: 'Finish' })}
        </div>
      {/if}
    </div>
  </div>
</main>
