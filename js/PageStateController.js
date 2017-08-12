const crossroads = require('crossroads');
const extend = require('extend');

var PageStateController = function( options ) {
  var self = this;

  var defaults = {
    target: 'body',
    state: '',
    routes: {},
    preprocessState: function(location) {
      return location;
    },
    // Define an event name for an event to trigger when this component goes.
    eventName: undefined,
    debug: false
  }

  self = extend(self, defaults)
  self = extend(self, options)

  this.log = function(msg) {
		if (self.debug) {
			console.log(msg);
		}
	}

  this.targetEl = $(this.target);

  // Cast "undefined" strings as literal undefined
  crossroads.shouldTypecast = true

  // Add the routes to crossroads.
  for(var r in this.routes) {
    this.log('Added route for: ', r);
    crossroads.addRoute(r, this.routes[r]);
  }

  this.go = function() {;
    var oldState = self.state;
    self.state = self.preprocessState(window.location.pathname + window.location.hash);
    var newState = self.state;

    if (self.state == '') {
      self.log('Page State Controller going with an empty state. Exiting..');
      return;
    }

    // Perform Routes Actions.
    crossroads.parse(self.state);


    if (typeof self.eventName !== "undefined") {
      $(document.body).trigger(self.eventName, [oldState, newState] );
    }
  }

  $(window).on('popstate', function() {
    self.log('Pop State fired!');
    self.go();
  });

  if (document.readyState === 'complete') {
    self.log('Document ready.');
    self.go();
  }
  else {
    $(document).ready(function() {
      self.log('Document ready.');
      self.go();
    });
  }

  return this;
}

module.exports = PageStateController;
