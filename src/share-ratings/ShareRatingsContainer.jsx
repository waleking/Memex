import React, { Component } from 'react'

import { routeTitle, sectionTitle } from '../options/base.css'
import styles from './ShareRatingsContainer.css'

import minixhr from 'minixhr'

const apiUrl = 'https://api.graph.cool/simple/v1/cj6smhqc40ehh0184ghuupaok'

function listPersons () {
    const request = {
        url: apiUrl,
        method: 'POST',
        data: JSON.stringify({query: '{ allPersons { name } }'}),
        headers: {'Content-Type': 'application/json'},
    }
    minixhr(request, (data, res, xhr, header) => {
        console.log(data)
    })
}

function createPerson () {
    const cell = document.querySelector('#usernameField')
    const username = cell.innerHTML

    const request = {
        url: apiUrl,
        method: 'POST',
        data: JSON.stringify({query: `mutation { createPerson ( name: "${username}" ) { id } }`}),
        headers: {'Content-Type': 'application/json'},
    }
    minixhr(request, (data, res, xhr, header) => {
        data = JSON.parse(data)
        const id = data.data.createPerson.id
        console.log('Person created with username:', id)
        chrome.storage.local.set({worldbrain_user: {id, name: username}})
    })
}

class ShareRatingsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    renderAccountData() {
        chrome.storage.local.get('worldbrain_user', data => {
            const usernameCell = document.querySelector('#usernameField')
            const useridCell = document.querySelector('#useridField')
            const user = data.worldbrain_user
            if (user && user.name && user.id) {
                usernameCell.innerHTML = user.name
                useridCell.innerHTML = user.id
            } else {
                usernameCell.innerHTML = ''
                useridCell.innerHTML = ''
            }
        })

        return (
            <table>
                <tbody>
                    <tr>
                        <th>User Name:</th>
                        <td id="usernameField">Pepe</td>
                    </tr>
                    <tr>
                        <th>User ID:</th>
                        <td id="useridField">BV5483JKH45678VJ3456</td>
                    </tr>
                    <tr>
                        <th />
                        <td><button onClick={createPerson}>Create User ID</button></td>
                    </tr>
                </tbody>
            </table>
        )
    }

    render() {
        return (
            <div>
                <h1 className={routeTitle}>Sharing Ratings</h1>
                <section className={styles.section}>
                    <h2 className={sectionTitle}>Enable Sharing</h2>
                    <input id='enableSharingCheckbox' type='checkbox' />
                    <label htmlFor='enableSharingCheckbox'> Sharing enabled</label>
                </section>
                <section className={styles.section}>
                    <h2 className={sectionTitle}>User Data</h2>
                    { this.renderAccountData() }
                </section>
            </div>
        )
    }
}

export default ShareRatingsContainer
