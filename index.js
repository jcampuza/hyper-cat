const fetch = require('node-fetch');

const HYPER_CAT_FETCHING = 'HYPER_CAT/fetch';
const HYPER_CAT_SUCCESS = 'HYPER_CAT/success';
const HYPER_CAT_FAILURE = 'HYPER_CAT/failure';
const HYPER_CAT_URL = 'HYPER_CAT/url';
const HYPER_CAT_CLEAR = 'HYPER_CAT/clear_url';

async function fetchCatUrl(dispatch) {
    dispatch({ type: HYPER_CAT_FETCHING, payload: true });
    try {
        const { url } = await fetch('http://thecatapi.com/api/images/get?format=src&type=gif&size=small')
        dispatch({ type: HYPER_CAT_SUCCESS, payload: url });
    } catch (err) {
        dispatch({ type: HYPER_CAT_FAILURE, error: true, payload: err });
    } finally {
        dispatch({ type: HYPER_CAT_FETCHING, payload: false });
    };
}

function clearCatUrl(dispatch) {
    dispatch({ type: HYPER_CAT_CLEAR });
}

function bindActionToDispatch(dispatch, fn) {
    return () => fn(dispatch);
}

exports.middleware = ({ dispatch }) => (next) => async (action) => {
    if ('SESSION_ADD_DATA' === action.type) {
        const { data } = action;

        if ((/hyper-cat: command not found/.test(data))) {
            fetchCatUrl(dispatch);
        } else if ((/hyper-cat-clear: command not found/.test(data))) {
            clearCatUrl(dispatch);
        } else {
            next(action);
        }
    } else {
        next(action);
    }
}

exports.reduceUI = (state, action) => {
    switch (action.type) {
        case HYPER_CAT_FETCHING: {
            return state.set(HYPER_CAT_FETCHING, action.payload);
        }

        case HYPER_CAT_SUCCESS: {
            return state.set('catUrl', action.payload);
        }

        case HYPER_CAT_FAILURE: {
            return state.set(HYPER_CAT_FAILURE, action.payload);
        }

        case HYPER_CAT_CLEAR: {
            return state.set('catUrl', '');
        }
    }

    return state;
}

exports.mapTermsState = (state, map) => {
    return Object.assign(map, {
        catUrl: state.ui.catUrl
    });
}

exports.mapTermsDispatch = (dispatch, map) => {
    return Object.assign(map, {
        clearCat: bindActionToDispatch(dispatch, clearCatUrl)
    });
}

const passProps = (uid, parentProps, props) => {
    return Object.assign(props, {
        catUrl: parentProps.catUrl,
        clearCat: parentProps.clearCat
    });
}

exports.getTermProps = passProps
exports.getTermGroupProps = passProps

exports.decorateTerm = (Term, { React, notify }) => {
    return class extends React.Component {
        constructor(props, context) {
            super(props, context);
        }

        onTerminal() {
            if (this.props.onTerminal) this.props.onTerminal();
        }

        render() {
            const { catUrl } = this.props;

            const children = [
                React.createElement(Term, Object.assign({}, this.props))
            ];

            if (!catUrl) {
                return children[0];
            }

            const image = React.createElement('img', {
                style: {
                    maxWidth: '100%',
                    maxHeight: '100%'
                },
                src: catUrl,
                onClick: this.props.clearCat
            });

            const imageContainer = React.createElement('div', { style: {
                position: 'absolute',
                right: 5,
                bottom: 5,
                width: 125,
                height: 125,
                backgroundColor: 'transparent'
            }}, image);

            children.push(imageContainer);

            return React.createElement('div', { style: {
                width: '100%',
                height: '100%',
                position: 'relative'
            }}, children);
        }
    }
}
