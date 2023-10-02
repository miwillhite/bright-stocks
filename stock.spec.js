const assert = require('node:assert').strict;
const Stock = require('./stock');

console.log('It has a valid price');
Stock.fetchPrice('TSLA').then(({ price }) => assert(price > 0));

// WHAT THE HACK?!
// Bad pun, and bad code…I had to wrap each of these in a timeout
// because I'm being cheap and not stubbing out the external server.
// Another approach is to use dependency injection:
// Stock(api).fetchPrice('TSLA');
setTimeout(() => {
  console.log('It rejects with an error if the symbol is invalid');
  assert.rejects(
    Stock.fetchPrice('1234'),
    {
      status: 404,
      statusText: 'Not Found'
    }
  );
}, 2000);

setTimeout(() => {
  console.log('It rejects with an error if requests are made concurrently');
  assert.rejects(
    Promise.all([
      Stock.fetchPrice('TSLA'),
      Stock.fetchPrice('ALST'),
    ]),
    {
      status: 429,
      statusText: 'Throttled'
    }
  )
}, 2000);

setTimeout(() => {
  let price = null;
  let lastRespondedAt = null;
  console.log(`
    It pulls from the last cached value if concurrent requests are made AFTER the initial request
  `.trim());
  Stock.fetchPrice('TSLA').then(response => {
    price = response.price;
    lastRespondedAt = response.lastRespondedAt;
  });
  // Wait for more than a second
  setTimeout(() => {
    // Make another request (cache should be primed)
    Stock.fetchPrice('TSLA');
    // Immediately make another request and see there is no failure
    // and the values are the same as the last response.
    Stock.fetchPrice('TSLA').then(response => {
      assert(price, response.price);
      assert(lastRespondedAt, response.lastRespondedAt);
    });
  }, 1000)
}, 2000);