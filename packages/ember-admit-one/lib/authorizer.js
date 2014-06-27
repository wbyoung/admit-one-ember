'use strict';

import Auth from 'ember-tiny-auth';
import { extractAuthorizationHeader } from 'ember-admit-one/xhr';

var Authorizer = Auth.Authorizer.Base.extend(Ember.Evented, {

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
        this.set('capturedAuthorization', { token: token });
        session.integrateContent({ token: token });
      }
    }.bind(this));
  }

});

export default Authorizer;
