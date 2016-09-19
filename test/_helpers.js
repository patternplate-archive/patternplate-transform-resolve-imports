/* eslint-disable xo/filename-case */
import {merge} from 'lodash';

export function getFile(extender) {
	const file = {
		format: 'js',
		path: 'mocks/index.js',
		pattern: {
			id: 'mocks'
		},
		dependencies: {},
		meta: {
			dependencies: []
		}
	};
	return merge({}, file, extender);
}

export function selectConfig(app) {
	const config = app.configuration || {};
	const transforms = config.transforms || {};
	return transforms['resolve-imports'];
}
