import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import { AnnotSearchParams } from 'src/search/background/types'
import { Annotation } from 'src/direct-linking/types'
import AnnotsStorage from 'src/direct-linking/background/storage'

export class AnnotationsListPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static LIST_OP_ID = 'memex:dexie.listAnnotations'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            AnnotationsListPlugin.LIST_OP_ID,
            this.list.bind(this),
        )
    }

    private listWithoutTimeBounds() {
        return this.backend.dexieInstance
            .table(AnnotsStorage.ANNOTS_COLL)
            .orderBy('createdWhen')
    }

    private listWithTimeBounds({
        startDate = 0,
        endDate = new Date(),
    }: Partial<AnnotSearchParams>) {
        return this.backend.dexieInstance
            .table(AnnotsStorage.ANNOTS_COLL)
            .where('createdWhen')
            .between(startDate, endDate, true, true)
    }

    private async filterByBookmarks(urls: string[]) {
        return this.backend.dexieInstance
            .table<any, string>(AnnotsStorage.BMS_COLL)
            .where('url')
            .anyOf(urls)
            .primaryKeys()
    }

    private async filterByTags(urls: string[], params: AnnotSearchParams) {
        let tags = await this.backend.dexieInstance
            .table<any, [string, string]>(AnnotsStorage.TAGS_COLL)
            .where('url')
            .anyOf(urls)
            .primaryKeys()

        if (params.tagsExc.length) {
            const tagsExc = new Set(params.tagsExc)
            tags = tags.filter(([name]) => !tagsExc.has(name))
        }

        if (params.tagsInc.length) {
            const tagsInc = new Set(params.tagsInc)
            tags = tags.filter(([name]) => tagsInc.has(name))
        }

        const tagUrls = new Set(tags.map(([, url]) => url))
        return urls.filter(url => tagUrls.has(url))
    }

    private async filterByCollections(
        urls: string[],
        params: AnnotSearchParams,
    ) {
        const [listIds, entries] = await Promise.all([
            this.backend.dexieInstance
                .table<any, number>(AnnotsStorage.LISTS_COLL)
                .where('name')
                .anyOf(params.collections)
                .primaryKeys(),
            this.backend.dexieInstance
                .table<any, [number, string]>(AnnotsStorage.LIST_ENTRIES_COLL)
                .where('url')
                .anyOf(urls)
                .primaryKeys(),
        ])

        const lists = new Set(listIds)
        const entryUrls = new Set(
            entries
                .filter(([listId]) => lists.has(listId))
                .map(([, url]) => url),
        )

        return urls.filter(url => entryUrls.has(url))
    }

    private async mapUrlsToAnnots(urls: string[]): Promise<Annotation[]> {
        const annotUrlMap = new Map<string, Annotation>()

        await this.backend.dexieInstance
            .table(AnnotsStorage.ANNOTS_COLL)
            .where('url')
            .anyOf(urls)
            .each(annot => annotUrlMap.set(annot.url, annot))

        // Ensure original order of input is kept
        return urls.map(url => annotUrlMap.get(url))
    }

    async list({
        limit = 10,
        skip = 0,
        ...params
    }: AnnotSearchParams): Promise<Annotation[]> {
        const innerLimit = limit * 2 // x2 is an arbitrary choice
        let innerSkip = 0
        let results: string[] = []
        let continueLookup = true

        while (continueLookup) {
            // Ensure proper sorting happens, depending on set time bounds
            const coll = params.endDate
                ? this.listWithTimeBounds(params)
                : this.listWithoutTimeBounds()

            let innerResults: string[] = await coll
                .reverse()
                .offset(innerSkip)
                .limit(innerLimit)
                .primaryKeys()

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
            }

            results = [...results, ...innerResults]
        }

        return this.mapUrlsToAnnots(results)
    }
}
