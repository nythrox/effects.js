## Effects.js

```javascript
  // write your program in direct style using the generator do notation
  const programDirectStyle = Effect.do(function*() {
     const auth = yield dependency('auth')
     const mouseEvent = yield cps(window.onclick)
     const user = yield getUser(auth.loggedInId)
     yield submitEvent(user, { type: 'clicked', details: mouseEvent })
     return 'done!'
  }) 
  
  const getUser = (id) => wait(() => fetch('https://myapi.com/user/' + id))
  const submitEvent = (user, details) => wait(() => fetch('https://myapi.com/event/', { method: 'POST', body: JSON.stringify(details) }))
  
  // re-use existing effects and effect handlers
  // reader returns a handler than can be used to resume the effects with the data provided
  const withDependencies = reader({
     auth: {
        loggedInId: 1  
     }
  })
  
  // create new effects
  
  export const wait = effect("async");
  
  // create effect handlers  
  export const withAsync = handler({
    return: (res) => of(() => Promise.resolve(res)),
    async: genHandler(function*(promiseThunk, resume) {
      const promise = promiseThunk();
      const promiseVal = yield cps((then) => promise.then(then))
      const res = yield resume(promiseVal)
      return res;
   })
  });

  pipe(
    program,
    withDependencies,
    withAsync,
    run((promiseResult) => promiseResult.then(console.log))
  ) // logs 'done!'
```

```javascript
  // you could also write your program like this
  const programPointfree = pipe(
    dependency('auth'),
    chain(auth => pipe(
       cps(window.onclick), 
       chain(mouseEvent => 
          pipe(
             getUser(auth.loggedInId),
             chain(user => submitEvent(user, {type: 'clicked', details: mouseEvent}))
          )
       )
    )
  )  
  
```

### Actions (Action monad)
An Action is the monad used to represent effectful computations. 
The action monad can be any of the four things: Pure | Chain | Effect | Handler
Pure lets you lift any value into the action monad: 
```javascript
   const number: Action<10>
   const number = of(10)
```
Chain (and map) lets you transform the result of another action 
```javascript
   // doubleNumber: Action<20>
   const doubleNumber = pipe(number, map(num => num * 2))
```
Effect lets you perform an effect and get the result from the handlers (or it throws an Exception if no handlers are found)
```javascript
   // plusOne: (number) => Action<number>
   const plusOne = effect('plusOne')
   // performed: Error!: No handler found for plusOne
   const performed = plusOne(1)
```
Handlers let you catch effects and choose what to do with them
```javascript
   // withTest: (action) => Action 
   const withPlusOne = handler({
      plusOne: (number) => ...
   }) 
   // program: Action<2>
   const program = withTest(plusOne(1))
```
You can run an action using the `run` function
```javascript
   // run: (callback) => (action) => void
   
   pipe(
       program,
       run(console.log)
   ) // logs 2
```


### Effects
Effects are just actions that will find a handler and receive the value that it returns
To create an effect, you just need to call the curried `effect` function with the key of the effect
```javascript
const log = effect('logEffect')
```
After that you can call the effect, and it will return an Action monad that provides the value of the result of the effect
```javascript
const program = pipe(
  log('hello world'), // call effect
  run(console.log)
) // throws Error: "No handler found for effect logEffect"
```
### Handlers
Handlers are responsible for catching the effect call and returning a result (resume) or skipping the computation and returning a value
To create a handler you can use the curried function `handler`, which receives as a first argument a map of handlers, and the second the program to be handled
```javascript
const withLog = handler({
   return(value, exec, then) {},
   logEffect(value, exec, resume, then) {}
})
```
Inside the map of handlers, each key should be a function that will handle an effect (of the same key), and the `return` function is a special function that transforms the result of the handled action

A handler function receives four parameters: 
`value` is the value passed in the effect (ex: 'hello world')
`exec: (action) => (callback) => void` will execute any action in the handler stack (so you can perform other effects inside the handler). this can be called multiple times
`resume: (value) => (callback) => void` will resume the effect call with a value, and then return the result of the computation in the callback. this can be called multiple times
`then: (value) => void` should be called when the handler is done, passing in the result of the handler. this should only be called once


#### DISCLAIMER: 
This implementation is not stack-safe. I'm working on making the interpreter stack-safe, but it is doubtful whether or not all handlers can truly be stack-safe.

### Assistance is wanted
Feel free to create PRs or issues about bugs, suggestions, code review, questions, similar ideas, improvements, etc. You can also get in contact with <a href="https://github.com/nythrox"> me</a>, don't be shy to send a message!

### TODO:
- Make the interpreter stack-safe
- Make the current generator do notation stack-safe
- Benchmarks
- Make a do notation babel plugin to compile the generator into chains
- Make a typescript version
- Find ways to make the handlers stack-safe
