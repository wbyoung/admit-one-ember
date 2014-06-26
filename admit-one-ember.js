/**
 * Ember Tiny Auth
 *
 * TODO: eventually move this out into it's own code base
 */
(function() {

'use strict';

var Storage = {};
var Authenticator = {};
var Authorizer = {};


/**
 * Storage base class.
 *
 * @class
 * @abstract
 */
Storage.Base = Ember.Object.extend(Ember.Evented, {
  /**
   * Persist data. You should implement this function to persist the data
   * somehow between requests.
   *
   * @function
   * @abstract
   * @param {object} data Data to persist.
   */
  persist: function(/*data*/) { throw new Error('implement persist'); },

  /**
   * Restore data. You should implement this function to return data that was
   * previously persisted.
   *
   * @function
   * @abstract
   * @return {object} The previously persisted data.
   */
  restore: function() { throw new Error('implement restore'); },

  /**
   * Clear data. You should implement this function to clear data that was
   * previously persisted.
   *
   * @function
   * @abstract
   */
  clear: function() { throw new Error('implement clear'); }
});

Storage.Local = Storage.Base.extend({
  init: function() {
    this._super();
    this._watchStorage();
  },

  persist: function(data) {
    localStorage.setItem('auth-data', JSON.stringify(data));
  },

  restore: function() {
    return JSON.parse(localStorage.getItem('auth-data'));
  },

  clear: function() { localStorage.removeItem('auth-data'); },

  _watchStorage: function() {
    Ember.$(window).on('storage', function() {
      this.trigger('change');
    }.bind(this));
  }
});


/**
 * Authenticator base class.
 *
 * @class
 * @abstract
 */
Authenticator.Base = Ember.Object.extend({
  /**
   * Authenticate a user. This method must be implemented by a concrete
   * subclass of the base authenticator.
   *
   * @function
   * @abstract
   * @param {object} credentials Provided by the application and could vary.
   * Your authenticator should use these values to make a request to the server
   * and authenticate the user.
   * @return {Ember.RSVP.Promise} A promise that, when resolved, indicates that
   * the user has been authenticated and the application can begin to make
   * requests as that user. The data that this promise resolves with will be
   * stored in the session as `sessionData` which can later be used by the
   * authorizer to authorize requests.
   */
  authenticate: function(/*credentials*/) {
    return Ember.RSVP.reject('implement authenticate');
  },

  /**
   * Invalidate a session. This method may be implemented by a concrete
   * subclass of the base authenticator. An implementation, for instance, would
   * allow communicating with the server to invalidate the session or track
   * when a user logs out. Regardless of the server's response, the session
   * data will be cleared on the client side.
   *
   * @function
   * @return {Ember.RSVP.Promise} A promise that, when resolved, indicates that
   * the session has been invalidated. The promise need not be resolved with
   * any value.
   */
  invalidate: function(/*content*/) {
    return Ember.RSVP.resolve();
  }
});


/**
 * Authorizer base class. Base authorizer can be used, but does nothing.
 *
 * @class
 */
Authorizer.Base = Ember.Object.extend({
  /**
   * The session that should be used to store authorization data. This will be
   * set automatically, but you can use it from your implementation of
   * `authorize` in order to access or update the session's `authorizedData`.
   *
   * @type {Session}
   */
  session: function() {
    return this.container.lookup('auth-session:main');
  }.property(),

  /**
   * Setup AJAX requests to authorize users. During the authorization process
   * you can get or set `content` on the session to allow authorization to work
   * across multiple browser sessions.
   *
   * @function
   * @param {jqXHR} jqXHR jQuery XMLHTTPRequest object.
   * @param {object} requestOptions Request options.
   */
  authorize: function(/*jqXHR, requestOptions*/) {
  }
});

/**
 * Authentication Session. The session acts as a proxy to the underlying
 * content that's stored in the storage. You can therefore access data that's
 * been set on the session (which usually comes from resolution value of
 * Authenticator.prototype.authenticate). The underlying data should be
 * considered read-only. If you need to alter it, consider using
 * Session.prototype.integrateContent.
 *
 * @class
 */
var Session = Ember.ObjectProxy.extend({
  attemptedTransition: null,

  /**
   * @private
   * @type {Object}
   */
  content: {},

  init: function() {
    this._super();
    this._installPrefilter();
  },

  storage: function() {
    var options = this.container.lookup('auth-session-settings:main');
    return this.container.lookup(options.storage);
  }.property(),

  authenticator: function() {
    var options = this.container.lookup('auth-session-settings:main');
    return this.container.lookup(options.authenticator);
  }.property(),

  authorizer: function() {
    var options = this.container.lookup('auth-session-settings:main');
    return this.container.lookup(options.authorizer);
  }.property(),

  /**
   * Whether the user is authenticated.
   *
   * @return {boolean}
   */
  isAuthenticated: function() {
    return Ember.keys(this.get('content')).length > 0;
  }.property('content'),

  /**
   * Authenticate a user. This will result in the authenticator authenticating
   * the user using the given credentials. Successful resolution by the
   * authenticator will result in the resolve value being stored to the
   * configured storage.
   *
   * Once authenticated, you can access the `attemptedTransition` on the
   * session to see if you should redirect the user back to a route they were
   * trying to reach.
   *
   * @param {object} credentials Credentials that will be passed to the
   * authenticator.
   * @return {Ember.RSVP.Promise} A promise indicating wither or not the
   * underlying authenticator succeeded. The resolved value for the promise
   * will match that of what was given by the authenticator.
   */
  authenticate: function(credentials) {
    return this.get('authenticator').authenticate(credentials)
    .then(function(data) {
      this.set('content', data);
      return data;
    }.bind(this));
  },

  /**
   * Invalidate a session. This will result in the authenticator having an
   * opportunity to process invalidation. Session data will be cleared
   * regardless of whether the resulting promise resolves successfully or
   * rejects.
   *
   * @function
   * @return {Ember.RSVP.Promise} A promise indicating whether or not the
   * underlying authenticator succeeded.
   */
  invalidate: function() {
    var clear = function() {
      this.set('content', {});
      this.get('storage').clear();
    }.bind(this);
    return this.get('authenticator').invalidate(this.get('content'))
    .then(clear, function(e) { clear(); throw e; });
  },

  /**
   * Integrate new content. This method integrates the provided content into
   * the session's current content. It will add new values from the provided
   * content and overwrite any values in the current content with those from
   * the provided content. It does so shallowly. You should prefer this method
   * over other ways of merging content.
   *
   * Integration of content will only occur if the session is already
   * authenticated. Otherwise the content will simply be ignored.
   *
   * @function
   * @param {object} content New content values to integrate.
   */
  integrateContent: function(content) {
    if (this.get('isAuthenticated')) {
      this.set('content', Ember.$.extend({}, content, this.get('content')));
    }
  },

  /**
   * Restores the session's content to what's stored in the storage.
   *
   * @function
   */
  restore: function() {
    var storage = this.get('storage');
    var content = storage.restore() || {};
    this.set('content', content);
  },

  /**
   * Restores the session's content and observes changes to the storage as
   * well. Changes to the storage will cause an automatic restore.
   *
   * @function
   * @private
   */
  observeStorage: function() {
    var storage = this.get('storage');
    storage.off('change', this, this.restore);
    storage.on('change', this, this.restore);
  },

  _contentChanged: function() {
    this.get('storage').persist(this.get('content'));
  }.observes('content'),

  _installPrefilter: function() {
    Ember.$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
      if (this.isDestroyed || options.crossDomain) { return; }
      this.get('authorizer').authorize(jqXHR, options);
    }.bind(this));
  }
});


