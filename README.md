## Effects.js
Algebraic effects in javascript with scoped handlers, multishot delimited continuations and do notation

### What are Algebraic Effects?
Algebraic effects are based on two primary concepts: effects and handlers. Effects are just a representation of an action that can be performed. Handlers will catch the performed effects and can choose to resume the continuation with a result (like a promise), resume the continuation multiple times (like a stream), or not resume at all and cancel the computation (like an exception). Handlers can also transform the result of the computation (into a promise, a stream, an array, etc). 

<a href="https://github.com/nythrox/effects.js/blob/master/Algebraic-Effects.md">You can learn more about algebraic effects here</a>. 

Algebraic effects bring a multitude of advantages: 
- dependency injection
- programming in direct-style (like async await - but for any data structure: streams, arrays, etc)
- combining monads
- maintaining pure (referentially transparent) code while working with effects
- many control flow constructs can be expressed with only algebraic effects: async/await, coroutines/fibers, generators, exceptions, backtracking, and more

It's easier to understand what it allows by seeing it in action:

```javascript
  // write your program in direct style using the generator do notation
  const programDirectStyle = function*() {
     // dependency injection
     const auth = yield dependency('auth') 
     
     // run this every time the stream gets a new item
     const mouseEvent = yield subscribe(click$)
     
     // await for async call
     const user = yield getUser(auth.userId) 
     
     // for each account in the users list of accounts
     const account = yield foreach(user.accounts) 
     
     // await for async call
     yield submitEvent(user, { type: 'clicked', details: mouseEvent, account }) 
     
     return 'logged with account ${account.name}'
  } // after each click, returns ['logged with account account1', 'logged with account account2', ...] 
```

 <a href="https://github.com/nythrox/effects.js/blob/master/docs/examples.md">You can find the full example and others here</a>.

### Limitations of this library:
In a `callback` handler, can only call `exec` while the handler is still running, you can not save it somewher else (tearoff) and call it later
You can only resume continuations inside of handlers (you cannot `tearoff` the callback and use it after the handler has returned)


### Stack-safety
It's stack-safe!

### Performance
See <a href="https://github.com/nythrox/effects.js/blob/master/tests/benchmark.test.js">benchmarks</a>, it is expected to perform better than using native Promises (although they can't really be compared because Algebraic Effects completely encapsulates Promises and is infinitely more extensible). 
Still, just like async await code (or javascript code in general), it should not be used for cpu-heavy computations, but only for non-blocking IO.

### Assistance is wanted
Feel free to create PRs or issues about bugs, suggestions, code review, questions, similar ideas, improvements, etc. You can also get in contact with <a href="https://github.com/nythrox"> me</a>, don't be shy to send a message!
   
### TODO:
- Benchmarks
- Make a do notation babel plugin to compile the generator into chains
- Make a typescript version
- API documentation
- Add more core effects and better the existing ones to have a better performance
- Expose API functions that work only with generators, and API functions that work with raw monads and continuations
- Explain how delimited continuations work with algebaric effects, how the resume() works, what then() does, etc.
- Get rid of limitations