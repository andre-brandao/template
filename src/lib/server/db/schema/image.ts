import {
  sqliteTable,
  text,
  integer,
  blob,
  // customType,
} from 'drizzle-orm/sqlite-core'
import { eq, sql } from 'drizzle-orm'
import { userTable } from '.'
import { db } from '..'

import sharp from 'sharp'

const imageTable = sqliteTable('image', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  uploaded_by: text('uploaded_by')
    // .notNull()
    .references(() => userTable.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  data: blob('data', { mode: 'buffer' }).notNull(),
})

type SelectImage = typeof imageTable.$inferSelect
type InsertImage = typeof imageTable.$inferInsert
export { imageTable, type SelectImage, type InsertImage }

export const image = {
  insertImage,
  getImageByID,
}
async function insertImage(img: {
  buff: Buffer
  name: string
  uploaded_by: InsertImage['uploaded_by']
}) {
  const processedImage = await sharp(img.buff)
    .resize({ width: 400, height: 400, fit: 'cover' })
    .toBuffer()

  return db
    .insert(imageTable)
    .values({
      name: img.name,
      data: processedImage,
      uploaded_by: img.uploaded_by,
    })
    .returning({
      img_id: imageTable.id,
    })
}

function getImageByID(id: SelectImage['id']) {
  return db
    .select({
      img: imageTable.data,
    })
    .from(imageTable)
    .where(eq(imageTable.id, id))
    .limit(1)
}
