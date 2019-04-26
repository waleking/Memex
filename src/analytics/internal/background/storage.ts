import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { NOTIF_TYPE_EVENT_IDS, EVENT_TYPES } from '../constants'

export default class EventLogStorage extends StorageModule {
    static EVENT_LOG_COLL = 'eventLog'

    constructor(storageManager) {
        super({ storageManager })
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            [EventLogStorage.EVENT_LOG_COLL]: {
                version: new Date(2018, 6, 14),
                fields: {
                    time: { type: 'datetime' },
                    type: { type: 'string' },
                    details: { type: 'json' },
                },
                indices: [
                    { field: ['time', 'type'], pk: true },
                    { field: 'time' },
                    { field: 'type' },
                ],
                watch: false,
                backup: false,
            },
        },
        operations: {
            createEvent: {
                collection: EventLogStorage.EVENT_LOG_COLL,
                operation: 'createObject',
            },
            findLatestEventOfType: {
                collection: EventLogStorage.EVENT_LOG_COLL,
                operation: 'findOneObject',
                args: [
                    { type: '$type:int' },
                    {
                        reverse: '$reverse:boolean',
                        limit: '$limit:int',
                    },
                ],
            },
            countEventsOfType: {
                collection: EventLogStorage.EVENT_LOG_COLL,
                operation: 'countObjects',
                args: { type: '$type:int' },
            },
        },
    })

    async storeEvent({ time, details, type }) {
        return this.operation('createEvent', {
            time,
            details,
            type: EVENT_TYPES[type].id,
        })
    }

    async getLatestTimeWithCount({ notifType }) {
        let eventLogCount = 0
        let latestEvent = 0

        for (const type of NOTIF_TYPE_EVENT_IDS[notifType]) {
            // TODO: make sure opts are passed in
            const latest = await this.operation('findLatestEventOfType', {
                type,
                reverse: true,
            })

            if (latest) {
                latestEvent = Math.max(latest['time'], latestEvent)
            }

            const eventCountNotif = await this.operation('countEventsOfType', {
                type,
            })

            eventLogCount += eventCountNotif
        }

        if (eventLogCount === 0) {
            return null
        }

        return {
            latestTime: latestEvent,
            count: eventLogCount,
        }
    }
}
