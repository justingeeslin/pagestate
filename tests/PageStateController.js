const PageStateController = require('../js/PageStateController.js')

describe('PageStateController', function() {

		beforeAll(function() {

		});

		it('should construct', function() {
			thePageStateController = new PageStateController({
				eventName: 'stateChange',
				debug: true
			});

			didStateChangeEvent = false;
			$(document.body).on(thePageStateController.eventName, function(e, oldState, newState) {
				didStateChangeEvent = true;
			})

			expect(thePageStateController instanceof PageStateController).toBe(true)
    });

		it('should keep an up-to-date active page on document ready', function(done) {
			$(document).ready(function() {
				expect(thePageStateController.state.length > 0).toBe(true);
				done()
			});
    });

		it('should keep an up-to-date active page by tracking location update (even when the location is updated to be the same)', function(done) {

			var stateUpdateCalls = 0
			var countCalls = function() {
				stateUpdateCalls++;
			}
			$(document.body).on(thePageStateController.eventName, countCalls)

			var newPage = "#dustin"
			window.location = newPage;
			window.location = newPage;

			window.setTimeout(function () {
				expect(stateUpdateCalls).toBe(2);
				done()
			}, 10);


    });

		it('should keep an up-to-date active page by tracking location update', function(done) {
			var newPage = "#justin"
			window.location = newPage;
			window.setTimeout(function () {
				expect(thePageStateController.state.indexOf(newPage) > -1).toBe(true);
				done()
			}, 10);
    });

		it('should keep an up-to-date active page by tracking history push states', function(done) {
			var newPage = "#justin"
			history.pushState({}, "", newPage);
			window.setTimeout(function () {
				expect(thePageStateController.state.indexOf(newPage) > -1).toBe(true);
				done()
			}, 10);
    });

		it('should trigger the event', function() {
			expect(didStateChangeEvent).toBe(true)
    });

		it('should be able to preprocess the active page using only the hash if you want', function(done) {
			var newPage = "bieber"+Math.round(Math.random()*100)
			thePageStateController.preprocessState = function(state) {
				state = window.location.hash.replace('#!', '').replace('#', '')
				console.log('Preprocessing active page:' , state)
				return state;
			}
			window.location.hash = newPage;
			window.setTimeout(function() {
				expect(thePageStateController.state).toBe(newPage);
				done()
			}, 1000)

    });

		it('should call the routes functions on location change', function(done) {
			var target = $('<div id="content"></div>');
			$(document.body).append(target);
			thePageStateController = new PageStateController({
				eventName: 'stateChange',
				preprocessState : function(state) {
					state = window.location.hash.replace('#!', '').replace('#', '')
					console.log('Preprocessing active state:' , state)
					return state;
				},
				routes: {
					"home" : function() {
						target.append('<h1>Home</h1>');
					},
					"contactus/:mode:" : function(mode) {
						target.append('<h1>Contact Us by ' + mode + '</h1>');
					}
				}
			});

			window.location.hash = 'home';

			window.setTimeout(function() {
				expect(target.text()).toBe('Home');
				done()
			}, 50)
    });

		it('should call the routes functions on go', function(done) {
			var target = $('<div id="content2"></div>');
			$(document.body).append(target);
			thePageStateController = new PageStateController({
				routes: {
					"park" : function() {
						target.append('<h1>Alone</h1>');
					},
					"contactus/:mode:" : function(mode) {
						target.append('<h1>Contact Us by ' + mode + '</h1>');
					}
				}
			});

			thePageStateController.go('park');

			window.setTimeout(function() {
				expect(target.text()).toBe('Alone');
				done()
			}, 50)
    });

		it('should not keep an up-to-date active page when hash watching is disabled', function(done) {
			var target = $('<div id="content2"></div>');
			$(document.body).append(target);
			var aPageStateController = new PageStateController({
				shouldWatchLocation: false,
				debug: true
			});

			var newPage = "#justin"
			window.location = newPage;
			window.setTimeout(function () {
				expect(aPageStateController.state.indexOf(newPage)).toBe(-1);
				done()
			}, 10);
    });

		it('should call the routes functions on go with a callback', function(done) {
			var target = $('<div id="content4"></div>');
			$(document.body).append(target);
			var isCallbackCalled = false;
			thePageStateController = new PageStateController({
				routes: {
					"park" : function(cb) {
						target.append('<h1>Apple</h1>');
						cb()
					},
					"contactus/:mode:" : function(mode) {
						target.append('<h1>Contact Us by ' + mode + '</h1>');
					}
				}
			});

			thePageStateController.go('park', function() {
				isCallbackCalled = true;
				expect(target.text()).toBe('Apple');
				expect(isCallbackCalled).toBe(true);
				done()
			});

    });

		afterAll(function() {

		});

});
