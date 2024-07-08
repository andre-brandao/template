<script lang="ts">
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
    validate?: (value: any) => boolean
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
    save: (toSave: ToSaveType) => Promise<void>
  }

  let { fields, title, save }: FormProps = $props()

  let isLoading = $state(false)

  function validateField(field: Field) {
    if (field.required && !field.value) {
      return false
    }

    if (field.validate) {
      return field.validate(field.value)
    }
    return true
  }

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
      await save(toSave)
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
            <span class="badge badge-info label-text-alt">Optional</span>
          {/if}
        </div>
        {#if field.type === 'text'}
          <input
            type="text"
            placeholder={field.plaveholder || field.name}
            class="input input-bordered w-full max-w-xs"
            required={field.required}
            bind:value={field.value}
          />
        {:else if field.type === 'number'}
          <input
            type="number"
            class="input input-bordered"
            placeholder={field.plaveholder || field.name}
            required={field.required}
            bind:value={field.value}
          />
        {/if}
        {#if field.type === 'email'}
          <input
            type="email"
            class="input input-bordered"
            placeholder={field.plaveholder || field.name}
            required={field.required}
            bind:value={field.value}
          />
        {/if}
        {#if field.type === 'password'}
          <input
            type="password"
            class="input input-bordered"
            placeholder="********"
            required={field.required}
            bind:value={field.value}
          />
        {/if}
        {#if field.type === 'textarea'}
          <textarea
            class="textarea textarea-bordered"
            placeholder={field.plaveholder || field.name}
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
            <span class="label-text-alt">Bottom Left label</span>
          </div>
        {/if}
      </label>
    {/each}
  </div>

  <svelte:fragment slot="footer">
    <button class="btn" onclick={handleConfirm}>Save</button>
    <button class="btn" onclick={handleCancel}>Cancel</button>
  </svelte:fragment>
</Modal>
