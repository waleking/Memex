<<<<<<< HEAD
import { Thunk } from './types'
import { actions as ribbonActions } from './ribbon'
import { actions as sidebarActions } from '../sidebar-common'

export const initState: () => Thunk = () => dispatch => {
    dispatch(ribbonActions.setIsExpanded(false))
    dispatch(sidebarActions.setSidebarOpen(false))
=======
import { getSidebarState } from '../utils'
import { getTooltipState } from '../../content-tooltip/utils'
import { Thunk } from '../types'
import { actions as ribbonActions } from '../ribbon'

/**
 * Hydrates the Redux store on initial startup.
 */
export const initState: () => Thunk = () => async dispatch => {
    const isRibbonEnabled = await getSidebarState()
    const isTooltipEnabled = await getTooltipState()

    dispatch(ribbonActions.setRibbonEnabled(isRibbonEnabled))
    dispatch(ribbonActions.setTooltipEnabled(isTooltipEnabled))
>>>>>>> Re-enable opening/closing sidebar & removal of ribbon
}
