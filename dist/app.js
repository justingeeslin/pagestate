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

  this.go = function() {
    self.activePage = window.location.pathname + window.location.hash
    if (self.activePageController) {
      self.activePageController.go(self.activePage)
    }
  }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImpzL1BhZ2VDb250cm9sbGVyLmpzIiwianMvUGFnZVN0YXRlQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leHRlbmQvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFBhZ2VTdGF0ZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2pzL1BhZ2VTdGF0ZUNvbnRyb2xsZXIuanMnKVxuY29uc3QgUGFnZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2pzL1BhZ2VDb250cm9sbGVyLmpzJylcbiIsInZhciBQYWdlQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy5wYWdlTmFtZSA9ICcnO1xuXG4gIHRoaXMuZ28gPSBmdW5jdGlvbihwYWdlKSB7XG4gICAgc2VsZi5wYWdlTmFtZSA9IHBhZ2U7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cbm1vZHVsZS5leHBvcnRzID0gUGFnZUNvbnRyb2xsZXI7XG4iLCJjb25zdCBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxudmFyIFBhZ2VTdGF0ZUNvbnRyb2xsZXIgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICB0YXJnZXQ6ICdib2R5JyxcbiAgICAvL1xuICAgIGFjdGl2ZVBhZ2VDb250cm9sbGVyOiB1bmRlZmluZWQsXG4gICAgLy8gQSBzdHJpbmcgd2hpY2ggaXMgdGhlIGxvY2F0aW9uIG1pbnVzIHRoZSBkb21haW4gYW5kIHByb3RvY29sLiBPbmx5IHBhdGggYW5kIGhhc2guXG4gICAgYWN0aXZlUGFnZTogJydcbiAgfVxuXG4gIHNlbGYgPSBleHRlbmQoc2VsZiwgZGVmYXVsdHMpXG4gIHNlbGYgPSBleHRlbmQoc2VsZiwgb3B0aW9ucylcblxuICB0aGlzLnRhcmdldEVsID0gJCh0aGlzLnRhcmdldCk7XG5cbiAgJCh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdQb3AgU3RhdGUgZmlyZWQhJyk7XG4gICAgc2VsZi5nbygpO1xuICB9KTtcblxuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgIGNvbnNvbGUubG9nKCdEb2N1bWVudCByZWFkeS4nKTtcbiAgICBzZWxmLmdvKCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygnRG9jdW1lbnQgcmVhZHkuJyk7XG4gICAgICBzZWxmLmdvKCk7XG4gICAgfSk7XG4gIH1cblxuICB0aGlzLmdvID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5hY3RpdmVQYWdlID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgd2luZG93LmxvY2F0aW9uLmhhc2hcbiAgICBpZiAoc2VsZi5hY3RpdmVQYWdlQ29udHJvbGxlcikge1xuICAgICAgc2VsZi5hY3RpdmVQYWdlQ29udHJvbGxlci5nbyhzZWxmLmFjdGl2ZVBhZ2UpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZVN0YXRlQ29udHJvbGxlcjtcbiIsImZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gIGEuX3N1cGVyID0gYlxuICBmb3IodmFyIGtleSBpbiBiKVxuICAgICAgaWYoYi5oYXNPd25Qcm9wZXJ0eShrZXkpKVxuICAgICAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgcmV0dXJuIGE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kO1xuIl19
