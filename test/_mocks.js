/* eslint-disable xo/filename-case */
import {getFile} from './_helpers';

export const application = {
	cache: {
		get() {
			return false;
		},
		set() {
		}
	},
	configuration: {}
};

export const misconfigured = {
	cache: {
		get() {
			return false;
		},
		set() {
		}
	},
	configuration: {
		transforms: {
			'resolve-imports': {
				foo: 'js'
			}
		}
	}
};

export const missingFormat = {
	cache: {
		get() {
			return false;
		},
		set() {
		}
	},
	configuration: {
		transforms: {
			'resolve-imports': {
				outFormat: 'js'
			}
		}
	}
};

export const configured = {
	cache: {
		get() {
			return false;
		},
		set() {
		}
	},
	configuration: {
		patterns: {
			formats: {
				js: {
					name: 'js'
				}
			}
		},
		transforms: {
			'resolve-imports': {
				outFormat: 'js'
			}
		}
	}
};

export const emptyFile = getFile({
	buffer: '',
	path: 'empty/index.js',
	pattern: {
		id: 'empty'
	},
	dependencies: {}
});

export const dependingFile = getFile({
	buffer: 'const empty = require("empty")',
	path: 'depending-file/index.js',
	pattern: {
		id: 'depending-file'
	},
	dependencies: {
		empty: emptyFile
	}
});

export const missingFile = getFile({
	buffer: 'const empty = require("missing")',
	path: 'depending-file/index.js',
	pattern: {
		id: 'depending-file'
	},
	dependencies: {
		empty: emptyFile
	}
});

export const externalFile = getFile({
	buffer: 'const _ = require("lodash")',
	path: 'external-file/index.js',
	pattern: {
		id: 'external-file'
	}
});

export const externalSubFile = getFile({
	buffer: 'const fp = require("lodash/fp")',
	path: 'external-file/index.js',
	pattern: {
		id: 'external-file'
	}
});

export const flowFile = getFile({
	buffer: `
		const empty = require('empty');
		type Empty = {};
	`,
	path: 'flow-file/index.js',
	pattern: {
		id: 'flow-file'
	},
	dependencies: {
		empty: emptyFile
	}
});
