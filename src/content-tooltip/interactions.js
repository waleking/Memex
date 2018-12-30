import { browser } from 'webextension-polyfill-ts'

import {
    delayed,
    getPositionState,
    getTooltipState,
    getPageCenter,
} from './utils'
import {
    createAndCopyDirectLink,
    createAnnotation,
} from '../direct-linking/content_script/interactions'
import { setupUIContainer, destroyUIContainer } from './components'
import { remoteFunction, makeRemotelyCallable } from '../util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { injectCSS } from '../search-injection/dom'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import {
    STORAGE_KEYS,
    ANNOTATION_DEMO_URL,
} from 'src/overview/onboarding/constants'

const openOptionsRPC = remoteFunction('openOptionsTab')
const processEventRPC = remoteFunction('processEvent')
let mouseupListener = null

export function setupTooltipTrigger(callback, toolbarNotifications) {
    mouseupListener = event => {
        conditionallyTriggerTooltip({ callback, toolbarNotifications }, event)
    }

    document.body.addEventListener('mouseup', mouseupListener)
}

export function destroyTooltipTrigger() {
    document.body.removeEventListener('mouseup', mouseupListener)
    mouseupListener = null
}

const CLOSE_MESSAGESHOWN_KEY = 'tooltip.close-message-shown'

async function _setCloseMessageShown() {
    await browser.storage.local.set({
        [CLOSE_MESSAGESHOWN_KEY]: true,
    })
}

async function _getCloseMessageShown() {
    const {
        [CLOSE_MESSAGESHOWN_KEY]: closeMessageShown,
    } = await browser.storage.local.get({ [CLOSE_MESSAGESHOWN_KEY]: false })

    return closeMessageShown
}

// Target container for the Tooltip.
let target = null
let showTooltip = null

/* Denotes whether the user inserted/removed tooltip by his/her own self. */
let manualOverride = false

/**
 * Creates target container for Tooltip.
 * Injects content_script.css.
 * Mounts Tooltip React component.
 * Sets up Container <---> webpage Remote functions.
 */
export const insertTooltip = async ({ toolbarNotifications }) => {
    // If target is set, Tooltip has already been injected.
    if (target) {
        return
    }

    target = document.createElement('div')
    target.setAttribute('id', 'memex-direct-linking-tooltip')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('/content_script.css')
    injectCSS(cssFile)

    showTooltip = await setupUIContainer(target, {
        createAndCopyDirectLink,
        createAnnotation,
        openSettings: () => openOptionsRPC('settings'),
        destroyTooltip: async () => {
            manualOverride = true
            removeTooltip()

            const closeMessageShown = await _getCloseMessageShown()
            if (!closeMessageShown) {
                toolbarNotifications.showToolbarNotification(
                    'tooltip-first-close',
                )
                _setCloseMessageShown()
            }
        },
    })

    setupTooltipTrigger(showTooltip, toolbarNotifications)
    conditionallyTriggerTooltip({ callback: showTooltip, toolbarNotifications })
}

export const removeTooltip = () => {
    if (!target) {
        return
    }
    destroyTooltipTrigger()
    destroyUIContainer(target)
    target.remove()

    target = null
    showTooltip = null
}

/**
 * Inserts or removes tooltip from the page (if not overridden manually).
 * Should either be called through the RPC, or pass the `toolbarNotifications`
 * wrapped in an object.
 */
const insertOrRemoveTooltip = async ({ toolbarNotifications }) => {
    if (manualOverride) {
        return
    }

    const isTooltipEnabled = await getTooltipState()
    const isTooltipPresent = !!target

    if (isTooltipEnabled && !isTooltipPresent) {
        insertTooltip({ toolbarNotifications })
    } else if (!isTooltipEnabled && isTooltipPresent) {
        removeTooltip()
    }
}

/**
 * Sets up RPC functions to insert and remove Tooltip from Popup.
 */
export const setupRPC = ({ toolbarNotifications }) => {
    makeRemotelyCallable({
        showContentTooltip: async () => {
            if (!showTooltip) {
                await insertTooltip({ toolbarNotifications })
            }
            if (userSelectedText()) {
                const position = calculateTooltipPostion()
                showTooltip(position)
            }
        },
        insertTooltip: ({ override } = {}) => {
            manualOverride = !!override
            insertTooltip({ toolbarNotifications })
        },
        removeTooltip: ({ override } = {}) => {
            manualOverride = !!override
            removeTooltip()
        },
        insertOrRemoveTooltip: async () => {
            await insertOrRemoveTooltip({ toolbarNotifications })
        },
    })
}

