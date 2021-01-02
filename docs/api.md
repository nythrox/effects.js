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

> handleError: (handler: (error) => Action, k: Continuation) => (Action) => Action

This is a shorthand for creating a full error handler. It will catch any errors that are raised, and let you choose what to do with them.
```javascript
  const program = pipe(
    raise("error"),
    handleError((err, k) => resume(k, "nothing went wrong"))
  )
  run(program).then(console.log).catch(console.error)
  // logs "nothing went wrong"
``` 
You can also just handle it like a effect
```javascript
  const myErrorHandler = handler({
    error: (err, k) => resume(k, "nothing went wrong")
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

#### singleCallback
> singleCallback: (cb: (done: (value) => void) => void)

```javascript
const exampleCallbackAction = singleCallback((done) => {
  Promise.resolve(20).then((value) => done("promise resolved: " + value));
});
```

### options
> options: (options: { inContinuationScope: boolean }) => (Perform) => Action

Lets you set the options on how the `perform` effect is gonna behave.
Setting `inContinuationScope` to `true` will perform the effect using the handler scope of the program that activated the handler (by yielding/performing) - only works inside a handle function
```javascript
// will raise an exception (perform raise) in the scope of the program that performed `test`, so that he can catch it by being able to wrap the `perform` and not the handler
const test = effect("test")
const withTest = handler({
  test: () => {
    pipe(
      raise("something went wrong"),
      options({
        inContinuationScope: true
      })
    )
  }
})
// handleError will catch the `raise` effect because it is being performed in its scope (with the inContinuationScope option)
// if this option was deactivated (default), the handleError would not catch the `raise` effect unless it was put around the `withTest` that yields the `raise` effect
const program = pipe(
  test(),
  handleError(() => pure("end")),
  withTest
)
```

#### resume
> resume: (continuation, value) => Action

Calling resume will resume the continuation with a value, and then return the result of the resumed program after it finishes running up to the point of the handler (that gave you the continuation)

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