// USER
export { userTable, sessionTable } from './user'
export type { DatabaseUser, InsertUser, SelectUser } from './user'

// IMAGE
export { imageTable } from './image'
export type { InsertImage, SelectImage } from './image'

// PRODUCT
export {
  productTable,
  productRelations,
  productCategoryTable,
  productCategoryRelations,
} from './product'
export type { SelectProduct, InsertProduct } from './product'
export type { SelectProductCategory, InsertProductCategory } from './product'
