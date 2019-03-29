import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'

import * as notifications from '../notifications'
import createNotif from '../../util/notifications'
import { browser } from 'webextension-polyfill-ts'

export default class NotificationStorage extends StorageModule {
    static NOTIFS_COLL = 'notifications'

    getConfig = (): StorageModuleConfig => ({
        collections: {
            [NotificationStorage.NOTIFS_COLL]: {
                version: new Date(2018, 7, 4),
                fields: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    buttonText: { type: 'string' },
                    link: { type: 'string' },
                    sentTime: { type: 'datetime' },
                    deliveredTime: { type: 'datetime' },
                    readTime: { type: 'datetime' },
                },
                indices: [{ field: 'id', pk: true }],
            },
        },
        operations: {
            createNotification: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'createObject',
            },
            findUnreadNotifications: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'findObjects',
                args: { readTime: '$readTime:any' },
            },
            findReadNotifications: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'findObjects',
                args: { readTime: '$readTime:any' },
            },
            findNotificationForId: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'findOneObject',
                args: { id: '$id:pk' },
            },
            countUnreadNotifications: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'countObjects',
                args: { readTime: '$readTime:any' },
            },
            readNotification: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'countObjects',
                args: [{ id: '$id:pk' }, { readTime: '$readTime:any' }],
            },
        },
    })

    async storeNotification(notification) {
        return this.operation('createNotification', notification)
    }

    async fetchUnreadNotifications() {
        const opt = {
            reverse: true,
        }

        // TODO: make sure opts is passed in
        return this.operation('findUnreadNotifications', {
            readTime: { $exists: false },
        })
    }

    async fetchReadNotifications({ limit, skip }) {
        const opt = {
            reverse: true,
            limit,
            skip,
        }

        // TODO: make sure opts is passed in
        const results = await this.operation('findUnreadNotifications', {
            readTime: { $exists: true },
        })

        return {
            notifications: results,
            resultExhausted: results.length < limit,
        }
    }

    async fetchUnreadCount() {
        return this.operation('countUnreadNotifications', {
            readTime: { $exists: false },
        })
    }

    async readNotification(id) {
        return this.operation('readNotification', { id, readTime: Date.now() })
    }

    async fetchNotifById(id) {
        return this.operation('findNotificationForId', { id })
    }

    async dispatchNotification(notification) {
        if (notification.overview) {
            const newNotification = {
                ...notification.overview,
                id: notification.id,
                deliveredTime: Date.now(),
                sentTime: notifications.releaseTime,
            }
            // Store the notification so that it displays in the inbox
            await this.storeNotification(newNotification)
        }
        if (notification.system) {
            // Check if the system has to be notified or not
            const url = notification.system.buttons[0].action.url
            // console.log(notification.system.title, 'hello')
            await createNotif(
                {
                    title: notification.system.title,
                    message: notification.system.message,
                },
                () => {
                    return browser.tabs.create({
                        url,
                    })
                },
            )
        }
    }
}