/**
 * Authenticated Route Mixin. This should be used to protect routes that
 * require authentication. This will set the property `attemptedTransition`
 * on the session which you can use from your route that actual performs
 * authentication to transition back to where the user came from.
 *
 * @type Mixin
 */
var AuthenticatedRouteMixin = Ember.Mixin.create({
  beforeModel: function(transition) {
    this._super();
    if (!this.get('session').get('isAuthenticated')) {
      this.get('session').set('attemptedTransition', transition);
      this.transitionTo('login');
    }
  }
});


/**
 * Setup function. Sets up all required functionality for authentication
 * support and makes `session` available on controllers and routes.
 *
 * @function
 * @param {Ember.Container} container
 * @param {Ember.Application} application
 * @param {string} [options.authenticator] Authenticator factory
 * @param {string} [options.authorizer] Authorizer factory
 * @param {string} [options.storage] Storage factory
 */
var setup = function(container, application, options) {
  var opts = Ember.$.extend({}, {
    authenticator: 'auth-session-authenticator:base',
    authorizer: 'auth-session-authorizer:base',
    storage: 'auth-session-storage:local'
  }, options);
  application.register('auth-session-settings:main', opts, { instantiate: false });
  application.register('auth-session:main', Session);
  application.register('auth-session-authenticator:base', Authenticator);
  application.register('auth-session-authorizer:base', Authorizer);
  application.register('auth-session-storage:local', Storage.Local);
  application.inject('controller', 'session', 'auth-session:main');
  application.inject('route', 'session', 'auth-session:main');

  var session = container.lookup('auth-session:main');
  session.restore();
  session.observeStorage();
};

