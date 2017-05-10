(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const PageStateController = require('./js/PageStateController.js')
const PageController = require('./js/PageController.js')

},{"./js/PageController.js":2,"./js/PageStateController.js":3}],2:[function(require,module,exports){
var PageController = function() {
  var self = this;

  this.pageName = '';

  this.go = function(page) {
    self.pageName = page;
  }

  return this;
}
module.exports = PageController;

},{}],3:[function(require,module,exports){
const extend = require('extend');

var PageStateController = function( options ) {
  var self = this;

  var defaults = {
    target: 'body',
    //
    activePageController: undefined,
    // A string which is the location minus the domain and protocol. Only path and hash.
    activePage: '',
    preprocessActivePage: function(location) {
      return location;
    }
  }

  self = extend(self, defaults)
  self = extend(self, options)

  this.targetEl = $(this.target);

  this.go = function() {
    self.activePage = self.preprocessActivePage(window.location.pathname + window.location.hash);
    if (self.activePageController) {
      self.activePageController.go(self.activePage)
    }
  }

  $(window).on('popstate', function() {
    console.log('Pop State fired!');
    self.go();
  });

  if (document.readyState === 'complete') {
    console.log('Document ready.');
    self.go();
  }
  else {
    $(document).ready(function() {
      console.log('Document ready.');
      self.go();
    });
  }

  return this;
}

module.exports = PageStateController;

},{"extend":4}],4:[function(require,module,exports){
function extend(a, b) {
  a._super = b
  for(var key in b) {
    if(b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
    // Does the property have a custom getter or setter?
    if (typeof b.__lookupGetter__(key) == "function") {
      console.log('found a getter for ' + key);
      a.__defineGetter__(key, b.__lookupGetter__(key))
    }
    if (typeof b.__lookupSetter__(key) == "function") {
      console.log('found a setter for ' + key);
      a.__defineSetter__(key, b.__lookupSetter__(key))
    }

  }

  return a;
}

module.exports = extend;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImpzL1BhZ2VDb250cm9sbGVyLmpzIiwianMvUGFnZVN0YXRlQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leHRlbmQvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgUGFnZVN0YXRlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vanMvUGFnZVN0YXRlQ29udHJvbGxlci5qcycpXG5jb25zdCBQYWdlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vanMvUGFnZUNvbnRyb2xsZXIuanMnKVxuIiwidmFyIFBhZ2VDb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB0aGlzLnBhZ2VOYW1lID0gJyc7XG5cbiAgdGhpcy5nbyA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICBzZWxmLnBhZ2VOYW1lID0gcGFnZTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufVxubW9kdWxlLmV4cG9ydHMgPSBQYWdlQ29udHJvbGxlcjtcbiIsImNvbnN0IGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG52YXIgUGFnZVN0YXRlQ29udHJvbGxlciA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIHRhcmdldDogJ2JvZHknLFxuICAgIC8vXG4gICAgYWN0aXZlUGFnZUNvbnRyb2xsZXI6IHVuZGVmaW5lZCxcbiAgICAvLyBBIHN0cmluZyB3aGljaCBpcyB0aGUgbG9jYXRpb24gbWludXMgdGhlIGRvbWFpbiBhbmQgcHJvdG9jb2wuIE9ubHkgcGF0aCBhbmQgaGFzaC5cbiAgICBhY3RpdmVQYWdlOiAnJyxcbiAgICBwcmVwcm9jZXNzQWN0aXZlUGFnZTogZnVuY3Rpb24obG9jYXRpb24pIHtcbiAgICAgIHJldHVybiBsb2NhdGlvbjtcbiAgICB9XG4gIH1cblxuICBzZWxmID0gZXh0ZW5kKHNlbGYsIGRlZmF1bHRzKVxuICBzZWxmID0gZXh0ZW5kKHNlbGYsIG9wdGlvbnMpXG5cbiAgdGhpcy50YXJnZXRFbCA9ICQodGhpcy50YXJnZXQpO1xuXG4gIHRoaXMuZ28gPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmFjdGl2ZVBhZ2UgPSBzZWxmLnByZXByb2Nlc3NBY3RpdmVQYWdlKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIHdpbmRvdy5sb2NhdGlvbi5oYXNoKTtcbiAgICBpZiAoc2VsZi5hY3RpdmVQYWdlQ29udHJvbGxlcikge1xuICAgICAgc2VsZi5hY3RpdmVQYWdlQ29udHJvbGxlci5nbyhzZWxmLmFjdGl2ZVBhZ2UpXG4gICAgfVxuICB9XG5cbiAgJCh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdQb3AgU3RhdGUgZmlyZWQhJyk7XG4gICAgc2VsZi5nbygpO1xuICB9KTtcblxuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgIGNvbnNvbGUubG9nKCdEb2N1bWVudCByZWFkeS4nKTtcbiAgICBzZWxmLmdvKCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygnRG9jdW1lbnQgcmVhZHkuJyk7XG4gICAgICBzZWxmLmdvKCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlU3RhdGVDb250cm9sbGVyO1xuIiwiZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcbiAgYS5fc3VwZXIgPSBiXG4gIGZvcih2YXIga2V5IGluIGIpIHtcbiAgICBpZihiLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICB9XG4gICAgLy8gRG9lcyB0aGUgcHJvcGVydHkgaGF2ZSBhIGN1c3RvbSBnZXR0ZXIgb3Igc2V0dGVyP1xuICAgIGlmICh0eXBlb2YgYi5fX2xvb2t1cEdldHRlcl9fKGtleSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zb2xlLmxvZygnZm91bmQgYSBnZXR0ZXIgZm9yICcgKyBrZXkpO1xuICAgICAgYS5fX2RlZmluZUdldHRlcl9fKGtleSwgYi5fX2xvb2t1cEdldHRlcl9fKGtleSkpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgYi5fX2xvb2t1cFNldHRlcl9fKGtleSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zb2xlLmxvZygnZm91bmQgYSBzZXR0ZXIgZm9yICcgKyBrZXkpO1xuICAgICAgYS5fX2RlZmluZVNldHRlcl9fKGtleSwgYi5fX2xvb2t1cFNldHRlcl9fKGtleSkpXG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gYTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHRlbmQ7XG4iXX0=
