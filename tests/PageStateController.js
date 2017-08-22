const PageStateController = require('../js/PageStateController.js')

describe('PageStateController', function() {

		beforeAll(function() {

		});

		it('should construct', function() {
			thePageStateController = new PageStateController({
				eventName: 'stateChange'
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

		it('should keep an up-to-date active page by tracking location update', function(done) {

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

		it('should keep an up-to-date active page by tracking location update (even when the location is updated to be the same)', function(done) {
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

		it('should be able to preprocess the active page using only the hash if you want', function() {
			var newPage = "bieber"+Math.round(Math.random()*100)
			thePageStateController.preprocessState = function(state) {
				state = window.location.hash.replace('#!', '').replace('#', '')
				console.log('Preprocessing active page:' , state)
				return state;
			}
			window.location.hash = newPage;
			expect(thePageStateController.state).toBe(newPage);
    });

		it('should call the routes functions', function(done) {
			thePageStateController = new PageStateController({
				eventName: 'stateChange',
				preprocessState : function(state) {
					state = window.location.hash.replace('#!', '').replace('#', '')
					console.log('Preprocessing active state:' , state)
					return state;
				},
				routes: {
					"home" : function() {
						$(document.body).empty().append('<h1>Home</h1>');
					},
					"contactus/:mode:" : function(mode) {
						$(document.body).empty().append('<h1>Contact Us by ' + mode + '</h1>');
					}
				}
			});

			window.location.hash = 'home';

			window.setTimeout(function() {
				expect($('h1').text()).toBe('Home');
				done()
			}, 50)
    });

		afterAll(function() {

		});

});
