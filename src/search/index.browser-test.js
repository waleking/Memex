import { expect } from 'chai'

async function loadURL(url) {
    const response = await fetch(url)
    const html = await response.text()

    const { iframe, iframeDoc } = await new Promise(resolve => {
        const iframe = document.createElement('iframe')
        document.body.appendChild(iframe)

        function checkIframeLoaded() {
            // Get a handle to the iframe element
            const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document

            // Check if loading is complete
            if (iframeDoc.readyState === 'complete') {
                iframe.contentDocument.open()
                iframe.contentDocument.write(html)
                iframe.contentDocument.close()
                resolve({ iframe, iframeDoc })
                return
            }

            // If we are here, it is not loaded. Set things up so we check   the status again in 100 milliseconds
            window.setTimeout(checkIframeLoaded, 100)
        }

        checkIframeLoaded()
    })

    return {
        document: iframeDoc,
        destroy: () => document.body.removeChild(iframe),
    }
}

describe('Testing in the browser', () => {
    it('should be good', async function() {
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
            const { document, destroy } = await loadURL(htmlURL)
            try {
                console.log(htmlURL, document.title)
            } finally {
                destroy()
            }
        }
    })
})
