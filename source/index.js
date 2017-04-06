import path from 'path';
import * as babylon from 'babylon';
import codeFrame from 'babel-code-frame';
import generate from 'babel-generator';
import traverse from 'babel-traverse';
import {isLiteral} from 'babel-types';
import r from 'resolve';
import {resolvePathFormatString} from 'patternplate-transforms-core';

const fstring = '%(outputName)s/%(patternId)s/index.%(extension)s';

const parserOpts = {
	sourceType: 'module',
	plugins: [
		'jsx',
		'flow',
		'doExpressions',
		'decorators',
		'classProperties',
		'exportExtensions',
		'asyncGenerators',
		'functionBind',
		'functionSent',
		'dynamicImport'
	]
};

export default app => {
	const context = {
		formats: selectFormats(app)
	};
	return resolveImportsTransform(context);
};

function resolveImportsTransform({formats}) {
	return async function(file, _, config) {
		if (!file) {
			throw new Error('rewrite-imports received invalid file');
		}

		if (!('buffer' in file) || !file.dependencies || !file.meta) {
			throw new Error('rewrite-imports received invalid file');
		}

		if (!config) {
			throw new Error('rewrite-imports is not configured in .transforms["resolve-imports"]');
		}

		const formatExtension = config.outFormat;

		if (!formatExtension) {
			throw new Error('rewrite-imports has no configured .outFormat.');
		}

		const source = file.buffer.toString('utf-8');
		const format = selectFormat(file.format, formats);
		const formatName = format.name;
		file.meta.dependencies = file.meta.dependencies || [];

		if (!formatName) {
			throw new Error(`format ${file.format} of ${file.pattern.id}:${file.path} is not configured. Available formats: ${Object.keys(formats).join(', ')}`);
		}

		const resolvePath = getResolvePath(fstring, formatName, formatExtension);

		// early exit if there is no require call
		if (!source.includes('require') && !source.includes('import')) {
			return file;
		}

		const ast = parse(source, parserOpts, file);
		const deps = await dependencies(ast, source);

		// Exit if no dependencies to process
		if (!deps.length) {
			return file;
		}

		// Rewrite imports if applicable
		const jobs = deps.map(async dep => {
			const [name, set] = dep;
			if (name in file.dependencies) {
				const dependency = file.dependencies[name];
				const sourcePath = path.dirname(resolvePath(file.pattern.id));
				const targetPath = path.dirname(resolvePath(dependency.pattern.id));
				const relativeId = path.relative(sourcePath, targetPath)
					.split(path.sep)
					.join('/');
				set(relativeId);
				return null;
			}
			// Check if this name is resolvable
			await resolvePackage(name);
			const [id] = name.split('/');
			if (!file.meta.dependencies.includes(id)) {
				file.meta.dependencies.push(id);
			}
			return null;
		});

		await Promise.all(jobs);
		file.buffer = generate(ast, {}, source).code;
		return file;
	};
}

function parse(source, opts, file) {
	try {
		return babylon.parse(source, opts);
	} catch (err) {
		err.message = [err.message, file.path].join('\n');
		if (err.loc) {
			const frame = codeFrame(source, err.loc.line, err.loc.column);
			err.message = [err.message, frame].join('\n');
		}
		throw err;
	}
}

function getResolvePath(fstring, formatName, formatExtension) {
	return id => {
		return resolvePathFormatString(fstring, id, formatName, formatExtension);
	};
}

function resolvePackage(id) {
	return new Promise((resolve, reject) => {
		const opts = {basedir: process.cwd()};
		r(id, opts, (error, result) => {
			if (error) {
				return reject(error);
			}
			resolve(result);
		});
	});
}

function set(leaf, key = 'value') {
	return value => {
		leaf[key] = value;
	};
}

// ast => [[name: string, set: (value) => void]]
function dependencies(ast, source) {
	const deps = [];

	traverse(ast, {
		ImportDeclaration(path) {
			deps.push([path.node.source.value, set(path.node.source)]);
		},
		ExportDeclaration(path) {
			if (path.node.source) {
				deps.push([path.node.source.value, set(path.node.source)]);
			}
		},
		CallExpression(path) {
			if (path.node.callee.name !== 'require') {
				return;
			}
			const [arg] = path.node.arguments;
			if (!isLiteral(arg)) {
				const frame = codeFrame(source, arg.loc.start.line, arg.loc.start.column);
				const error = new Error(`Dynamic require calls are not supported:\n${frame}`);
				error.loc = {
					line: arg.loc.start.line,
					column: arg.loc.start.column
				};
				throw error;
			}
			deps.push([arg.value, set(arg)]);
		}
	});

	return deps;
}

function selectFormats(app) {
	return ((app.configuration.patterns || {}).formats) || {};
}

function selectFormat(format, formats) {
	return formats[format] || {};
}
