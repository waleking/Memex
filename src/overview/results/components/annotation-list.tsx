import React, { Component, MouseEventHandler, Fragment } from 'react'
import cx from 'classnames'

import AnnotationBox from 'src/sidebar-common/annotation-box'
import { Annotation } from 'src/sidebar-common/sidebar/types'

const styles = require('./annotation-list.css')

export interface Props {
    /** Array of matched annotations, limited to 3 */
    annotations: Annotation[]
    /** Opens the annotation sidebar with all of the annotations */
    openAnnotationSidebar: MouseEventHandler
}

export interface State {
    /** Boolean to denote whether the list is expanded or not */
    isExpanded: boolean
}

class AnnotationList extends Component<Props, State> {
    state = {
        isExpanded: false,
    }

    handleArrowClick = () => {
        this.setState(
            (prevState: State): State => ({
                ...prevState,
                isExpanded: !prevState.isExpanded,
            }),
        )
    }

    renderAnnotations() {
        if (!this.state.isExpanded) {
            return null
        }

        return this.props.annotations.map(annot => (
            <AnnotationBox
                key={annot.url}
                className={styles.annotation}
                env="overview"
                handleGoToAnnotation={() => undefined}
                handleDeleteAnnotation={() => undefined}
                handleEditAnnotation={() => undefined}
                {...annot}
            />
        ))
    }

    renderText() {
        if (this.state.isExpanded) {
            return null
        }

        return (
            <Fragment>
                {/* Element to show the number of annotations that matched the term */}
                <p className={styles.resultCount}>
                    {this.props.annotations.length} annotations found on this
                    page
                </p>
                {/* Button to open sidebar with the given page URL */}
                <a
                    className={styles.seeAll}
                    onClick={this.props.openAnnotationSidebar}
                >
                    See all
                </a>
            </Fragment>
        )
    }

    render() {
        return (
            <div className={styles.container}>
                {this.renderText()}

                {/* Chevron up/down toggle button */}
                <div className={styles.iconContainer}>
                    <span
                        className={cx(styles.icon, {
                            [styles.inverted]: this.state.isExpanded,
                        })}
                        onClick={this.handleArrowClick}
                    />
                </div>

                {/* Container for displaying AnnotationBox */}
                <div className={styles.annotationList}>
                    {this.renderAnnotations()}
                </div>
            </div>
        )
    }
}

export default AnnotationList
