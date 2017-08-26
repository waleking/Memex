import React, { Component } from 'react'

import styles from './PopupShareSettings.css'

import minixhr from 'minixhr'

const apiUrl = 'https://api.graph.cool/simple/v1/cj6smhqc40ehh0184ghuupaok'

const users = [
    'cj6ssbxgc9ro201641e08gdt9',
    'cj6so9jvh0h830156udspa1hd',
    'cj6sxz9o1iyrc0143ob0kre90',
    'cj6t2y4muraug01431glom6nm',
    'cj6t2xr4kqkry0162oj6wrmve',
    'cj6t62xnnvq170179dxpbppj9'
]

class PopupShareSettings extends Component {
    constructor(props) {
        super(props)
        this.state = {}
        //this.ural = 'fj'
    }

    renderChildren() {
        return users.map((user, i) => {
            return (<li key={i} className={styles.userEntry}>
                <div className={styles.userPicture} />
                <div className={styles.userName}>
                    {user.name}
                </div>
            </li>)
        })
    }

    rate(rating) {

        this.getRatings();

        if (!rating) rating = 0
        console.log('vote ', rating)

        var url = ''
        chrome.tabs.getSelected(null, tab => {
            url = tab.url
        })

        chrome.storage.local.get('worldbrain_user', data => {
            const user = data.worldbrain_user
            if (user && user.name && user.id) {
                const request = {
                    url: apiUrl,
                    method: 'POST',
                    data: JSON.stringify({query: `mutation{createRating(personId:"${user.id}", rating:${rating}, urlHash:"${url}") {
                      id
                    }}`}),
                    headers: {'Content-Type': 'application/json'},
                }
                console.log(request.data)
                minixhr(request, (data, res, xhr, header) => {
                    console.log(data)
                    data = JSON.parse(data)
                    console.log('rating for url:0 ')
                })
            } else {
                console.log('Please provide a username.')
            }
        })
    }

    getRatings(){
        var url = ''
        chrome.tabs.getSelected(null, tab => {
            url = tab.url
            const request = {
                url: apiUrl,
                method: 'POST',
                data: JSON.stringify({query: `{allRatings (filter: {AND:[{urlHash: "${url}"},{person: {id_in: ["${users.join('","')}"] }}]}) {rating urlHash person{name}} }`}),
                headers: {'Content-Type': 'application/json'},
            }
            console.log(request.data)
            minixhr(request, (data, res, xhr, header) => {
                console.log(data)
                data = JSON.parse(data)
                this.setState({ratings:data})
                console.log('ratings')
            })
        })
    }

    componentDidMount() {
        this.getRatings()
    }

    render() {
        console.log(this.state);
        return (
            <div>
                <h3 className={styles.title}>Ratings from your Network</h3>
                <hr />
                <div className={styles.votesContainer}>
                    <div onClick={()=>{this.rate(1)}} className={styles.voteField}><i className='material-icons'>keyboard_arrow_up</i></div>
                    <div className={styles.voteField}>2</div>
                    <div className={styles.voteField}>3</div>
                    <div onClick={()=>{this.rate(-1)}}  className={styles.voteField}><i className='material-icons'>keyboard_arrow_down</i></div>
                </div>
                <ul className={styles.usersList}>
                    {this.renderChildren()}
                </ul>
            </div>
        )
    }
}

export default PopupShareSettings
