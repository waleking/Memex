import React, { Component } from 'react'

import styles from './PopupShareSettings.css'

const worldbrain_network = [
    'Alex',
    'Sandra',
    'Marta',
    'Max',
]

class PopupShareSettings extends Component {
    constructor() {
        super()
        this.state = {}
    }

    renderChildren() {
        return worldbrain_network.map((user, i) => {
            return (<li key={i} className={styles.userEntry}>
                <div className={styles.userPicture} />
                <div className={styles.userName}>
                    {user}
                </div>
            </li>)
        })
    }

    upvoteSite() {
        console.log('Upvote')
    }

    downvoteSite() {
        console.log('Downvote')
    }

    render() {
        return (
            <div>
                <h3 className={styles.title}>Ratings from your Network</h3>
                <hr />
                <div className={styles.votesContainer}>
                    <a className={`${styles.voteField} ${styles.voteButton}`} onClick={this.upvoteSite}>
                        <i className='material-icons'>keyboard_arrow_up</i>
                    </a>
                    <div className={styles.voteField}>2</div>
                    <div className={styles.voteField}>2</div>
                    <a className={`${styles.voteField} ${styles.voteButton}`} onClick={this.downvoteSite}>
                        <i className='material-icons'>keyboard_arrow_down</i>
                    </a>
                </div>
                <ul className={styles.usersList}>
                    {this.renderChildren()}
                </ul>
            </div>
        )
    }
}

export default PopupShareSettings
