# Overview

I added a think layer over the existing API with just a little bit
more info so that the client can make some informed decisions.

I mostly want the errors to bubble up, so anything resulting in
a `NOT FOUND` will go to the client.

The only nuance I added was to alleviate some potential pain
in the concurrency limitations. If a subsequent request is made
within 1 second of the previous it will attempt to return the
last value (via cache). I added a timestamp so that the client
can determine if they want to retry or not.

## Getting Started

```javascript
// Assumes the example server is running
const Stock = require('./stock');
Stock.fetchPrice('TSLA').then(console.log);
// => {
//      symbol: 'TSLA',
//      price: 0.09657705890254653,
//      lastRespondedAt: 2023-10-01T02:53:06.161Z
//    }
```

## Testing
You can run the specs with:

```bash
node stock.spec.js
```

---

## Next steps:

- The specs should be using jest so that we can stub the example server

- Since this is supposed to support a real-time UX we'd probably want
  to think about how to set up a push mechanism (websockets?) to allow
  the client to subscribe to a symbol and receive periodic updates.
