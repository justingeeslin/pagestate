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
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(this, 'suffix', {
    get: function() { return suffix; },
    set: function(newSuffix) {
      suffix = newSuffix;
      document.title = this.title + suffix;
      return true
    },
    enumerable: true,
    configurable: true
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
    $(this.target).trigger('postload.' + self.eventNamespace);
  }

  function isInteger(value) {
    return typeof value === "number" && isFinite(value)
  }

  // A algorithm for selecting elements using a string in the fragment. Select the p of type of a number. Select the id if not.
	var fragmentFind = function(fragment) {
		var selector, jumpTarget;
		if ( isInteger(parseInt(fragment)) ) {
			self.log('Fragment is a number..')
			selector = 'p:eq(' + parseInt(fragment) + ')'
			jumpTarget = self.target.find(selector)
		}
		else {
			selector = '#' + fragment;
			jumpTarget = self.target.find(selector);
			// If wrapped in a glow-span, glow it, the parent, instead.
			var jumpTargetParent = jumpTarget.parent();
			if (jumpTargetParent.hasClass('glow-span')) {
				jumpTarget = jumpTargetParent;
			}
		}

    var isJumpTargetFound = jumpTarget.length > 0;
    var isTargetinDOM = typeof jumpTarget.offset !== "undefined";
    if (!isJumpTargetFound) {
      console.warn('Attempting to scroll to a element that does not exist. ', selector);
      return false;
    }
    if (!isTargetinDOM) {
      console.warn('Scrolling to a element that isnt in the DOM. Exiting..', jumpTarget);
      return false;
    }

		return jumpTarget;
	}

  // Process the fragment on the state
  $(this.target).on('postload.' + this.eventNamespace, function() {
    self.fragment = self.state.split(self.fragmentCharacter)[1]

    if (typeof self.fragment === "undefined" || self.fragment.length <= 0) {
      self.log('No fragment. Exiting.. State: ' + self.state)
      return;
    }

    var scrollTarget = fragmentFind(self.fragment);

    if (scrollTarget == false) {
			return;
		}

    var distanceToScroll = scrollTarget.offset().top;

    $('html, body').scrollTop(distanceToScroll);
  });

  $(this.target).trigger('postload.' + this.eventNamespace);

  return this;
}
module.exports = Page;
