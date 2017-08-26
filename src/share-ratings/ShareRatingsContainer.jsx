import React from 'react'

import { routeTitle, sectionTitle } from '../options/base.css'
import styles from './ShareRatingsContainer.css'

function toggleSharing (event) {
    var checkbox = document.querySelector('#enableSharingCheckbox')
    console.log(checkbox)
    // var sharingEnabled = parseInt(localStorage.getItem('sharingEnabled'))
    // if (sharingEnabled === 0) {
    //     sharingEnabled = 1
    // } else {
    //     sharingEnabled = 0
    // }
    // localStorage.setItem('sharingEnabled', parseInt(sharingEnabled))
    // checkbox.checked = !!sharingEnabled
}

function sharingEnabled () {
    const value = !!parseInt(localStorage.getItem('sharingEnabled'))
    console.log(value)
    return value
}

function onClickButton (event) {
    console.log('Yeah, you clicked me!')
}

const ShareRatingsContainer = () => (
    <div>
        <h1 className={routeTitle}>Sharing Ratings</h1>
        <section className={styles.section}>
            <h2 className={sectionTitle}>Enable Sharing</h2>
            <input
                id='enableSharingCheckbox'
                type='checkbox'
                onChange={toggleSharing}
                checked={sharingEnabled()}
            />
            <label htmlFor='enableSharingCheckbox'>Sharing enabled</label>
        </section>
        <section className={styles.section}>
            <button onClick={onClickButton}>Button</button>
        </section>
    </div>
)

export default ShareRatingsContainer
