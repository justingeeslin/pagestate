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
    activePage: ''
  }

  self = extend(self, defaults)
  self = extend(self, options)

  this.targetEl = $(this.target);

  $(window).on('popstate', function() {
    console.log('Pop State fired!');
    // self.activePage = window.location.href.replace(window.location.origin, '');
    self.activePage = window.location.pathname + window.location.hash
    if (self.activePageController) {
      self.activePageController.go(self.activePage)
    }
  });

  return this;
}

module.exports = PageStateController;

},{"extend":4}],4:[function(require,module,exports){
function extend(a, b) {
  a._super = b
  for(var key in b)
      if(b.hasOwnProperty(key))
          a[key] = b[key];
  return a;
}

module.exports = extend;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImpzL1BhZ2VDb250cm9sbGVyLmpzIiwianMvUGFnZVN0YXRlQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leHRlbmQvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgUGFnZVN0YXRlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vanMvUGFnZVN0YXRlQ29udHJvbGxlci5qcycpXG5jb25zdCBQYWdlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vanMvUGFnZUNvbnRyb2xsZXIuanMnKVxuIiwidmFyIFBhZ2VDb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB0aGlzLnBhZ2VOYW1lID0gJyc7XG5cbiAgdGhpcy5nbyA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICBzZWxmLnBhZ2VOYW1lID0gcGFnZTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufVxubW9kdWxlLmV4cG9ydHMgPSBQYWdlQ29udHJvbGxlcjtcbiIsImNvbnN0IGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG52YXIgUGFnZVN0YXRlQ29udHJvbGxlciA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIHRhcmdldDogJ2JvZHknLFxuICAgIC8vXG4gICAgYWN0aXZlUGFnZUNvbnRyb2xsZXI6IHVuZGVmaW5lZCxcbiAgICAvLyBBIHN0cmluZyB3aGljaCBpcyB0aGUgbG9jYXRpb24gbWludXMgdGhlIGRvbWFpbiBhbmQgcHJvdG9jb2wuIE9ubHkgcGF0aCBhbmQgaGFzaC5cbiAgICBhY3RpdmVQYWdlOiAnJ1xuICB9XG5cbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBkZWZhdWx0cylcbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBvcHRpb25zKVxuXG4gIHRoaXMudGFyZ2V0RWwgPSAkKHRoaXMudGFyZ2V0KTtcblxuICAkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ1BvcCBTdGF0ZSBmaXJlZCEnKTtcbiAgICAvLyBzZWxmLmFjdGl2ZVBhZ2UgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4sICcnKTtcbiAgICBzZWxmLmFjdGl2ZVBhZ2UgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB3aW5kb3cubG9jYXRpb24uaGFzaFxuICAgIGlmIChzZWxmLmFjdGl2ZVBhZ2VDb250cm9sbGVyKSB7XG4gICAgICBzZWxmLmFjdGl2ZVBhZ2VDb250cm9sbGVyLmdvKHNlbGYuYWN0aXZlUGFnZSlcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2VTdGF0ZUNvbnRyb2xsZXI7XG4iLCJmdW5jdGlvbiBleHRlbmQoYSwgYikge1xuICBhLl9zdXBlciA9IGJcbiAgZm9yKHZhciBrZXkgaW4gYilcbiAgICAgIGlmKGIuaGFzT3duUHJvcGVydHkoa2V5KSlcbiAgICAgICAgICBhW2tleV0gPSBiW2tleV07XG4gIHJldHVybiBhO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4dGVuZDtcbiJdfQ==
