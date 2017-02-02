import sortBy from 'lodash/fp/sortBy'

import db from '../pouchdb'
import { getTimestamp } from '../activity-logger'
import { convertLinkDocId, linkKeyPrefix } from '../create-links'

// Add user-created links falling in the time range of the visits in the result.
export function addLinksAmongVisits({
    visitsResult,
    minTime, maxTime,
}) {
    if (visitsResult.rows.length===0)
        return visitsResult

    // By default, search links created between the first and last visit.
    if (!maxTime) {
        const newestVisit = visitsResult.rows[0].doc
        maxTime = getTimestamp(newestVisit)
    }
    if (!minTime) {
        const oldestVisit = visitsResult.rows[visitsResult.rows.length-1].doc
        minTime = getTimestamp(oldestVisit)
    }

    return db.allDocs({
        include_docs: true,
        // From the most recent link in the database...
        startkey: convertLinkDocId({timestamp: maxTime}),
        // ...down to the ones made during oldest visit in the list.
        endkey: convertLinkDocId({timestamp: minTime}),
        descending: true,
    }).then(linksResult => {
        // Return a new result object with the visits and links combined.
        const allRows = visitsResult.rows.concat(linksResult.rows)
        return {
            // Sort again by time, descending.
            rows: sortBy(row => -getTimestamp(row.doc))(allRows)
        }
    })
}
