import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

export class GetPksPlugin extends StorageBackendPlugin<DexieStorageBackend> {
    static GET_PKS_OP = 'memex:dexie.getPks'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            GetPksPlugin.GET_PKS_OP,
            async (collection: string) =>
                backend.dexieInstance
                    .table(collection)
                    .toCollection()
                    .primaryKeys(),
        )
    }
}
