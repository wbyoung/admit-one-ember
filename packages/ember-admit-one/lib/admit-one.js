'use strict';

/**
 * Admit One
 *
 */

import Auth from 'ember-tiny-auth';
import Authenticator from 'ember-admit-one/authenticator';
import Authorizer from 'ember-admit-one/authorizer';
import setup from 'ember-admit-one/setup';

var AdmitOne = {};

// expose everything in tiny-auth to admit-one users. we'll end up overwriting
// some of the pieces in here, but they'll serve the same purposes, and
// advanced uses should directly access tiny-auth.
Ember.$.extend(AdmitOne, Auth);

AdmitOne.Authenticator = Authenticator;
AdmitOne.Authorizer = Authorizer;
AdmitOne.setup = setup;

export default AdmitOne;
