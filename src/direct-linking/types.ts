export interface Annotation {
    pageTitle: string
    pageUrl: string
    body: string
    selector: object
    createdWhen?: Date
    lastEdited?: Date
    url?: string
    comment?: string
}

export interface AnnotPage {
    url: string
    title: string
    hasBookmark: boolean
    /** Object URL to the in-memory location of the assoc. screenshot. */
    screenshot?: string
    /** Object URL to the in-memory location of the assoc. fav-icon. */
    favIcon?: string
    annotations: Annotation[]
}

export interface AnnotListEntry {
    listId: number
    url: string
}

export interface AnnotationRequest {
    memexLinkOrigin: string
    // urlWithoutProtocol: string
    annotationId: string
    tabId: string
}

interface StoredAnnotationRequest extends AnnotationRequest {
    annotationPromise: Promise<Annotation>
}

export interface StoredAnnotationRequestMap {
    [tabId: string]: StoredAnnotationRequest
}

export type AnnotationSender = (
    { annotation, tabId }: { annotation: Annotation; tabId: number },
) => void

export interface SearchParams {
    /** Main text terms to search against annot body/comments. */
    terms?: string[]
    /** Collections to include (all results must be of pages in this collection). */
    collections?: string[]
    /** Tags to include (all results must have these tags). */
    tagsInc?: string[]
    /** Tags to exclude (no results can have these tags). */
    tagsExc?: string[]
    /** Same idea as tags, but for domains (['google.com', 'twitter.com']). */
    domainsInc?: string[]
    domainsExc?: string[]
    /** Lower-bound for time filter (all results must be created AFTER this time). */
    startDate?: Date | number
    /** Upper-bound for time filter (all results must be created BEFORE this time). */
    endDate?: Date | number
    /** If defined, confines search to a particular page. */
    url?: string
    /** Use for pagination (result skip may not be possible). */
    limit?: number
    /** Denotes whether or not to limit search to annotations on a bookmarked page. */
    bookmarksOnly?: boolean
    /** Denotes whether or not to limit search to highlighted text (body). */
    highlightsOnly?: boolean
    /** Denotes whether or not to limit search to direct links. */
    directLinksOnly?: boolean
    /** Denotes whether or not to return the assoc. pages with matched annots. */
    includePageResults?: boolean
}

export interface UrlFilters {
    collUrlsInc?: Set<string>
    tagUrlsInc?: Set<string>
    domainUrlsInc?: Set<string>
    tagUrlsExc?: Set<string>
    domainUrlsExc?: Set<string>
}
