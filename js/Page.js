const extend = require('extend')
const Component = require('sensible-component')

var Page = function( options ) {
  var self = this;

  // Title of the page. Appears in history, bookmarks, and tabs
  var title = "";
  // Suffix like the name of the app, etc.
  var suffix = "";

  Object.defineProperty(this, 'title', {
    get: function() { return title; },
    set: function(newTitle) {
      title = newTitle;
      document.title = title + this.suffix;
      return true
    },
    enumerable: true
  });

  Object.defineProperty(this, 'suffix', {
    get: function() { return suffix; },
    set: function(newSuffix) {
      suffix = newSuffix;
      document.title = this.title + suffix;
      return true
    },
    enumerable: true
  });

  var defaults = {
    // A special character after which in the state should be some selector for an element to scroll to
    fragmentCharacter: "#",
    // The current fragment last scrolled to
    fragment: "",
    // Customizable post-load function
    postload: function() { }
  }

  self = extend(self, defaults);
  self = extend(self, options);

  self = extend(self, new Component(self));

  $(this.target).on('postload.page', this.postload);

  this.stateChange = function(oldState, newState) {
    self.log('New state: ' + newState)
    $(this.target).trigger('postload.page');
  }

  // Process the fragment on the state
  $(this.target).on('postload.page', function() {
    self.fragment = self.state.split(self.fragmentCharacter)[1]

    if (typeof self.fragment === "undefined" || self.fragment.length <= 0) {
      self.log('No fragment. Exiting.. State: ' + self.state)
      return;
    }

    var scrollTarget = self.target.find('#' + self.fragment);

    if (typeof scrollTarget.offset === "undefined") {
			console.warn('Scrolling to a element that isnt in the DOM. Exiting..', scrollTarget);
			return false;
		}

    var distanceToScroll = scrollTarget.offset().top;

    $('html, body').scrollTop(distanceToScroll);
  });

  $(this.target).trigger('postload.page');

  return this;
}
module.exports = Page;
