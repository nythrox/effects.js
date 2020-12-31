### API

### Pointfree vs Chainable version
You can use the API in both ways, Pointfree or Chainable
```javascript
  const plusOne = effect('plusOne')
  const withPlusOne = handler({
      plusOne: (num) => resume(num + 1)
  })

  // pointfree
  const program = pipe(
    pure(10),
    map(number => number * 2),
    chain(n => plusOne(n)),
    withPlusOne
  )
  // chainable
  const program = withPlusOne(
    pure(10)
    .map(number => number * 2)
    .chain(n => plusOne(n))
  )
```

#### run
> run: (action) => Promise

Call the `run` function to run your program (an Action).
It automatically comes with three handlers: `withIo`, `withIoPromise`, and `toEither`, so you can use the effects `io`, `waitFor` and it will automatically catch unhandled `raise` exceptions and reject the promise returned from calling `run`.
```javascript
  run(pure("hello world")).then(console.log)
  // logs "hello world"
``` 

#### error (built-in exceptions)
> raise: (error) => Action

This is the built-in error effect, you can create your own but it is recommended to use this one.
```javascript
  run(raise("error")).catch(console.error)
  // logs "error"
``` 

> handleError: (handler: (error) => Action) => (Action) => Action

This is a shorthand for creating a full error handler. It will catch any errors that are raised, and let you choose what to do with them.
```javascript
  const program = pipe(
    raise("error"),
    handleError((err) => resume("nothing went wrong"))
  )
  run(program).then(console.log).catch(console.error)
  // logs "nothing went wrong"
``` 
You can also just handle it like a effect
```javascript
  const myErrorHandler = handler({
    error: (err) => resume("nothing went wrong")
  })
  run(myErrorHandler(raise("error"))).then(console.log).catch(console.error)
  // logs "nothing went wrong"
```

### waitFor
> waitFor: (io: () => Promise) => Action

The built-in promise handler is `waitFor`, but you are encouraged to create your own since promises are not necessary (only callbacks are enough)
```javascript
const program = eff(function* () {
  const num1 = yield waitFor(() => Promise.resolve(10))
  const num2 = yield pipe(
    waitFor(() => Promise.reject(10)),
    handleError(err => 20)
  )
  return num1 + num2
})
run(program).then(console.log).catch(console.error)
// logs 30
```


#### callback
> callback: (cb: (exec: (Action) => (execCb: (value) => void) => void, done: (value) => void) => void) => Action

`exec: (Action) => (execCb: (value) => void) => void` : will execute any action in the current handler stack (so you can resume the program or perform other effects inside the handler) and then calls the `execCb` callback with the result. 
This can be called multiple times, but only while the handler is still executing (see more at `limitations` of the README)

`done: (value) => void` should be called when the callback action is done, passing in the end result of the action. this should only be called once

`execInProgramScope: (Action) => (execCb: (value) => void) => void` : does the same thing as `exec`, but the scope of the handlers is the same of the program that yielded (useful in some ocasions)


```javascript
const exampleCallbackAction = callback((exec, done) => {
  callback((exec, done) => {
    exec(resume(10))((value) => {
      /// do something
      done("end callback effect")
    })
  })
```

#### singleCallback
> singleCallback: (cb: (done: (value) => void) => void)

```javascript
const exampleCallbackAction = singleCallback((done) => {
  Promise.resolve(20).then((value) => done("promise resolved: " + value));
});
```

#### resume
> resume: (value) => Action

This Action can only be used in a handler
It will resume the current effect call with a value, and returns the result of the resumed program after it finishes running up to the point of the handler

#### eff
> eff: (generatorFunction) => Action

Sugar syntax for using normal `chain`, `map` and `pure`. 
This only works for effects that call resume once (or none). If used with effects like `forEach` that call resume multiple times, it will give incorrect results.
Will transform a generator function into the action equivalent, where each `yield` is a chain, and the final `return` is pure:
```javascript
const actionG = Effect.single(function* () {
  const res = yield waitFor(Promise.resolve(100))
  const num = yield waitFor(Promise.resolve(200))
  return res + num
})

const actionP = waitFor(Promise.resolve(100)).chain((res) =>
  waitFor(Promise.resolve(200)).chain((num) => pure(res + num))
);
```

#### Effect.do
> Effect.do: (generatorFunction) => Action

Same as Effect.single, but it works for effects that resume multiple times (`forEach`).
Using this extensively can effect the performance of your program, since each time `yield` is called, the generator function has to completely rebuild itself. 
Do NOT put impure functions in this, as each time it is rebuilt it will call every single function again.

#### Effect.do
> Effect.single: (generatorFunction) => Action

Alias for `eff`