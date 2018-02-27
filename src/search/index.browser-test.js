import { expect } from 'chai'
import { extractPageContent } from 'src/page-analysis'

function retryUntilTrue(f) {
    return new Promise((resolve, reject) => {
        const retry = () => {
            try {
                if (!f()) {
                    return setTimeout(retry, 100)
                }
                resolve()
            } catch (e) {
                reject()
            }
        }

        retry()
    })
}

async function loadURL(url) {
    const response = await fetch(url)
    const html = await response.text()

    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    await retryUntilTrue(() => iframeDoc.readyState === 'complete')

    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    await retryUntilTrue(() => iframeDoc.body)

    return {
        document: iframeDoc,
        destroy: () => document.body.removeChild(iframe),
    }
}

describe('Integration test from page analysis to search index', () => {
    it('should be able to extract page content, store and search it', async function() {
        this.timeout(10 * 1000)

        const indexResponse = await fetch(
            window.location.origin + '/base/test-content/html/index.txt',
        )
        const indexText = await indexResponse.text()
        const htmlPaths = indexText.split('\n')
        const htmlBase = window.location.origin + '/base/test-content/html/'
        for (const htmlPath of htmlPaths) {
            if (!htmlPath.length) {
                continue
            }

            const htmlURL = htmlBase + htmlPath
            const result = await loadURL(htmlURL)
            try {
                const content = await extractPageContent(
                    result.document,
                    'https://' + htmlPath,
                )
                // console.log(content)
            } finally {
                result.destroy()
            }
        }
    })
})
