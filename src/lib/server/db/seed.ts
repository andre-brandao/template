import { faker } from '@faker-js/faker'
import { hash } from '@node-rs/argon2'
import { generateId } from 'lucia'

import fs from 'fs'

const TEST_IMAGE = 'src/lib/assets/home/home-open-graph-square.jpg'

import { image, product, user } from './controller'

const main = async () => {
  await seedUsers()
  await seedProducts()
}
main()

async function seedUsers() {
  console.log('userTable seed START')

  for (let i = 0; i < 20; i++) {
    user.insertUser({
      id: generateId(15),
      username: faker.internet.userName(),
      password_hash: await hash('password', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      }),
    })
  }

  console.log('userTable seed END')
}

async function seedProducts() {
  const img_buff = fs.readFileSync(TEST_IMAGE)

  if (!img_buff) {
    return
  }

  const [{ img_id }] = await image.insertImage({
    buff: img_buff,
    name: 'home-open-graph-square.jpg',
    uploaded_by: undefined,
  })

  console.log('productCategoryTable seed START')
  for (let i = 0; i < 15; i++) {
    await product.insertProductCategory({
      name: faker.commerce.department(),
    })
  }
  console.log('productCategoryTable seed END')

  console.log('productTable seed START')
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 10; j++) {
      await product.insertProduct({
        name: faker.commerce.productName(),
        price: Number(faker.commerce.price()),
        category_id: i + 1,
        description: faker.commerce.productDescription(),
        image_id: img_id,
      })
    }
  }
  console.log('productTable seed END')
}
