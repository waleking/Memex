import React, { Component } from 'react'

import { routeTitle, sectionTitle } from '../options/base.css'
import styles from './ShareRatingsContainer.css'

import minixhr from 'minixhr'

const apiUrl = 'https://api.graph.cool/simple/v1/cj6smhqc40ehh0184ghuupaok'

// function listPersons () {
//     const request = {
//         url: apiUrl,
//         method: 'POST',
//         data: JSON.stringify({query: '{ allPersons { name } }'}),
//         headers: {'Content-Type': 'application/json'},
//     }
//     minixhr(request, (data, res, xhr, header) => {
//         console.log(data)
//     })
// }

function createPerson () {
    const username = document.querySelector('#usernameInput').value

    if (username.length > 0) {
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
            this.setState(this.state)
        })
    } else {
        console.log('Please provide a username.')
    }
}

class ShareRatingsContainer extends Component {
    constructor() {
        super()
        this.state = {}
    }

    renderAccountData() {
        chrome.storage.local.get('worldbrain_user', data => {
            const usernameCell = document.querySelector('#usernameField')
            const useridCell = document.querySelector('#useridField')
            const submitRow = document.querySelector('#submitRow')
            const user = data.worldbrain_user
            if (user && user.name && user.id) {
                usernameCell.innerHTML = user.name
                useridCell.innerHTML = user.id
                document.querySelector('tbody').removeChild(submitRow)
            }
        })

        return (
            <table>
                <tbody>
                    <tr>
                        <th>Username:</th>
                        <td id="usernameField"><input id="usernameInput" type="text" /></td>
                    </tr>
                    <tr>
                        <th>User ID:</th>
                        <td id="useridField">
                            <span className={styles.placeholder}>Will we generated automatically...</span>
                        </td>
                    </tr>
                    <tr id="submitRow">
                        <th />
                        <td><button onClick={createPerson.bind(this)}>Create User ID</button></td>
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
                    <h2 className={sectionTitle}>User Data</h2>
                    { this.renderAccountData() }
                </section>
            </div>
        )
    }
}

export default ShareRatingsContainer
