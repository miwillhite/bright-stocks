/*

Overview:

I added a think layer over the existing API with just a little bit
more info so that the client can make some informed decisions.

I mostly want the errors to bubble up, so anything resulting in
a NOT FOUND will go to the client.

The only nuance I added was to alleviate some potential pain
in the concurrency limitations. If a subsequent request is made
within 1 second of the previous it will attempt to return the
last value (via cache). I added a timestamp so that the client
can determine if they want to retry or not.

You can run the specs with:

node stock.spec.js

---

Next steps:

- The specs should be using jest so that we can stub the example server

- Since this is supposed to support a real-time UX we'd probably want
  to think about how to set up a push mechanism (websockets?) to allow
  the client to subscribe to a symbol and receive periodic updates.

*/


const API_URL = 'http://127.0.0.1:8080/lookupPrice/';

// Cache responses to compensate for the lack
// of concurrency in the external API
let responseCache = {
  // <symbol>:
  //   price
  //   lastRespondedAt
};

// Use a simple switch to throttle requests
let waiting = false;

// Example: fetchPrice('TSLA').then(console.log);
// => {
//      symbol: 'TSLA',
//      price: 0.09657705890254653,
//      lastRespondedAt: 2023-10-01T02:53:06.161Z
//    }
const fetchPrice = symbol => {
  // If we're waiting for an outstanding request
  // look at the cache and see if we have the last response
  // otherwise return 429 Throttled
  if (waiting) {
    if (responseCache[symbol]) {
      return Promise.resolve({ symbol, ...responseCache[symbol] });
    }
    return Promise.reject({ status: 429, statusText: 'Throttled' });
  }

  // Flip the 'waiting' switch for the pending request
  waiting = true;

  // Fetch from the server
  return fetch(API_URL + symbol)
    .then(response => {
      const { status, statusText } = response;
      // Flip the switch to allow more requests
      waiting = false;
      // Pass the json response through
      if (status === 200) {
        return response.json();
      }
      // Otherwise reject with the provided failure
      // letting the error bubble up
      return Promise.reject({
        status,
        statusText,
      });
    })
    .then(({ price }) => {
      const lastRespondedAt = new Date();
      // Cache the last response
      responseCache[symbol] = {
        price,
        lastRespondedAt,
      };
      // Return the pricing data and let the client
      // know when it was responded
      return { symbol, price, lastRespondedAt };
    });
};

module.exports = {
  fetchPrice
};