/**
 * Checks for certain conditions before triggering the tooltip.
 * i) Whether the selection made by the user is just text.
 * ii) Whether the selected target is not inside the tooltip itself.
 *
 * Event is undefined in the scenario of user selecting the text before the
 * page has loaded. So we don't need to check for condition ii) since the
 * tooltip wouldn't have popped up yet.
 */
export const conditionallyTriggerTooltip = delayed(
    async ({ callback, toolbarNotifications }, event) => {
        if (!userSelectedText() || (event && isTargetInsideTooltip(event))) {
            return
        }

        /*
    If all the conditions passed, then this returns the position to anchor the
    tooltip. The positioning is based on the user's preferred method. But in the
    case of tooltip popping up before page load, it resorts to text based method
    */
        const positioning = await getPositionState()
        let position
        if (positioning === 'text' || !event) {
            position = calculateTooltipPostion()
        } else if (positioning === 'mouse' && event) {
            position = { x: event.pageX, y: event.pageY }
        }
        callback(position)

        // Trigger onboarding annotation after highlight tooltip.
        // Onboarding Demo stages
        const annotationStage = await getLocalStorage(
            STORAGE_KEYS.onboardingDemo.step1,
        )

        if (annotationStage === 'highlight_text_notification_shown') {
            // Remove previous notification
            toolbarNotifications._destroyRootElement()
            toolbarNotifications.showToolbarNotification(
                'onboarding-select-option',
                {
                    position,
                },
            )
            processEventRPC({
                type: EVENT_NAMES.ONBOARDING_HIGHLIGHT_MADE,
            })
            await setLocalStorage(
                STORAGE_KEYS.onboardingDemo.step1,
                'select_option_notification_shown',
            )
        }
    },
    300,
)

/**
 * Shows Toolbar notifications on website based on
 * onboarding flags set in local storage.
 * @param toolbarNotifications ToolbarNotification instance to trigger notification
 */
export const conditionallyShowOnboardingNotifications = async ({
    toolbarNotifications,
}) => {
    // Returns if the website is not the Memex Demo Wiki.
    if (window.location.href !== ANNOTATION_DEMO_URL) {
        return
    }

    const onboardingAnnotationStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step1,
        'unvisited',
    )
    const powerSearchStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step2,
    )

    if (onboardingAnnotationStage === 'highlight_text') {
        toolbarNotifications.showToolbarNotification('onboarding-higlight-text')
        await setLocalStorage(
            STORAGE_KEYS.onboardingDemo.step1,
            'highlight_text_notification_shown',
        )
    }

    /**
     * Trigger's the next notification which is seen after the user clicks
     * "browse around a bit" in Power Search welcome notification.
     */

    const triggerNextNotification = async () => {
        toolbarNotifications._destroyRootElement()
        toolbarNotifications.showToolbarNotification('go-to-dashboard')

        processEventRPC({
            type: EVENT_NAMES.POWERSEARCH_BROWSE_PAGE,
        })

        await setLocalStorage(
            STORAGE_KEYS.onboardingDemo.step2,
            'overview-tooltips',
        )
    }

    if (powerSearchStage === 'redirected') {
        const position = getPageCenter()
        toolbarNotifications._destroyRootElement()
        toolbarNotifications.showToolbarNotification('power-search-browse', {
            position,
            triggerNextNotification,
        })
        await setLocalStorage(
            STORAGE_KEYS.onboardingDemo.step2,
            'power-search-browse-shown',
        )
    }
}

export function calculateTooltipPostion() {
    const range = document.getSelection().getRangeAt(0)
    const boundingRect = range.getBoundingClientRect()
    // x = position of element from the left + half of it's width
    const x = boundingRect.left + boundingRect.width / 2
    // y = scroll height from top + pixels from top + height of element - offset
    const y = window.pageYOffset + boundingRect.top + boundingRect.height - 10
    return {
        x,
        y,
    }
}

function isAnchorOrContentEditable(selected) {
    // Returns true if the any of the parent is an anchor element
    // or is content editable.
    let parent = selected.parentElement
    while (parent) {
        if (parent.contentEditable === 'true' || parent.nodeName === 'A') {
            return true
        }
        parent = parent.parentElement
    }
    return false
}

export function userSelectedText() {
    const selection = document.getSelection()
    if (selection.type === 'None') {
        return false
    }

    const selectedString = selection.toString().trim()
    const container = selection.getRangeAt(0).commonAncestorContainer
    const extras = isAnchorOrContentEditable(container)

    const userSelectedText =
        !!selection && !selection.isCollapsed && !!selectedString && !extras
    return userSelectedText
}

function isTargetInsideTooltip(event) {
    const $tooltipContainer = document.querySelector(
        '#memex-direct-linking-tooltip',
    )
    if (!$tooltipContainer) {
        // edge case, where the destroy() is called
        return true
    }
    return $tooltipContainer.contains(event.target)
}
