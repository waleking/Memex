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
            this.forceUpdate()
        })
    } else {
        console.log('Please provide a username.')
    }
}

function addUserToChromeStorage (id, name) {
    console.log('addUserToChromeStorage')
    chrome.storage.local.get('worldbrain_network', (function (data) {
        data.worldbrain_network = data.worldbrain_network || []
        var alreadyInList = false
        data.worldbrain_network.forEach(user => {
            if (user.id === id) {
                alreadyInList = true
            }
        })
        if (!alreadyInList) {
            data.worldbrain_network.push({id, name})
            chrome.storage.local.set({worldbrain_network: data.worldbrain_network})
            this.forceUpdate()
            console.log(`${name} was added to your network.`)
            document.querySelector('#addUserInput').value = ''
        } else {
            console.log('Error: there is already a user with this Id.')
        }
    }).bind(this))
}

function addUserToNetwork () {
    const addUserInput = document.querySelector('#addUserInput')
    const id = addUserInput.value
    
    if (id.length > 0) {
        const request = {
            url: apiUrl,
            method: 'POST',
            data: JSON.stringify({query: `{ allPersons ( filter: { id: "${id}" } ) { name } }`}),
            headers: {'Content-Type': 'application/json'},
        }
        minixhr(request, (function (data, res, xhr, header) {
            data = JSON.parse(data)
            console.log(data)
            const allPersons = data.data.allPersons
            if (allPersons) {
                if (allPersons.length === 1) {
                    addUserToChromeStorage.bind(this)(id, allPersons[0].name)
                } else {
                    console.log('Error: there should be exactly one user which this Id, found:', allPersons.length)
                }
            } else {
                console.log('Error: data.allPersons is undefined.')
            }
        }).bind(this))
    } else {
        console.log('Please provide a user id.')
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
            const user = data.worldbrain_user
            if (user && user.name && user.id) {
                usernameCell.innerHTML = user.name
                useridCell.innerHTML = user.id
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
                            <button onClick={createPerson.bind(this)}>Create User ID</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }

    renderNetwork() {
        function createNetworkRow (name, id) {
            const thName = document.createElement('th')
            thName.innerHTML = name
            const tdId = document.createElement('td')
            tdId.innerHTML = id
            const tr = document.createElement('tr')
            tr.appendChild(thName)
            tr.appendChild(tdId)
            return tr
        }

        chrome.storage.local.get('worldbrain_network', (function (data) {
            const table = this.refs.usersTable
            const tbody = table.querySelector('tbody')
            tbody.innerHTML = ''
            if (data && data.worldbrain_network) {
                const rows = data.worldbrain_network.forEach(user => {
                    const tr = createNetworkRow(user.name, user.id)
                    tbody.appendChild(tr)
                })
            }
        }).bind(this))

        return (
            <div>
                <table className={styles.addUserTable}>
                    <thead>
                        <tr className={styles.addUserRow}>
                            <th className={styles.addUserLabel}>Add User:</th>
                            <td className={styles.addUserInput}><input id="addUserInput" type="text" placeholder="User ID"/></td>
                            <td className={styles.addUserButton}><button onClick={addUserToNetwork.bind(this)}>Add User</button></td>
                        </tr>
                    </thead>
                </table>
                <hr />
                <table ref="usersTable" id="#usersTable" className={styles.usersTable}>
                    <tbody>
                    </tbody>
                </table>
            </div>
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
                <section className={styles.section}>
                    <h2 className={sectionTitle}>Your Network</h2>
                    { this.renderNetwork.bind(this)() }
                </section>
            </div>
        )
    }
}

export default ShareRatingsContainer
