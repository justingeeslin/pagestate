const Page = require('../js/Page.js')

describe('Page', function() {

		beforeAll(function() {

		});

		it('should construct', function() {
			var thePage = new Page();

			expect(thePage instanceof Page).toBe(true)
    });

});
