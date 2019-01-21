import { browser } from 'webextension-polyfill-ts'

import * as index from '..'
import { AnnotsSearcher } from './annots-search'
import { Dexie, StorageManager } from '../types'
import QueryBuilder from 'src/search/query-builder'
import { TabManager } from 'src/activity-logger/background'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import AnnotsStorage from 'src/direct-linking/background/storage'

export default class SearchBackground {
    private backend
    private tabMan: TabManager
    private queryBuilderFactory: () => QueryBuilder
    private getDb: () => Promise<Dexie>
    private annotsSearcher: AnnotsSearcher

    private static initBackend(idx: typeof index, getDb: () => Promise<Dexie>) {
        return {
            addPage: idx.addPage(getDb),
            addPageTerms: idx.addPageTerms(getDb),
            updateTimestampMeta: idx.updateTimestampMeta(getDb),
            addVisit: idx.addVisit(getDb),
            addFavIcon: idx.addFavIcon(getDb),
            delPages: idx.delPages(getDb),
            delPagesByDomain: idx.delPagesByDomain(getDb),
            delPagesByPattern: idx.delPagesByPattern(getDb),
            addTag: idx.addTag(getDb),
            delTag: idx.delTag(getDb),
            fetchPageTags: idx.fetchPageTags(getDb),
            addBookmark: idx.addBookmark(getDb),
            delBookmark: idx.delBookmark(getDb),
            pageHasBookmark: idx.pageHasBookmark(getDb),
            getPage: idx.getPage(getDb),
            grabExistingKeys: idx.grabExistingKeys(getDb),
            search: idx.search(getDb),
            suggest: idx.suggest(getDb),
            extendedSuggest: idx.extendedSuggest(getDb),
            getMatchingPageCount: idx.getMatchingPageCount(getDb),
            domainHasFavIcon: idx.domainHasFavIcon(getDb),
            createPageFromTab: idx.createPageFromTab(getDb),
            createPageFromUrl: idx.createPageFromUrl(getDb),
        }
    }

    constructor({
        storageManager,
        getDb,
        queryBuilder = () => new QueryBuilder(),
        tabMan,
        idx = index,
    }: {
        storageManager: StorageManager
        getDb: () => Promise<Dexie>
        queryBuilder?: () => QueryBuilder
        tabMan: TabManager
        idx?: typeof index
    }) {
        this.backend = SearchBackground.initBackend(idx, getDb)
        this.tabMan = tabMan
        this.getDb = getDb
        this.queryBuilderFactory = queryBuilder

        this.annotsSearcher = new AnnotsSearcher({
            storageManager,
            listsColl: AnnotsStorage.LISTS_COLL,
            listEntriesColl: AnnotsStorage.LIST_ENTRIES_COLL,
            tagsColl: AnnotsStorage.TAGS_COLL,
            bookmarksColl: AnnotsStorage.BMS_COLL,
            annotsColl: AnnotsStorage.ANNOTS_COLL,
        })

        // Handle any new browser bookmark actions (bookmark mananger or bookmark btn in URL bar)
        browser.bookmarks.onCreated.addListener(
            this.handleBookmarkCreation.bind(this),
        )
        browser.bookmarks.onRemoved.addListener(
            this.handleBookmarkRemoval.bind(this),
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            search: this.backend.search,
            addTag: this.backend.addTag,
            delTag: this.backend.delTag,
            suggest: this.backend.suggest,
            delPages: this.backend.delPages,
            addBookmark: this.backend.addBookmark,
            delBookmark: this.backend.delBookmark,
            fetchPageTags: this.backend.fetchPageTags,
            extendedSuggest: this.backend.extendedSuggest,
            delPagesByDomain: this.backend.delPagesByDomain,
            delPagesByPattern: this.backend.delPagesByPattern,
            getMatchingPageCount: this.backend.getMatchingPageCount,
            searchAnnotations: this.searchAnnotations.bind(this),
        })
    }

    async searchAnnotations({ query, ...params }) {
        const qb = this.queryBuilderFactory()
            .searchTerm(query)
            .get()

        if (qb.isBadTerm || qb.isInvalidSearch) {
            return []
        }

        return this.annotsSearcher.search({
            terms: [...qb.query],
            ...params,
        })
    }
    async handleBookmarkRemoval(id, { node }) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        return this.backend.delBookmark(node).catch(console.error)
    }

    async handleBookmarkCreation(id, node) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        let tabId
        const activeTab = this.tabMan.getActiveTab()

        if (activeTab != null && activeTab.url === node.url) {
            tabId = activeTab.id
        }

        return this.backend.addBookmark({ url: node.url, tabId })
    }
}
