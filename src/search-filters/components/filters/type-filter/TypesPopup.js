import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
// import ReactDOM from 'react-dom'

import styles from '../../stylesheets/type-filter-styles/TypesPopup.module.css'

class TypesPopup extends PureComponent {
    static propTypes = {
        prevTypes: PropTypes.object.isRequired,
        unSelect: PropTypes.bool.isRequired,
        checkCount: PropTypes.func.isRequired,
        typeStatus: PropTypes.object.isRequired,
        showPopup: PropTypes.bool.isRequired,
    }

    state = {
        type: {
            websites: false,
            highlights: false,
            comments: false,
            memex: false,
        },
        showPopup: false,
    }

    selectedType = ev => {
        const { name } = ev.target
        if (name === 'websites') {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.websites,
                },
            }))
        } else if (name === 'highlights') {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.highlights,
                },
            }))
        } else if (name === 'comments') {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.comments,
                },
            }))
        } else {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.memex,
                },
            }))
        }
    }

    componentDidMount() {
        const types = {
            websites: false,
            highlights: false,
            comments: false,
            memex: false,
        }
        const typ = {
            ...this.state.type,
            websites: this.props.prevTypes.websites,
            comments: this.props.prevTypes.comments,
            highlights: this.props.prevTypes.highlights,
            memex: this.props.prevTypes.memex,
        }
        // console.log(this.props.prevTypes)
        if (this.props.unSelect) {
            this.setState({
                type: types,
                showPopup: false,
            })
        } else {
            this.setState({
                type: typ,
            })
        }
    }

    render() {
        let show = null
        let count = 0
        const arr = Object.values(this.state.type)
        arr.map((type, index) => {
            if (type && index < 4) {
                count++
            }
        })
        this.props.checkCount(count)
        this.props.typeStatus(this.state.type)

        console.log(this.props.prevTypes)

        if (this.props.showPopup) {
            show = (
                <div className={styles.typesStyle}>
                    <div className={styles.tagName1}>
                        <p>Websites</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="websites"
                                checked={this.props.prevTypes.websites}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>

                    <div className={styles.tagName}>
                        <p>Highlights</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="highlights"
                                checked={this.props.prevTypes.highlights}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>

                    <div className={styles.tagName}>
                        <p>Comments</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="comments"
                                checked={this.props.prevTypes.comments}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>

                    <div className={styles.tagName4}>
                        <p>Memex.links</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="memex"
                                checked={this.props.prevTypes.memex}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>
                </div>
            )
        }
        return <div>{show}</div>
    }
}

export default TypesPopup