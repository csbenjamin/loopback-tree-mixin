TREE
=============

This module is designed for the [Strongloop Loopback](https://github.com/strongloop/loopback) framework.  It adds `lft` and `rgt` attributes to any Model and a relations belongsTo to itself with name `parent`.

This module is implemented with the `before save` [Operation Hook](http://docs.strongloop.com/display/public/LB/Operation+hooks#Operationhooks-beforesave) which is relatively new to the loopback framework so your loopback-datasource-juggler module must be greater than version [2.23.0](0002aaedeffadda34ae03752d03d0805ab661665).

INSTALL
=============

```bash
  npm install --save loopback-tree-mixin
```

MIXINSOURCES
=============
With [loopback-boot@v2.8.0](https://github.com/strongloop/loopback-boot/)  [mixinSources](https://github.com/strongloop/loopback-boot/pull/131) have been implemented in a way which allows for loading this mixin without changes to the `server.js` file previously required.

Add the `mixins` property to your `server/model-config.json` like the following:

```json
{
  "_meta": {
    "sources": [
      "loopback/common/models",
      "loopback/server/models",
      "../common/models",
      "./models"
    ],
    "mixins": [
      "loopback/common/mixins",
      "../node_modules/loopback-tree-mixin",
      "../common/mixins"
    ]
  }
}

CONFIG
=============

To use with your Models add the `mixins` attribute to the definition object of your model config.

```json
  {
    "name": "Category",
    "properties": {
      "name": {
        "type": "string",
      }
    },
    "mixins": {
      "Tree" : true
    }
  }
```

TESTING
=============

You'll need `jasmine-node` globally installed to run the tests which can be installed with this command: `npm install -g jasmine-node`.  This tool helps error checking.

Run the tests in `tree-spec.js`

```bash
  jasmine-node .
```

LICENSE
=============
[ISC](LICENSE)
