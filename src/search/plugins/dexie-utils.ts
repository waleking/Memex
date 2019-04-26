import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

export class DexieUtilsPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static GET_PKS_OP = 'memex:dexie.getPks'
    static NUKE_DB_OP = 'memex:dexie.recreateDatabase'
    static REGEXP_COUNT_OP = 'memex:dexie.countByRegexp'
    static REGEXP_DELETE_OP = 'memex:dexie.deleteByRegexp'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(DexieUtilsPlugin.GET_PKS_OP, this.getPks)
        backend.registerOperation(
            DexieUtilsPlugin.REGEXP_DELETE_OP,
            this.deleteByRegexp,
        )
        backend.registerOperation(
            DexieUtilsPlugin.REGEXP_COUNT_OP,
            this.countByRegexp,
        )
        backend.registerOperation(
            DexieUtilsPlugin.NUKE_DB_OP,
            this.recreateDatabase,
        )
    }

    /**
     * NOTE: This is SUPER innefficient.
     */
    private queryByRegexp({
        collection,
        fieldName,
        pattern,
    }: {
        collection: string
        fieldName: string
        pattern: string | RegExp
    }) {
        const re =
            typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern

        return this.backend.dexieInstance
            .table(collection)
            .filter(doc => re.test(doc[fieldName]))
    }

    getPks = (collection: string) =>
        this.backend.dexieInstance
            .table(collection)
            .toCollection()
            .primaryKeys()

    deleteByRegexp = args => this.queryByRegexp(args).delete()
    countByRegexp = args => this.queryByRegexp(args).count()

    /**
     * NOTE: Super dangerous; deletes all data
     */
    recreateDatabase = async () => {
        await this.backend.dexieInstance.delete()
        await this.backend.dexieInstance.open()
    }
}
