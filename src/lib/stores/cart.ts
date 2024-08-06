import { writable } from 'svelte/store'
import { getContext, setContext } from 'svelte'
import type { SelectProductItem } from '$db/schema'
const CART_STORE_KEY = 'cart'

type Cart = {
  item: SelectProductItem
  quantity: number
}[]

function createCartStore(base_cart: Cart = []) {
  const { set, subscribe, update } = writable<Cart>(base_cart)
  return {
    set,
    subscribe,
    update,
    addItem: (input: { item: SelectProductItem; quantity: number }) => {
      update(cart => {
        const existing = cart.findIndex(i => i.item.id === input.item.id)
        if (existing !== -1) {
          cart[existing].quantity += input.quantity
        } else {
          cart.push(input)
        }
        return cart
      })
    },
    setItem: (input: { item: SelectProductItem; quantity: number }) => {
      update(cart => {
        const existing = cart.findIndex(i => i.item.id === input.item.id)
        if (existing) {
          cart[existing].quantity = input.quantity
        } else {
          cart.push(input)
        }
        return cart
      })
    },
    removeItem: (item_id: number) => {
      update(cart => {
        return cart.filter(i => i.item.id !== item_id)
      })
    },
  }
}

export function createCartContext(cart: Cart = []) {
  const store = createCartStore(cart)
  return setContext(CART_STORE_KEY, store)
}

export function getCartContext(): ReturnType<typeof createCartStore> {
  return getContext(CART_STORE_KEY)
}
