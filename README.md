# Effects.js
Algebraic effects in javascript with scoped handlers, multishot delimited continuations and do notation

## How to start?
You can try it out at <a href="https://codesandbox.io/s/effkit-8nkwc?file=/src/index.js">codesandbox</a>, or install it in npm:
```
$ npm install effkit
```

### Documentation
You can read the docs <a href="https://nythrox.github.io/effects.js">here</a>. 

## What are Algebraic Effects?
Algebraic effects are based on two primary concepts: effects and handlers. Effects are just a representation of an action that can be performed. Handlers will catch the performed effects and can choose to resume the program (continuation) with a result (like a promise), resume the continuation multiple times (like a forEach), or not resume at all and cancel the computation (like an exception). Handlers can also transform the result of the computation (into a promise, an array, etc). 

To learn more about algebraic effects, see <a href="https://nythrox.github.io/effects.js/#/algeff">here</a>. 

Algebraic effects bring a multitude of advantages: 
- dependency injection
- programming in direct-style (like async await - but for any data structure: promises, arrays, generators, etc)
- maintaining code pure (referentially transparent) while working with effects
- many control flow constructs can be expressed with only algebraic effects: async/await, coroutines/fibers, generators, exceptions, backtracking, react hooks & suspense, and more
- combining monads (almost any monad can be represented as an effect, which allows them to be used/chained together)

It's easier to understand what it allows by seeing it in action:

```javascript
  // write your program in direct style using the generator do notation
  const onUserClick = eff(function* () {
     // get the current request from express
     const auth = yield getAuth() 

     // await for async call
     const user = yield getUser(auth.user.id) 
     
     // throw recoverable exception
     const token = user.token || yield raise(new MissingTokenError())
     
     // for each subscriber in the users list of subscribers
     const subscriber = yield forEach(user.subscribers) 
     
     // await for async call
     const result = yield sendNotification(subscriber, 'clicked', { details: mouseEvent, user, token }) 

     return { user, subscriber, result }
  }) // returns [{ user, subscriber1, result1 }, { user, subscriber2, result2 }, ...], 
     // the return value depends on how you use the handlers 
```

Handle them later

```javascript
express.post('actions/user-clicked', (req, res) => {
 const withDependencies = handler({
   getAuth: () => resume(req.auth),
   error: (e) => e instanceof MissingTokenError && cachedUser ? resume(cachedUser) : raise(e),
   sendNotification: (subscriber, type, data) => sendFirebaseNotification(...),
 })
 run(withDependencies(onUserClick))
})
```

All of the effects (request, getUser, sendNotification, etc) are highly testable, and can be replaced with testing/production/alternative versions.

### This library
This library brings a algebraic effects implementation to Javascript using an `Action` monad, which means you can use the monadic API (map, chain, of), or use generator functions as a "do notation" to make the code look more natural. It is based on the languages Koka and Eff, and tries to bring all the algebraic effects features they have.

### Performance
See <a href="https://github.com/nythrox/effects.js/blob/master/tests/benchmark.test.js">benchmarks</a>, it is expected to perform better than using native Promises (although they can't really be compared, because Algebraic Effects completely encapsulates Promises and is infinitely more extensible). 
Still, just like async/await code (or javascript code in general), it should not be used for cpu-heavy computations, only for non-blocking IO.

### Stack-safety
It's 100% stack-safe!

### Assistance is welcome
Feel free to create PRs or issues about bugs, suggestions, code review, questions, similar projects, improvements, etc. You can also get in contact with <a href="https://github.com/nythrox"> me</a>, don't be shy to send a message!
   
### Inspirations
#### [koka](https://github.com/koka-lang/koka)

#### [Eff](eff-lang.org)

#### [fx-ts](https://github.com/briancavalier/fx-ts)

#### [forgefx](https://github.com/briancavalier/forgefx)

### Acknowledgments
Thanks so much to the people who helped me with this library! Thanks to [Ohad Kammar](https://github.com/ohad) for answering all my questions on algebraic effects, and [Michael Arnaldi](https://github.com/mikearnaldi) for showing me how to implement custom interpreters in order to achieve stack-safety

### Roadmap:
- ~~Get rid of scope and resume limitations~~
- ~~Create monadic API~~
- ~~Add docs~~
- ~~Make it 100% stack safe~~
- ~~Benchmarks~~
- Descriptive errors on dev mode
- Make a do notation babel plugin to compile the generator into chains
- Make a typescript version
- Expose API functions that work only with generators, and API functions that work with raw monads and continuations
- Create normal handlers and control handlers (like in koka)
