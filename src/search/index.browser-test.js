import { expect } from 'chai'

describe('Testing in the browser', () => {
    it('should be good', async function() {
        this.timeout(10 * 1000)
        console.log(window.location.href)

        await new Promise(resolve => {
            const iframe = document.createElement('iframe')
            const html =
                '<!doctype html><html><head><title>Test!</title></head><body>Foo</body><html>'
            // iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
            document.body.appendChild(iframe)

            function checkIframeLoaded() {
                console.log('checking, checking')

                // Get a handle to the iframe element
                const iframeDoc =
                    iframe.contentDocument || iframe.contentWindow.document

                // Check if loading is complete
                if (iframeDoc.readyState === 'complete') {
                    iframe.contentDocument.open()
                    iframe.contentDocument.write(html)
                    iframe.contentDocument.close()
                    afterLoading()
                    return
                }
                console.log('nicht loaded...')

                // If we are here, it is not loaded. Set things up so we check   the status again in 100 milliseconds
                window.setTimeout(checkIframeLoaded, 100)
            }

            function afterLoading() {
                console.log(
                    'iframe.contentWindow =',
                    iframe.contentWindow.document.title,
                )
                document.body.removeChild(iframe)
                resolve()
            }

            checkIframeLoaded()
        })
    })
})
