# Effects.js
Algebraic effects in javascript with scoped handlers, multishot delimited continuations and do notation

https://nythrox.github.io/effects.js

## How to start?
You can try it out at <a href="https://codesandbox.io/s/effkit-8nkwc?file=/src/index.js">codesandbox</a>, or install it in npm:
```
$ npm install effkit
```

## What are Algebraic Effects?
Algebraic effects are based on two primary concepts: effects and handlers. Effects are just a representation of an action that can be performed. Handlers will catch the performed effects and can choose to resume the continuation with a result (like a promise), resume the continuation multiple times (like a stream), or not resume at all and cancel the computation (like an exception). Handlers can also transform the result of the computation (into a promise, a stream, an array, etc). 

To learn more about algebraic effects, see <a href="https://nythrox.github.io/effects.js/#/effects">here</a>. 

Algebraic effects bring a multitude of advantages: 
- dependency injection
- programming in direct-style (like async await - but for any data structure: streams, arrays, etc)
- combining monads
- maintaining pure (referentially transparent) code while working with effects
- many control flow constructs can be expressed with only algebraic effects: async/await, coroutines/fibers, generators, exceptions, backtracking, hooks, and more

It's easier to understand what it allows by seeing it in action:

```javascript
  // write your program in direct style using the generator do notation
  const onUserClick = eff(function* () {
     // get the current request from express
     const auth = yield request() 

     // await for async call
     const user = yield getUser(auth.user.id) 
     
     // throw recoverable exception
     const token = user.token || yield raise("No token found")
     
     // for each subscriber in the users list of subscribers
     const subscriber = yield forEach(user.subscribers) 
     
     // await for async call
     const result = yield sendNotification(subscriber, 'clicked', { details: mouseEvent, user, token }) 

     return { user, subscriber, result }
  }) // returns [{ user, subscriber1, result1 }, { user, subscriber2, result2 }, ...], 
     // the return value depends on how you use the handlers 
```

All of the effects (request, getUser, sendNotification, etc) are highly testable, and can be replaced with testing/production/alternative versions.

### Performance
See <a href="https://github.com/nythrox/effects.js/blob/master/tests/benchmark.test.js">benchmarks</a>, it is expected to perform better than using native Promises (although they can't really be compared, because Algebraic Effects completely encapsulates Promises and is infinitely more extensible). 
Still, just like async/await code (or javascript code in general), it should not be used for cpu-heavy computations, only for non-blocking IO.

### Stack-safety
It's 100% stack-safe!

### Limitations of this library:
1. In a `callback` handler, can only call `exec` while the handler is still running, you can not save it somewhere else (tearoff) and call it later after the handler has returned (meaning you can only resume continuations inside a handler).
2. The scope is more limited, in some Algebraic Effect languages like `koka` the scope when calling `resume` is more dynamic, but here you can't change the handler scope when calling resume.

### Assistance is wanted
Feel free to create PRs or issues about bugs, suggestions, code review, questions, similar ideas, improvements, etc. You can also get in contact with <a href="https://github.com/nythrox"> me</a>, don't be shy to send a message!
   
### Inspirations
#### [koka](https://github.com/koka-lang/koka)

#### [Eff](eff-lang.org)

#### [fx-ts](https://github.com/briancavalier/fx-ts)

#### [forgefx](https://github.com/briancavalier/forgefx)

### Acknowledgments
Thanks so much to the people who helped me with this library! Thanks to [Ohad Kammar](https://github.com/ohad) for answering all my questions on algebraic effects, and [Michael Arnaldi](https://github.com/mikearnaldi) for showing me how to implement ADT interpreters in order to achieve stack-safety in javascript

### TODO:
- Make a do notation babel plugin to compile the generator into chains
- Make a typescript version
- Expose API functions that work only with generators, and API functions that work with raw monads and continuations
- Get rid of limitations
