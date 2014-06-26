# Admit One Ember

Ember extension for [Admit One][admit-one].

## Usage

```javascript
window.App = Ember.Application.create();
Ember.AdmitOne.setup();

// authenticate any route
App.ProfileRoute = Ember.Route.extend(Ember.AdmitOne.AuthenticatedRouteMixin, {
});

App.LoginController = Ember.Controller.extend({
  needs: ['application'],

  actions: {
    authenticate: function() {
      var self = this;
      var session = this.get('session');
      var credentials = this.getProperties('username', 'password');
      this.set('password', null);
      session.authenticate(credentials).then(function() {
        var attemptedTransition = self.get('attemptedTransition');
        if (attemptedTransition) {
          attemptedTransition.retry();
          self.set('attemptedTransition', null);
        } else {
          self.transitionToRoute('profile');
        }
      })
      .catch(function(error) {
        // handle error
      });
    }
  }
});

App.SignupController = Ember.ObjectController.extend({
  actions: {
    signup: function() {
      // observe token being read by authorizer so that it can be used to
      // log the user in. the request to create a user will come back with
      // the proper authorization header which we can then use to immediately
      // store authorization data.
      var token = null;
      this.get('session.authorizer').on('authorization-token', function(value) {
        token = value;
      });

      // create the user
      var self = this;
      this.get('model').save()
      .then(function() {
        if (!token) { throw new Error('missing token'); }
        self.get('session').set('content', {
          email: self.get('model.email'),
          token: token
        });
        self.transitionToRoute('dashboard');
      })
      .catch(function(error) {
        // handle error
      });
    }
  }
});
```

## Testing


Set up your main `application.js` file like so:

```javsacript
window.App = Ember.Application.create();

App.AuthConfiguration = {}; // overridable by tests
Ember.AdmitOne.setup(App.AuthConfiguration);
```

Then, in a test helper file that is included before your test files, but after
`application.js`, you can include the following:

```javsacript
// use ephemeral store for authentication data
Ember.Application.initializer({
  name: 'authentication-test',
  initialize: function(container, application) {
    var Ephemeral = Ember.AdmitOne.Storage.Base.extend({
      data: null,
      persist: function(data) { this.set('data', data); },
      restore: function() { return this.get('data'); },
      clear: function() { this.set('data'); }
    });
    application.register('auth-session-storage:ephemeral', Ephemeral);
    application.register('auth-session-storage:test', Ephemeral);
    App.AuthConfiguration.storage = 'auth-session-storage:test';
  }
});
```

To fake login:

```javascript
Ember.Test.registerHelper('applicationContainer', function(app) {
  return app.__container__;
});

var container = applicationContainer();
var session = container.lookup('auth-session:main');
session.set('content', {
  username: 'fak-username',
  token: 'fake-token'
});
```

## License

This project is distributed under the MIT license.


[admit-one]: https://github.com/wbyoung/admit-one
