var deprecate = require('util').deprecate;

// this is used only to test
module.exports = function mixin(app) {
  app.loopback.modelBuilder.mixins.define('Tree', require('./tree'));
};
