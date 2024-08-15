<script lang="ts" generics="Item">
  import { modal } from '.'
  import Modal from './base/Modal.svelte'
  import { toast } from 'svelte-sonner'

  import { type Component, type ComponentProps } from 'svelte'
  import CurrencyInput from '../input/CurrencyInput.svelte'

  interface Field<
    T = any,
    C extends Component<any, object> = Component<any, object>,
  > {
    name: keyof T
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
      | 'component'
      | 'currency'
    component?: {
      ref: C
      props: ComponentProps<C>
    }
    required?: boolean
    annotation?: string
    placeholder?: string
    validate?: (value: any) => { valid: boolean; message: string }
  }

  interface FormProps<T> {
    fields: Field<T>[]
    title: string
    save: (toSave: T) => Promise<string | undefined>
  }

  let { fields, title, save }: FormProps<Item> = $props()

  let isLoading = $state(false)

  let erros = $state<Record<keyof Item, string>>()

  function handleCancel() {
    console.log('cancel')
    modal.close()
  }

  async function handleConfirm() {
    console.log('confirm')

    erros = fields.reduce(
      (acc, field) => {
        if (field.validate) {
          const { valid, message } = field.validate(field.value)
          if (!valid) {
            acc[field.name] = message
          }
        } else if (field.required && !field.value) {
          acc[field.name] = 'Required'
        }
        return acc
      },
      {} as Record<keyof Item, string>,
    )
    console.log(erros)

    if (Object.keys(erros).length) {
      return
    }

    try {
      const toSave = fields.reduce((acc, field) => {
        acc[field.name] = field.value
        return acc
      }, {} as Item)

      isLoading = true
      const error = await save(toSave)

      if (!error) {
        modal.close()
      } else {
        toast.error(error)
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
    {#each fields as field (field.name)}
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">{field.label}</span>
          {#if !field.required && field.type !== 'checkbox'}
            <span class="badge badge-info label-text-alt text-info-content">
              Optional
            </span>
          {/if}

          {#if field.type === 'checkbox'}
            <input
              class="checkbox"
              type="checkbox"
              required={field.required}
              bind:checked={field.value}
            />
          {:else if field.type === 'currency'}
            <CurrencyInput bind:value={field.value} />
          {/if}
        </div>
        {#if field.type === 'text'}
          <input
            type="text"
            placeholder={field.placeholder}
            class="input input-bordered w-full max-w-xs"
            required={field.required}
            bind:value={field.value}
          />
        {:else if field.type === 'number'}
          <input
            type="number"
            class="input input-bordered"
            placeholder={field.placeholder}
            required={field.required}
            bind:value={field.value}
          />
        {:else if field.type === 'email'}
          <input
            type="email"
            class="input input-bordered w-full max-w-xs"
            placeholder={field.placeholder}
            required={field.required}
            bind:value={field.value}
          />
        {:else if field.type === 'password'}
          <input
            type="password"
            class="input input-bordered"
            placeholder={field.placeholder}
            required={field.required}
            bind:value={field.value}
          />
        {:else if field.type === 'textarea'}
          <textarea
            class="textarea textarea-bordered"
            placeholder={field.placeholder}
            required={field.required}
            bind:value={field.value}
          ></textarea>
        {:else if field.type === 'component' && field.component}
          <svelte:component
            this={field.component.ref}
            bind:value={field.value}
            {...field.component.props}
          />
        {/if}

        {#if field.annotation && !erros?.[field.name]}
          <div class="label">
            <span class="label-text-alt">{field.annotation}</span>
          </div>
        {:else if erros?.[field.name]}
          <div class="label">
            <span class="badge badge-error label-text-alt text-error-content">
              {erros?.[field.name]}
            </span>
          </div>
        {/if}
      </label>
    {/each}
  </div>

  <button class="btn" onclick={handleConfirm} disabled={isLoading}>
    {!isLoading ? 'Save' : 'Loading...'}
  </button>
  <button class="btn" onclick={handleCancel} disabled={isLoading}>
    Cancel
  </button>
</Modal>
