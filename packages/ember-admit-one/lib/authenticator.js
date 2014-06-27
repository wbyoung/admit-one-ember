'use strict';

import Auth from 'ember-tiny-auth';
import { extractAuthorizationHeader } from 'ember-admit-one/xhr';

var Authenticator = Auth.Authenticator.Base.extend({
  authenticate: function(credentials) {
    var settings = this.container.lookup('admit-one-settings:main');
    var authenticateURL = settings.api.authenticate;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.$.ajax(authenticateURL, {
        method: 'post',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ session: credentials })
      })
      .then(
        function(data, status, xhr) {
          var extracted = extractAuthorizationHeader(xhr);
          var token = extracted[0];
          resolve(Ember.$.extend({}, data.session, {
            token: token
          }));
        },
        function(xhr, status, error) { reject(error); });
    });
  },

  invalidate: function(/*data*/) {
    var settings = this.container.lookup('admit-one-settings:main');
    var invalidateURL = settings.api.invalidate;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.$.ajax(invalidateURL, {
        method: 'delete',
        contentType: 'application/json; charset=utf-8'
      })
      .then(
        function() { resolve(); },
        function(xhr, status, error) { reject(error); });
    });
  }
});

export default Authenticator;
