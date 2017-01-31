import docuri from 'docuri'

import randomString from '../util/random-string'


export const linkKeyPrefix = 'link/'

// Creates an _id string given the variables, or vice versa parses such strings
// We simply use the creation time for the id, for easy chronological sorting.
// We add a random string we call a 'nonce' to prevent accidental collisions.
export const convertLinkDocId = docuri.route(`${linkKeyPrefix}:timestamp/:nonce`)

export function generateLinkDocId({timestamp, nonce}) {
    const date = timestamp ? new Date(timestamp) : new Date()
    return convertLinkDocId({
        timestamp: date.getTime(),
        // Add a random string to prevent accidental collisions.
        nonce: nonce || randomString(),
    })
}
