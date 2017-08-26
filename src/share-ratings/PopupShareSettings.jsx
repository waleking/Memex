import React, { Component } from 'react'

import styles from './PopupShareSettings.css'

const users = [
    'Alex',
    'Sandra',
    'Marta',
    'Max',
]

class PopupShareSettings extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    renderChildren() {
        return users.map((user, i) => {
            return (<li key={i} className={styles.userEntry}>
                <div className={styles.userPicture} />
                <div className={styles.userName}>
                    {user}
                </div>
            </li>)
        })
    }

    render() {
        return (
            <div>
                <h3 className={styles.title}>Ratings from your Network</h3>
                <hr />
                <div className={styles.votesContainer}>
                    <div className={styles.voteField}><i className='material-icons'>keyboard_arrow_up</i></div>
                    <div className={styles.voteField}>2</div>
                    <div className={styles.voteField}>3</div>
                    <div className={styles.voteField}><i className='material-icons'>keyboard_arrow_down</i></div>
                </div>
                <ul className={styles.usersList}>
                    {this.renderChildren()}
                </ul>
            </div>
        )
    }
}

export default PopupShareSettings
