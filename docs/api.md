#### callback
> callback: (cb: (exec: (Action) => (execCb: (value) => void) => void, done: (value) => void) => void) => Action

`exec: (Action) => (execCb: (value) => void) => void` : will execute any action in the current handler stack (so you can resume the program or perform other effects inside the handler) and then calls the `execCb` callback with the result. 
This can be called multiple times, but only while the handler is still executing (see more at `limitations` of the README)

`done: (value) => void` should be called when the callback action is done, passing in the end result of the action. this should only be called once


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
Same as Effect.single, but it works for effects that resume multiple times (`forEach`).
Using this extensively can effect the performance of your program, since each time `yield` is called, the generator function has to completely rebuild itself. 
Do NOT put impure functions in this, as each time it is rebuilt it will call every single function again.
> Effect.do: (generatorFunction) => Action

#### Effect.do
> Effect.single: (generatorFunction) => Action
Alias for `eff`