import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import { rootReducer } from './ribbon-sidebar-controller'

const configureStore = () => {
    const middlewares = [thunk]

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}

export default configureStore
