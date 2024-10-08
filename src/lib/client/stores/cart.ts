import { writable } from 'svelte/store'
import { getContext, setContext } from 'svelte'
import type { SelectProductItem } from '$db/schema'
const CART_STORE_KEY = 'cart'

type Cart = Record<
  SelectProductItem['id'],
  {
    item: SelectProductItem
    quantity: number
  }
>

function createCartStore(base_cart: Cart = {}) {
  const { set, subscribe, update } = writable<Cart>(base_cart)
  return {
    set,
    subscribe,
    update,
    addItem: (input: { item: SelectProductItem; quantity: number }) => {
      update(cart => {
        const existing = cart[input.item.id]

        if (existing) {
          existing.quantity += input.quantity
        } else {
          cart[input.item.id] = {
            item: input.item,
            quantity: input.quantity,
          }
        }
        return cart
      })
    },
    setItem: (input: { item: SelectProductItem; quantity: number }) => {
      update(cart => {
        cart[input.item.id] = {
          item: input.item,
          quantity: input.quantity,
        }
        return cart
      })
    },
    removeItem: (item_id: number) => {
      update(cart => {
        delete cart[item_id]
        return cart
      })
    },
  }
}

export function createCartContext(cart: Cart = {}) {
  const store = createCartStore(cart)
  return setContext(CART_STORE_KEY, store)
}

export function getCartContext(): ReturnType<typeof createCartStore> {
  return getContext(CART_STORE_KEY)
}
