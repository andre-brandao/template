/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from '@faker-js/faker'
import { hash } from '@node-rs/argon2'
import { generateId } from 'lucia'
import fs from 'fs'
import { image, product, user } from './controller'

const TEST_IMAGE = 'src/lib/assets/home/home-open-graph-square.jpg'

const main = async () => {
  await seedUsers()
  await seedCategories()
  await seedProducts()

}
main()

async function seedUsers() {
  console.log('userTable seed START')

  try {
    await user.insertUser({
      id: generateId(15),
      email: 'admin@admin.com',
      username: 'administrator',
      password_hash: await hash('senha123', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      }),
    })
  } catch (error) {
    console.error('Failed to insert administrator:', error)
  }

  for (let i = 0; i < 20; i++) {
    try {
      await user.insertUser({
        id: generateId(15),
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password_hash: await hash('password', {
          memoryCost: 19456,
          timeCost: 2,
          outputLen: 32,
          parallelism: 1,
        }),
      })
    } catch (error) {
      console.error(`Failed to insert user ${i}:`, error)
    }
  }

  console.log('userTable seed END')
}

async function seedCategories() {
  console.log('categoryTable seed START')

  for (let i = 0; i < 10; i++) {
    try {
      await product.insertProductCategory({
        name: faker.commerce.department(),
      })
    } catch (error) {
      console.error(`Failed to insert category ${i}:`, error)
    }
  }

  console.log('categoryTable seed END')
}

async function seedProducts() {
  console.log('productTable seed START')

  for (let i = 0; i < 20; i++) {
    try {
      const [prod] = await product.insertProduct({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
      }).returning()

      await seedProductItem(prod.id)
    } catch (error) {
      console.error(`Failed to insert product ${i}:`, error)
    }
  }

  console.log('productTable seed END')
}


async function seedProductItem(product_id: number, quantity = 2) {
  for (let i = 0; i < quantity; i++) {
    await product.insertProductItem({
      price: faker.number.int({ max: 25000, min: 500 }),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      product_id: product_id,
    })
  }
}

