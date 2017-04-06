import test from 'ava';
import factory from '../source';
import {selectConfig} from './_helpers';
import * as mocks from './_mocks';

test('it should export a function as default', t => {
	const actual = typeof factory;
	const expected = 'function';
	t.deepEqual(actual, expected);
});

test('calling the function should return a function', t => {
	const actual = typeof factory(mocks.application);
	const expected = 'function';
	t.deepEqual(actual, expected);
});

test('calling the returned function should return a promise', t => {
	const transform = factory(mocks.configured);
	const actual = transform(mocks.emptyFile, null, selectConfig(mocks.configured)).constructor.name;
	const expected = 'Promise';
	t.deepEqual(actual, expected);
});

test('the returned promise should reject when not configured', async t => {
	const transform = factory(mocks.application);
	t.throws(transform(mocks.emptyFile, null, selectConfig(mocks.application)), /not configured in/);
});

test('the returned promise should reject when no outformat is configured', async t => {
	const transform = factory(mocks.misconfigured);
	t.throws(transform(mocks.emptyFile, null, selectConfig(mocks.misconfigured)), /no configured .outFormat/);
});

test('the returned promise should reject when no matching format is configured', async t => {
	const transform = factory(mocks.missingFormat);
	t.throws(transform(mocks.emptyFile, null, selectConfig(mocks.missingFormat)), /is not configured. Available formats:/);
});

test('the returned promise should reject when no file is given', async t => {
	const transform = factory(mocks.missingFormat);
	t.throws(transform(null, null, selectConfig(mocks.missingFormat)), /invalid file/);
});

test('a simple pattern dependency should be resolved correctly', async t => {
	const transform = factory(mocks.configured);
	const file = await transform(mocks.dependingFile, null, selectConfig(mocks.configured));
	t.is(file.buffer, 'const empty = require("../empty");');
});

test('a missing pattern dependency should throw', async t => {
	const transform = factory(mocks.configured);
	t.throws(transform(mocks.missingFile, null, selectConfig(mocks.missingFormat)), /Cannot find module 'missing'/);
});

test('an external dependency should be regeistered', async t => {
	const transform = factory(mocks.configured);
	const result = await transform(mocks.externalFile, null, selectConfig(mocks.configured));
	t.deepEqual(result.meta.dependencies, ['lodash']);
});

test('an external dependency should be regeistered exactly once', async t => {
	const transform = factory(mocks.configured);
	const result = await transform(mocks.externalFile, null, selectConfig(mocks.configured));
	await transform(mocks.externalFile, null, selectConfig(mocks.configured));
	t.deepEqual(result.meta.dependencies, ['lodash']);
});

test('an external dependency with subpaths should be registered with package name', async t => {
	const transform = factory(mocks.configured);
	const result = await transform(mocks.externalSubFile, null, selectConfig(mocks.configured));
	await transform(mocks.externalSubFile, null, selectConfig(mocks.configured));
	t.deepEqual(result.meta.dependencies, ['lodash']);
});

test('should not throw for flow syntax', async t => {
	const transform = factory(mocks.configured);
	t.notThrows(transform(mocks.flowFile, null, selectConfig(mocks.configured)));
});
