# patternplate-transform-resolve-imports
[patternplate](/sinnerschrader/patternplate) transform pattern dependency imports to interoperable paths.

## Installation
```shell
npm install --save patternplate-transform-resolve-imports
```

## Transformation
### Input
```js
// foo/bar/foo/index.js
import foo from 'bar';
require('baz');
```
```js
// foo/bar/foo/pattern.json
{
	"name": "foo",
	"patterns": {
		"bar": "foo/bar/baz",
		"baz": "baz/bar/foo"
	}
}
```
### Output
```js
import foo from '../baz/index.js';
require('../../baz/bar/index.js');
```

### Parameters
```js
// configuration/patternplate-server/transforms.js
module.exports = {
	'resolve-imports': {
		'outFormat': 'js'
	}
}
```

---
Copyright 2016 by [SinnerSchrader Deutschland GmbH](https://github.com/sinnerschrader) and [contributors](./graphs/contributors). Released under the [MIT license]('./license.md').
