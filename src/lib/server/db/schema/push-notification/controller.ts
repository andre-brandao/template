import webpush, { type PushSubscription } from 'web-push'
import { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY } from '$env/static/private'

import {
  pushNotificationDeviceTable,
  pushNotificationLogTable,
  notificationChannelTable,
  notificationChannelUsersTable,
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
    }
  },

  addUserDevice: async (userId: string, subscription: PushSubscription) => {
    const [subCount] = await db
      .select({
        count: count(pushNotificationDeviceTable.device_id),
      })
      .from(pushNotificationDeviceTable)
      // TODO: select by subscription endpoint
      .where(eq(pushNotificationDeviceTable.subscription, subscription))

    if (subCount.count === 0) {
      console.log(`Adding subscription for user ${userId}`)
      await db.insert(pushNotificationDeviceTable).values({
        userId,
        subscription,
      })
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

      await db.insert(pushNotificationLogTable).values({
        device_id: device.device_id,
        http_status: res.status ?? 666,
        payload: payload,
        success: res.ok ? true : false,
        err_message: res.body,
      })

      // remove expired subscription
      if (res.status === 410) {
        await db
          .delete(pushNotificationDeviceTable)
          .where(eq(pushNotificationDeviceTable.device_id, device.device_id))
      } else if (!res.ok) {
        pushNotification.deleteIfExpired(device.device_id)
      }
    })
  },

  notifUser: async (userId: string, payload: string) => {
    const devices = await db
      .select()
      .from(pushNotificationDeviceTable)
      .where(eq(pushNotificationDeviceTable.userId, userId))

    await pushNotification.sendNotificationToDevices(devices, payload)
  },
  addUserToChannel: async (channel_id: string, userId: string) => {
    try {
      await db.insert(notificationChannelTable).values({
        channel_id,
      })
    } catch (error) {
      console.error(error)
    }

    await db.insert(notificationChannelUsersTable).values({
      channel_id,
      userId,
    })
  },
  notifChannel: async (channel_id: string, payload: string) => {
    const devices = await db
      .select({
        device_id: pushNotificationDeviceTable.device_id,
        subscription: pushNotificationDeviceTable.subscription,
        userId: pushNotificationDeviceTable.userId,
      })
      .from(notificationChannelUsersTable)
      .where(eq(notificationChannelUsersTable, channel_id))
      .innerJoin(
        pushNotificationDeviceTable,
        eq(
          pushNotificationDeviceTable.userId,
          notificationChannelUsersTable.userId,
        ),
      )

    pushNotification.sendNotificationToDevices(devices, payload)
  },
}
