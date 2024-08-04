import webpush, { type PushSubscription } from 'web-push'
import { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY } from '$env/static/private'

import {
  pushNotificationDeviceTable,
  pushNotificationLogTable,
  type SelectPushNotificationDevice,
} from '../index'
import { db } from '$db'
import { count, desc, eq } from 'drizzle-orm'

function initWebPush() {
  webpush.setVapidDetails(
    'mailto:webpush@hartenfeller.dev',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  )
}
initWebPush()

export const pushNotification = {
  sendNotification: async (subscription: PushSubscription, payload: string) => {
    try {
      const res = await webpush.sendNotification(subscription, payload)
      return {
        ok: res.statusCode === 201,
        status: res.statusCode,
        body: res.body,
      }
    } catch (err) {
      const msg = `Could not send notification: ${err}`
      console.error(msg)
      return {
        ok: false,
        status: undefined,
        body: msg,
      }
    }
  },

  deleteIfExpired: async (deviceId: number) => {
    // const last3Success = subDb
    //   .prepare(
    //     `
    // 	SELECT sum(success) as cnt
    // 	FROM notif_log
    // 	WHERE device_id = ?
    // 	AND success = 0
    // 	ORDER BY created_at DESC
    // 	LIMIT 3
    // `,
    //   )
    //   .get(deviceId) as { cnt: number }

    const [last3Success] = await db
      .select({ count: count(pushNotificationLogTable.success) })
      .from(pushNotificationLogTable)
      .where(eq(pushNotificationLogTable.device_id, deviceId))
      .orderBy(desc(pushNotificationLogTable.created_at))
      .limit(3)

    if (last3Success.count === 0) {
      console.log(`Removing expired subscription for device ${deviceId}`)
      await db
        .delete(pushNotificationDeviceTable)
        .where(eq(pushNotificationDeviceTable.device_id, deviceId))
      //   subDb
      //     .prepare('DELETE FROM user_devices WHERE device_id = ?')
      //     .run(deviceId)
    }
  },

  addUserDevice: async (userId: string, subscription: PushSubscription) => {
    // const userNameCount = subDb
    //   .prepare('SELECT count(*) as cnt FROM users WHERE username = ?')
    //   .get(username) as { cnt: number }

    const [subCount] = await db
      .select({
        count: count(pushNotificationDeviceTable.device_id),
      })
      .from(pushNotificationDeviceTable)
      .where(eq(pushNotificationDeviceTable.subscription, subscription))

    // if (userNameCount.cnt === 0) {
    //   //   subDb.prepare('INSERT INTO users (username) VALUES (?)').run(username)
    // }

    // const subCount = subDb
    //   .prepare(
    //     `SELECT count(*) as cnt FROM user_devices WHERE json_extract(subscription, '$.endpoint') = ? `,
    //   )
    //   .get(subscription.endpoint) as { cnt: number }

    if (subCount.count === 0) {
      console.log(`Adding subscription for user ${userId}`)
      await db.insert(pushNotificationDeviceTable).values({
        userId,
        subscription: subscription,
      })
      //   subDb
      //     .prepare(
      //       'INSERT INTO user_devices (subscription, username) VALUES (?, ?)',
      //     )
      //     .run(JSON.stringify(subscription), username)
    }
  },

  sendNotificationToDevices: async (
    devices: SelectPushNotificationDevice[],
    payload: string,
  ) => {
    devices.forEach(async device => {
      const subscription = device.subscription
      const res = await pushNotification.sendNotification(subscription, payload)

      if (!res.ok) {
        console.error(
          `Failed to send notification to device ${device.device_id}: ${res.body} (${res.status}). ${JSON.stringify(res)}`,
        )
      }

      //   subDb
      //     .prepare(
      //       `
      //   INSERT INTO notif_log (device_id, payload, http_status_response, success, error_message)
      //   VALUES (?, ?, ?, ?, ?)
      // `,
      //     )
      //     .run(device.device_id, payload, res.status, res.ok ? 1 : 0, res.body)

      await db.insert(pushNotificationLogTable).values({
        device_id: device.device_id,
        http_status: res.status ?? 0,
        payload: payload,
        success: res.ok ? true : false,
        err_message: res.body,
      })

      // remove expired subscription
      if (res.status === 410) {
        await db
          .delete(pushNotificationDeviceTable)
          .where(eq(pushNotificationDeviceTable.device_id, device.device_id))
        // subDb
        //   .prepare('DELETE FROM user_devices WHERE device_id = ?')
        //   .run(device.device_id)
      } else if (!res.ok) {
        pushNotification.deleteIfExpired(device.device_id)
      }
    })
  },

  notifUser: async (userId: string, payload: string) => {
    // const devices = subDb
    //   .prepare('SELECT * FROM user_devices WHERE username = ?')
    //   .all(username) as SubDevice[]

    const devices = await db
      .select()
      .from(pushNotificationDeviceTable)
      .where(eq(pushNotificationDeviceTable.userId, userId))

    await pushNotification.sendNotificationToDevices(devices, payload)
  },
}
