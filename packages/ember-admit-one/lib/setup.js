'use strict';

var setup = function(options) {
  var opts = options || {};

  opts.containers = Ember.$.extend(opts.containers || {}, {
    authenticator: 'auth-session-authenticator:admit-one',
    authorizer: 'auth-session-authorizer:admit-one',
    storage: 'auth-session-storage:local'
  });

  if (Ember.typeOf(opts.api) === 'string') {
    opts.api = { endpoint: opts.api };
  }
  opts.api = opts.api || {};
  opts.api.endpoint = opts.api.endpoint || '/api';
  opts.api.authenticate = opts.api.authenticate ||
    opts.api.endpoint + '/sessions';
  opts.api.invalidate = opts.api.invalidate ||
    opts.api.endpoint + '/sessions/current';

  Ember.Application.initializer({
    name: 'admit-one',
    initialize: function(container, application) {
      var admit = Ember.AdmitOne;
      var Authenticator = admit.Authenticator;
      var Authorizer = admit.Authorizer;
      application.register('auth-session-authenticator:admit-one', Authenticator);
      application.register('auth-session-authorizer:admit-one', Authorizer);
      application.register('admit-one-settings:main', opts, { instantiate: false });
      Ember.TinyAuth.setup(container, application, opts.containers);
    }
  });
};

export default setup;
