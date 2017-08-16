import stream from 'stream'
import reduce from 'lodash/fp/reduce'

class Pipeline extends stream.Transform {
    combineContentStrings = reduce((result, val) => `${result}\n${val}`, '')

    /**
     * Transforms a page doc to doc structured for use with the index.
     * All searchable page data (content) is concatted to make a composite field.
     * This represents the general structure for index docs.
    */
    transformPageDoc = ({ _id: id, content = {}, bookmarkTimestamps = [], visitTimestamps = [] }) => ({
        id,
        content: this.combineContentStrings(content),
        bookmarkTimestamps,
        visitTimestamps,
    })

    _transform(doc, _, next) {
        const transformedDoc = this.transformPageDoc(doc)

        next(null, transformedDoc)
    }
}

export default Pipeline
