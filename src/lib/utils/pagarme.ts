import {
  PUBLIC_TESTE_PAGAR_ME_PK_KEY,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PUBLIC_PAGAR_ME_PK_KEY,
} from '$env/static/public'

const KEY = PUBLIC_TESTE_PAGAR_ME_PK_KEY

export async function tokenizeCard(card: {
  number: string
  holder_name: string
  exp_month: number
  exp_year: number
  cvv: string
}) {
  try {
    const response = await fetch(
      'https://api.pagar.me/core/v5/tokens?appId=' + KEY,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'card',
          card: {
            number: card.number,
            holder_name: card.holder_name,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            cvv: card.cvv,
          },
        }),
      },
    )
    const data = await response.json()
    console.log(data)
    return { data, error: null }
  } catch (error) {
    console.error(error)
    return { data: null, error }
  }
}
