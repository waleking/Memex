import { StorageManager } from '..'
import { FeatureStorage } from '../storage'
import {
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import { AnnotSearchParams, AnnotPage } from './types'
import { Annotation } from 'src/direct-linking/types'
import { AnnotationsSearchPlugin } from './annots-search'
import { PageUrlMapperPlugin } from './page-url-mapper'
import { reshapeAnnotForDisplay, reshapeParamsForOldSearch } from './utils'
import { AnnotationsListPlugin } from 'src/search/background/annots-list'

export interface SearchStorageProps {
    storageManager: StorageManager
    annotationsColl?: string
}

export interface Interaction {
    time: number
    url: string
}

export type LegacySearch = (
    params: OldSearchParams,
) => Promise<{
    ids: OldSearchResult[]
    totalCount: number
}>

export default class SearchStorage extends FeatureStorage {
    static ANNOTS_COLL = 'annotations'

    private annotsColl: string

    private static buildAnnotsQuery({
        url,
        startDate,
        endDate,
    }: AnnotSearchParams): object {
        if (!url) {
            throw new Error('URL must be supplied to list annotations.')
        }

        const baseQuery = { pageUrl: url }
        let timeQuery = {}

        if (endDate || startDate) {
            const end = endDate ? { $lte: endDate } : {}
            const start = startDate ? { $gte: startDate } : {}
            timeQuery = { createdWhen: { ...end, ...start } }
        }

        return { ...baseQuery, ...timeQuery }
    }

    private static buildTagsQuery(
        { tagsInc = [], tagsExc = [] }: AnnotSearchParams,
        urls: string[],
    ): object {
        const baseQuery = { url: { $in: urls } }
        let tagsQuery = {}

        if (tagsInc.length || tagsExc.length) {
            const inc = tagsInc.length ? { $in: tagsInc } : {}
            const exc = tagsExc.length ? { $nin: tagsExc } : {}
            tagsQuery = { name: { ...inc, ...exc } }
        }

        return { ...baseQuery, ...tagsQuery }
    }

    constructor({
        storageManager,
        annotationsColl = SearchStorage.ANNOTS_COLL,
    }: SearchStorageProps) {
        super(storageManager)

        this.annotsColl = annotationsColl
    }

    private async filterByBookmarks(annots: Annotation[]) {
        const urls = annots.map(annot => annot.url)

        const results = await this.storageManager
            .collection('annotBookmarks')
            .findObjects<any>({ url: { $in: urls } })

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    private async filterByTags(
        annots: Annotation[],
        params: AnnotSearchParams,
    ) {
        const urls = annots.map(annot => annot.url)
        const query = SearchStorage.buildTagsQuery(params, urls)

        const results = await this.storageManager
            .collection('tags')
            .findObjects<any>(query)

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    private async filterByCollections(
        annots: Annotation[],
        { collections }: AnnotSearchParams,
    ) {
        const lists = await this.storageManager
            .collection('customLists')
            .findObjects<any>({ name: { $in: collections } })

        const results = await this.storageManager
            .collection('annotListEntries')
            .findObjects<any>({
                url: { $in: annots.map(annot => annot.url) },
                listId: { $in: lists.map(list => list.id) },
            })

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    private async calcLatestInteraction(url: string, upperTimeBound?: number) {
        let max = 0
        const visitQuery: any = { url }
        const bmQuery: any = { url }

        if (upperTimeBound) {
            visitQuery.time = { $lte: upperTimeBound }
            bmQuery.time = { $lte: upperTimeBound }
        }

        const [visits, bookmark] = await Promise.all([
            this.storageManager
                .collection('visits')
                .findObjects<Interaction>(visitQuery),
            this.storageManager
                .collection('bookmarks')
                .findOneObject<Interaction>(bmQuery),
        ])

        max = visits.sort((a, b) => b.time - a.time)[0].time

        if (!!bookmark && bookmark.time > max) {
            max = bookmark.time
        }

        return max
    }

    private async mapDisplayTimeToPages(
        pages: AnnotPage[],
        endDate: Date | number,
    ): Promise<AnnotPage[]> {
        return Promise.all(
            pages.map(async page => {
                const upperTimeBound =
                    endDate instanceof Date ? endDate.getTime() : endDate

                return {
                    ...page,
                    displayTime: await this.calcLatestInteraction(
                        page.url,
                        upperTimeBound,
                    ),
                }
            }),
        )
    }

    private async mapAnnotsToPages(
        annots: Annotation[],
        maxAnnotsPerPage: number,
    ): Promise<AnnotPage[]> {
        const pageUrls = new Set(annots.map(annot => annot.pageUrl))
        const annotsByUrl = new Map<string, Annotation[]>()

        for (const annot of annots) {
            const pageAnnots = annotsByUrl.get(annot.pageUrl) || []
            annotsByUrl.set(
                annot.pageUrl,
                [...pageAnnots, annot].slice(0, maxAnnotsPerPage),
            )
        }

        const pages = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
        )

        return pages.map(page => ({
            ...page,
            annotations: annotsByUrl.get(page.url),
        }))
    }

    async listAnnotationsBlank(params: AnnotSearchParams) {
        const results = await this.storageManager.operation(
            AnnotationsListPlugin.LIST_OP_ID,
            params,
        )

        const pages = await this.mapAnnotsToPages(
            results,
            params.maxAnnotsPerPage ||
                AnnotationsSearchPlugin.MAX_ANNOTS_PER_PAGE,
        )

        return this.mapDisplayTimeToPages(pages, params.endDate)
    }

    async listAnnotations({
        limit = 10,
        skip = 0,
        ...params
    }: AnnotSearchParams): Promise<Annotation[]> {
        const innerLimit = limit * 2
        let innerSkip = 0
        let results: Annotation[] = []
        let continueLookup = true

        const query = SearchStorage.buildAnnotsQuery(params)

        while (continueLookup) {
            let innerResults = await this.storageManager
                .collection(this.annotsColl)
                .findObjects<Annotation>(query, {
                    skip: innerSkip,
                    limit: innerLimit,
                })

            // We've exhausted the DB results
            if (innerResults.length < innerLimit) {
                continueLookup = false
            }

            innerSkip += innerLimit

            if (params.bookmarksOnly) {
                innerResults = await this.filterByBookmarks(innerResults)
            }

            if (
                (params.tagsInc && params.tagsInc.length) ||
                (params.tagsExc && params.tagsExc.length)
            ) {
                innerResults = await this.filterByTags(innerResults, params)
            }

            if (params.collections && params.collections.length) {
                innerResults = await this.filterByCollections(
                    innerResults,
                    params,
                )
                return innerResults
            }

            results = [...results, ...innerResults]
        }

        return results
    }

    async searchAnnots(
        params: AnnotSearchParams,
    ): Promise<Annotation[] | AnnotPage[]> {
        const results: Annotation[] = await this.storageManager.operation(
            AnnotationsSearchPlugin.SEARCH_OP_ID,
            params,
        )

        if (params.includePageResults) {
            const pages = await this.mapAnnotsToPages(
                results,
                params.maxAnnotsPerPage ||
                    AnnotationsSearchPlugin.MAX_ANNOTS_PER_PAGE,
            )

            return this.mapDisplayTimeToPages(pages, params.endDate)
        }

        return results.map(reshapeAnnotForDisplay as any) as any
    }

    async searchPages(
        params: AnnotSearchParams,
        legacySearch: LegacySearch,
    ): Promise<AnnotPage[]> {
        const searchParams = reshapeParamsForOldSearch(params)

        const { ids } = await legacySearch(searchParams)

        const pageUrls = new Set(ids.map(([url]) => url))

        const pages = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
        )

        return this.mapDisplayTimeToPages(pages, params.endDate)
    }
}
