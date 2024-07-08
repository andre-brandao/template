<script lang="ts">
  import { modal } from '.'
  import Modal from './base/Modal.svelte'
  import { toast } from 'svelte-sonner'

  interface Field {
    name: string
    value?: any
    label: string
    type:
      | 'text'
      | 'number'
      | 'email'
      | 'password'
      | 'textarea'
      | 'select'
      | 'checkbox'
    required?: boolean
    anotation?: string
    plaveholder?: string
  }

  type FieldTypeToType = {
    text: string
    number: number
    email: string
    password: string
    textarea: string
    select: string
    checkbox: boolean
  }

  type ToSaveType = {
    [K in Field['name']]: FieldTypeToType[Field['type']]
  }

  interface FormProps {
    fields: Field[]
    title: string
    save: (toSave: ToSaveType) => Promise<string | undefined>
  }

  let { fields, title, save }: FormProps = $props()

  let isLoading = $state(false)

  function handleCancel() {
    console.log('cancel')
  }
  async function handleConfirm() {
    console.log('confirm')

    try {
      const toSave: ToSaveType = fields.reduce((acc, field) => {
        acc[field.name] = field.value
        return acc
      }, {} as ToSaveType)

      isLoading = true
      const error = await save(toSave)

      if (!error) {
        modal.close()
      }
    } catch (error) {
      console.error(error)
      toast.error('Error saving data')
    } finally {
      isLoading = false
    }
  }
</script>

<Modal {title}>
  <div class="flex flex-col items-center gap-3">
    {#each fields as field, i (field.name)}
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">{field.label}</span>
          {#if !field.required}
            <span class="badge badge-info label-text-alt text-info-content">
              Optional
            </span>
          {/if}
        </div>
        {#if field.type === 'text'}
          <input
            type="text"
            placeholder={field.plaveholder}
            class="input input-bordered w-full max-w-xs"
            required={field.required}
            bind:value={field.value}
          />
        {:else if field.type === 'number'}
          <input
            type="number"
            class="input input-bordered"
            placeholder={field.plaveholder}
            required={field.required}
            bind:value={field.value}
          />
        {/if}
        {#if field.type === 'email'}
          <label class="input input-bordered flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="h-4 w-4 opacity-70"
            >
              <path
                d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"
              />
              <path
                d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"
              />
            </svg>
            <input
              type="text"
              class="grow"
              placeholder={field.plaveholder}
              required={field.required}
              bind:value={field.value}
            />
          </label>
        {/if}
        {#if field.type === 'password'}
          <!-- <input
            type="password"
            class="input input-bordered"
            placeholder="********"
            required={field.required}
            bind:value={field.value}
          /> -->

          <label class="input input-bordered flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="h-4 w-4 opacity-70"
            >
              <path
                fill-rule="evenodd"
                d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                clip-rule="evenodd"
              />
            </svg>
            <input
              type="password"
              class="grow"
              required={field.required}
              bind:value={field.value}
            />
          </label>
        {/if}
        {#if field.type === 'textarea'}
          <textarea
            class="textarea textarea-bordered"
            placeholder={field.plaveholder}
            required={field.required}
            bind:value={field.value}
          ></textarea>
        {/if}
        {#if field.type === 'checkbox'}
          <input
            class="checkbox"
            type="checkbox"
            required={field.required}
            bind:checked={field.value}
          />
        {/if}
        {#if field.anotation}
          <div class="label">
            <span class="label-text-alt">{field.anotation}</span>
          </div>
        {/if}
      </label>
    {/each}
  </div>

  <svelte:fragment slot="footer">
    <button class="btn" onclick={handleConfirm} disabled={isLoading}>
      {!isLoading ? 'Save' : 'Loading...'}
    </button>
    <button class="btn" onclick={handleCancel} disabled={isLoading}>
      Cancel
    </button>
  </svelte:fragment>
</Modal>
