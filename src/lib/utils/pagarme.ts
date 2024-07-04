// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import {
//   PUBLIC_TESTE_PAGAR_ME_PK_KEY,
//   PUBLIC_PAGAR_ME_PK_KEY,
// } from '$env/static/public'

// const KEY = PUBLIC_TESTE_PAGAR_ME_PK_KEY

// import axios from 'axios'
// export async function tokenizeCard(card: {
//   number: string
//   holder_name: string
//   exp_month: number
//   exp_year: number
//   cvv: string
// }) {

//   try {
//     const { data } = await axios.post(
//       'https://api.pagar.me/core/v5/tokens?appId=' +
//       KEY,
//       {
//         type: 'card',
//         card: {
//           number: card.number,
//           holder_name: card.holder_name,
//           exp_month: card.exp_month,
//           exp_year: card.exp_year,
//           cvv: card.cvv,
//         },
//       },
//     )
//     console.log(data)

//     return {data, error: null}
//   } catch (error) {
//     console.error(error)
//     return {data: null, error}
//   }
// }
