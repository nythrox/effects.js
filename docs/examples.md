### Examples
Here are a few examples of effects and handlers you can create

### Complete example from README.md

```javascript
  // write your program in direct style using the generator do notation
  const programDirectStyle = eff(function* () {
     const auth = yield dependency('auth') // dependency injection with a simple handler
     const mouseEvent = yield subscribe(click$) // run this every time the stream gets a new item
     const user = yield getUser(auth.userId) // await for async call
     const account = yield foreach(user.accounts) // for each account in the users list of accounts
     yield submitEvent(user, { type: 'clicked', details: mouseEvent, account }) // await for async call
     return 'logged with account ${account.name}'
  })
  
  const getUser = (id) => wait(() => fetch('https://myapi.com/user/' + id))
  const submitEvent = (user, details) => wait(() => fetch('https://myapi.com/event/', { method: 'POST', body: JSON.stringify(details) }))
  
  const dependency = effect("dependency")
  const dependencies = (deps) => handler({
     dependency: () => resume(deps)
  })

  const withAuthDependencies = dependencies({
     auth: {
        userId: 1  
     }
  })
  
  // create new effects
  
  export const wait = effect("async");
  
  // create effect handlers  
  export const withAsync = handler({
    return: (value) => eff(function* () {
      return Promise.resolve(res)
    }),
    async: (promiseThunk) => eff(function*() {
      const promise = yield io(promiseThunk);
      const promiseVal = yield singleCallback((done) => promise.then(done))
      const res = yield resume(promiseVal)
      return res;
   })
  });
  //handledProgram: Action<Promise<Stream<Array<string>>>>
  const handledProgram = withAsync(withSubscribe(withForeach(withAuthDependencies(program))))
   
  run(handledProgram).then(stream => stream.subscribe(console.log))
  // after each click, logs ['logged with account account1', 'logged with account account2', ...] 
```
You could also write your program without using generator functions:
```javascript
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
  
  pipe(
    program,
    Effect.do,
    withAuthDependencies,
    withForeach,
    withSubscribe, 
    withAsync, // provide promise handler
    run,
    (stream) => stream.subscribe(console.log)
  ) // after each click, logs ['logged with account account1', 'logged with account account2', ...] 
```


### Exceptions
You can very easily create try/catch and exceptions with some simple effects
```javascript
// create a new effect
const raise = effect('exn')
```
You can handle raised exceptions using a normal effect handler and simply not resuming the continuation
```javascript
const program = raise(Error('something went wrong')
const myCustomErrorHandler = handler({
    exn: (error) => eff(function* () {
        // we won't resume anything here, instead just return a different answer
        console.log(error)
        return "nothing went wrong! :)"
    })
})
```
Or you can create a handler that takes a function
```javascript
const trycatch = (program) => (oncatch) =>
  handler({
    exn: (error) => eff(function* () {
       // we won't resume, instead we will call the provided function and return its result
       const result = yield oncatch(error)
       return result;
    })
  })(program);
  
  const handledProgram = trycatch(program)((error) => eff(function* () {
      console.log(error)
      return "nothing went wrong! :)"
  }))
```

<!-- 
### Other examples
Hopefully I will add some new examples here soon, but for now you can find some examples of effects and handlers here:

https://github.com/nythrox/effects.js/blob/master/core_effects.js -->
