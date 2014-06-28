# Admit One Ember

Ember extension for [Admit One][admit-one].

## Usage

The following code shows example routes, models, and controllers to get you
started using Admit One with Ember:

```javascript
window.App = Ember.Application.create();
Ember.AdmitOne.setup();

App.Router.map(function() {
  this.route('signup');
  this.route('login');
  this.route('logout');
  this.route('profile');
});

App.ApplicationAdapter = DS.RESTAdapter.extend({
  namespace: 'api'
});

// authenticate any route
App.ProfileRoute = Ember.Route.extend(Ember.AdmitOne.AuthenticatedRouteMixin, {
});

App.User = DS.Model.extend({
  username: DS.attr('string'),
  password: DS.attr('string')
});

App.LoginRoute = Ember.Route.extend({
  beforeModel: function() {
    this._super();
    if (this.get('session').get('isAuthenticated')) {
      this.transitionTo('profile');
    }
  }
});

App.LoginController = Ember.Controller.extend({
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

App.LogoutRoute = Ember.Route.extend({
  beforeModel: function() {
    this._super();
    var self = this;
    var session = this.get('session');
    return session.invalidate().finally(function() {
      self.transitionTo('index');
    });
  }
});

App.SignupRoute = Ember.Route.extend({
  model: function() {
    return this.store.createRecord('user');
  }
});

App.SignupController = Ember.ObjectController.extend({
  actions: {
    signup: function() {
      var session = this.get('session');
      var self = this;

      this.get('model').save() // create the user
      .then(function() {
        session.login({ username: this.get('model.username') });
        this.transitionToRoute('profile');
      })
      .catch(function(error) {
        // handle error
      });
    }
  }
});
```

In any template you can show login/logout links:

```handlebars
{{#if session.isAuthenticated }}
  {{#link-to 'logout'}}Logout{{/link-to}}
{{else}}
  {{#link-to 'login'}}Login{{/link-to}}
{{/if}}
```

The _login_ template:

```handlebars
<form {{action 'authenticate' on='submit'}}>
  {{input type="username" required="true" autofocus="true" placeholder="Username" value=username}}
  {{input type="password" required="true" autofocus="true" placeholder="Password" value=password}}
  <button type="submit">Log in</button>
</form>
```

The _signup_ template:

```handlebars
<form {{action 'signup' on='submit'}}>
  {{input type="username" required="true" autofocus="true" placeholder="Username" value=username}}
  {{input type="password" required="true" autofocus="true" placeholder="Password" value=password}}
  <button type="submit">Sign up</button>
</form>
```

## API

### Ember.AdmitOne.setup([options])

#### options.api

Type: `String|Object`  

If you provide a string, it will be used as the value for
`options.api.endpoint` rather than specifying the resources used in the API. An
object can be used, though, and each option is explained below.

#### options.api.endpoint

Type: `String`  
Default: `'/api'`

Changing this value will affect the values of `options.api.authenticate` and
`options.api.invalidate` as well.

#### options.api.authenticate

Type: `String`  
Default: `'/api/sessions'`

The resource to use for authentication. A _POST_ request will be made here to
authenticate the user.

#### options.api.invalidate

Type: `String`  
Default: `'/api/sessions/current'`

The resource to use for authentication. A _DELETE_ request will be made here to
invalidate the user's session.

#### options.containers

Type: `Object`  
Default: `undefined`

Containers to use to initialize TinyAuth. See testing example below.

----

This extension currently has the following restrictions on customization:

- Authentication will always be a _POST_ request.
- Authentication will always send a `session` object. You may pass whatever
  object you'd like to `session.authenticate`, but if, for instance, you are
  sending an object with `email` and `password`, the request will come through
  with an object `{ session: { email: '', password: '' } }`.
- Invalidation will always be a _DELETE_ request.

Pull requests to address these issues are welcome. :)


### Usage in Tests

Set up your main `application.js` file like so:

```javsacript
window.App = Ember.Application.create();

App.AdmitOneContainers = {}; // overridable by tests
Ember.AdmitOne.setup({ containers: App.AdmitOneContainers });
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
    App.AdmitOneContainers.storage = 'auth-session-storage:test';
  }
});
```

#### Faking Login

Add a test helper:

```javascript
Ember.Test.registerHelper('applicationContainer', function(app) {
  return app.__container__;
});
```

Then in your tests, you can access the session and set the content to create
an authenticated:

```javascript

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
