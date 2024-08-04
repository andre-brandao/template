import { publicProcedure, router } from '../t'

import { z } from 'zod'
import { pushNotification as notificationController } from '$db/schema/push-notification/controller'

import { middleware } from '../middleware'

export const pushNotification = router({
  addPushNotificationDevice: publicProcedure
    .use(middleware.auth)
    .input(
      z.object({
        subscription: z.any(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { subscription } = input
      const { user } = ctx.locals

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        }
      }

      try {
        await notificationController.addUserDevice(user.id, subscription)
        return {
          success: true,
          error: null,
        }
      } catch (error) {
        console.error(error)
        return {
          success: false,
          error: 'Unknow error',
        }
      }
    }),
  sendTestNotification: publicProcedure.query(async ({ ctx }) => {
    const { user } = ctx.locals
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    try {
      await notificationController.notifUser(user.id, 'Test Notification')
      return {
        success: true,
      }
    } catch (error) {
      console.error(error)
      return {
        success: false,
        error: 'Unknow error',
      }
    }
  }),
})