Ember.TinyAuth = {
  setup: setup,
  Storage: Storage,
  Authenticator: Authenticator,
  Authorizer: Authorizer,
  AuthenticatedRouteMixin: AuthenticatedRouteMixin
};

}());

/**
 * Admit One
 *
 * TODO: make API endpoints customizable
 */
(function() {
'use strict';

var Auth = Ember.TinyAuth;
var AdmitOne = Ember.AdmitOne = Ember.AdmitOne || {};

var extractAuthorizationHeader = function(xhr) {
  var authorization = xhr.getResponseHeader('Authorization');
  var tokenMatch = authorization && authorization.match(/\s*token\s+(.*)\s*/i);
  var token = tokenMatch && tokenMatch[1];
  var invalidated = authorization && !!authorization.match(/\s*invalidated\s*/i);
  return [token, invalidated];
};

AdmitOne.Authenticator = Auth.Authenticator.Base.extend({
  authenticate: function(credentials) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.$.ajax('/api/v1/sessions', {
        method: 'post',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ session: credentials })
      })
      .then(
        function(data, status, xhr) {
          var extracted = extractAuthorizationHeader(xhr);
          var token = extracted[0];
          resolve({
            email: data.session.email,
            token: token
          });
        },
        function(xhr, status, error) { reject(error); });
    });
  },

  invalidate: function(/*data*/) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.$.ajax('/api/v1/sessions/current', {
        method: 'delete',
        contentType: 'application/json; charset=utf-8'
      })
      .then(
        function() { resolve(); },
        function(xhr, status, error) { reject(error); });
    });
  }
});

AdmitOne.Authorizer = Auth.Authorizer.Base.extend(Ember.Evented, {

  /**
   * Handle authentication token for all incoming and outgoing ajax requests.
   * Store the token when we receive it, and send it in all future requests.
   * Clear the token when it's invalidated.
   */
  authorize: function(jqXHR, options) {
    var session = this.get('session');
    var token = session.get('token');
    if (token) {
      options.beforeSend = (function(beforeSend) {
        return function(xhr) {
          xhr.setRequestHeader('Authorization', 'Token ' + token);
          return beforeSend.apply(this, arguments);
        };
      })(options.beforeSend || function() {});
    }

    options.success = options.success || [];
    options.success = Ember.$.isArray(options.success) ? options.success : [options.success];
    options.success.unshift(function(data, status, xhr) {
      var extracted = extractAuthorizationHeader(xhr);
      var token = extracted[0];
      var invalidated = extracted[1];
      if (invalidated) { session.invalidate(); }
      else if (token) {
        this.trigger('authorization-token', token);
        session.integrateContent({ token: token });
      }
    }.bind(this));
  }

});

}());


/**
 * Admit One Initialization
 */
(function() {

Ember.AdmitOne.setup = function(configuraiton) {
  Ember.$.extend(configuraiton, {
    authenticator: 'auth-session-authenticator:admit-one',
    authorizer: 'auth-session-authorizer:admit-one',
    storage: 'auth-session-storage:local'
  });
  Ember.Application.initializer({
    name: 'admit-one',
    initialize: function(container, application) {
      var admit = Ember.AdmitOne;
      var Authenticator = admit.Authenticator;
      var Authorizer = admit.Authorizer;
      application.register('auth-session-authenticator:admit-one', Authenticator);
      application.register('auth-session-authorizer:admit-one', Authorizer);
      Ember.TinyAuth.setup(container, application, configuraiton);
    }
  });
};

}());
