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

### Effects

### Handlers


#### DISCLAIMER: 
This implementation is not stack-safe. I'm working on making the interpreter stack-safe, but it is doubtful whether or not all handlers can truly be stack-safe.

### Assistance is welcome
Feel free to create PRs or issues about bugs, suggestions, code review, questions, similar ideas, improvements, etc. You can also get in contact with <a href="https://github.com/nythrox"> me</a>, don't be shy to send a message!

### TODO:
- Make the interpreter stack-safe
- Make the current generator do notation stack-safe
- Benchmarks
- Make a do notation babel plugin to compile the generator into chains
- Make a typescript version
- Find ways to make the handlers stack-safe
