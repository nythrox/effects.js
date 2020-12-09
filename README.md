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

 <a href="https://github.com/nythrox/effects.js/blob/master/Examples.md">You can find the full example and others here</a>.


### How to understand Algebraic Effects from an Object-Oriented background
- Effects are like exceptions

You can perform (`yield`) an effect the same way you would `throw` an exception. The difference is that when you perform an effect, a handler that `catches` it can return a value.

- Handlers are like `try catch`

Handlers are nested just like `try catch` blocks, and when an handler is performed (`yielded`) it will be caught by the nearest handler. 

Handlers can also `rethrow` the effect (by performing the effect again), or then can `resume` the computation and return a value to the function that performed the effect, or they can cancel (not resume) the computation and return a different value. Each time you `resume` the computation, you will get the result of resuming it, and can choose what to do with it (returning the result directly, performing other effects, transforming the result and returning it).

### Actions (<sub><sup>action monad</sup></sub>)
An Action is used to represent effectful computations. 

An Action can be any of the following four things: Pure | Chain | Effect | Handler

Pure lets turn any value into an Action: 
```javascript
   // const number: Action<10>
   const number = of(10)
```
Chain (and map) lets you transform the result of another action 
```javascript
   // doubleNumber: Action<20>
   const doubleNumber = pipe(number, map(num => num * 2)) // map(num => num * 2)(number)
```
Effect lets you perform an effect and get the result from the handlers (or it throws an Exception if no handlers are found)

The `effect` function receives an argument with the effects key, and then the value to be passed onto the handler 
```javascript
   // plusOne: (number) => Action<number>
   const plusOne = effect('plusOne')
   // performed: Error!: No handler found for plusOne
   const performed = plusOne(1)
```
Handlers let you catch effects and choose what to do with the continuation
```javascript
   // withPlusOne: (action) => Action 
   const withPlusOne = handler({
      plusOne: (number) => ...
   }) 
   // program: Action<2>
   const program = withPlusOne(plusOne(1))  // wrap the program with the handler to handler it
```
You can run an action using the `run` function
```javascript
   // run: (callback) => (action) => void
   
   pipe( // run(console.log)(program)
       program,
       run(console.log)
   ) // logs 2
```


### Effects
Effects are actions that will find a handler and receive the value that it returns

To create an effect, you just need to call the curried `effect` function with the effects' key
```javascript
const log = effect('logEffect')
```
After that you can call the effect, and it will return an Action that provides the value of the result of the effect
```javascript
  log('hello world') // call effect
 // throws Error: "No handler found for effect logEffect"
```
### Handlers
Handlers are responsible for catching the effect call and returning a result (resume) or skipping the computation and returning a value
To create a handler you can use the curried function `handler`, which receives as a first argument a map of handlers, and the second the program to be handled
```javascript
const withLog = handler({
   return(value, exec, then) { then(value) },
   logEffect(value, exec, resume, then) {
       console.log(value)
       resume(undefined)(then)
   }
})
```
Inside the map of handlers, each key should be a function that will handle an effect (of the same key), and the `return` function is a special function that transforms the result of the handled action (that is optional)

A handler function receives four parameters: 

`value` is the value passed in the effect (ex: 'hello world')

`exec: (action) => (callback) => void` will execute any action in the current handler stack (so you can perform other effects inside the handler) and then calls the callback with the result. this can be called multiple times

`resume: (value) => (callback) => void` will resume the effect call with a value, and then calls the callback with the result. this can be called multiple times

`then: (value) => void` should be called when the handler is done, passing in the result of the handler. this should only be called once

You can also use the generator version
```javascript
const withLog = handler({
  return: genHandler(function*(value) {
	  return value
  }),
  logEffect: genHandler(function* (value, resume) {
	  console.log(value)
	  const result = yield resume(undefined)
	  return result
   })
})
```

To learn more about effect handlers, see <a href="https://www.eff-lang.org/handlers-tutorial.pdf">here</a>

#### DISCLAIMER: 
This implementation is not stack-safe. Work is in progress to make it stack-safe.

### Assistance is wanted
Feel free to create PRs or issues about bugs, suggestions, code review, questions, similar ideas, improvements, etc. You can also get in contact with <a href="https://github.com/nythrox"> me</a>, don't be shy to send a message!

### TODO:
- Make the interpreter stack-safe
- Make handler lookup O(1)
- Make the current generator do notation stack-safe
- Benchmarks
- Make a do notation babel plugin to compile the generator into chains
- Make a typescript version
- Find ways to make the handlers stack-safe
- API documentation
- Add more core effects and better the existing ones to have a better performance
- Expose API functions that work only with generators, and API functions that work with raw monads and continuations
- Explain how delimited continuations work with algebaric effects, how the resume() works, what then() does, etc.
- Create a tutorial page
