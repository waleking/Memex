import ImportContainer from './imports'
import SettingsContainer from './containers/settings'
import ShareRatingsContainer from '../share-ratings/ShareRatingsContainer.jsx'

export default [
    {
        name: 'Import',
        pathname: '/import',
        component: ImportContainer,
    },
    {
        name: 'Settings',
        pathname: '/settings',
        component: SettingsContainer,
    },
    {
        name: 'Sharing Ratings',
        pathname: '/sharing-ratings',
        component: ShareRatingsContainer,
    },
]
