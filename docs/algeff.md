### Algebraic Effects
How do algebraic effects work? The easiest explanation I've had is to think of them like try/catch:

- Effects are like exceptions

You can perform (`yield`) an effect the same way you would `throw` an exception. The difference is that when you perform an effect, a handler that `catches` it can return a value.

- Handlers are like `try catch`

Handlers are nested just like `try catch` blocks, and when an handler is performed (`yielded`) it will be caught by the nearest handler.

Handlers can also `rethrow` the effect (by performing/`yielding` the effect again), or then can `resume` the computation and return a value to the function that performed the effect, or they can cancel (not resume) the computation and return a different value. Each time you `resume` the computation, you will get the result of resuming it, and can choose what to do with it (returning the result, perform other effects, transform the result and returning it).

### Why?
The coolest thing about algebraic effects is that due to scoped handlers and multiple resumptions, it can easily express multiple control flows (await/async, generators/iterators, exceptions, react hooks/suspense, coroutines, etc) and have them all work together harmoniously without having to write code to glue them together.

It also helps you write testable code since using effects allows for dependency injection and easy testability (like redux-saga, but more powerful)

For functional programming, Algebraic Effects lets you write pure, referentially transparent code in an imperative manner (using do notation) and allows you to combine monads (since most monads can be represented as effects).

### Examples

#### Using Effects

1 - Create the effect

Effects are kind of like interfaces, it is only a description of what is supposed to happen, and the implementation is added later.

```javascript
const waitMs = effect("waitMsEffect");
const getMessage = effect("getMessageEffect");
```

2 - Perform the effect

```javascript
const program = eff(function* () {
  // perform waitMs effect
  yield waitMs(500);
  // perform getMessage effect
  const message = yield getMessage();
  return "done waiting, message: " + message;
});
```

#### Handling effects

1 - Create the handler

```javascript
const withGetMessage = handler({
  getMessageEffect: (k) => resume(k, "This is the message"),
});

const withWaitMs = handler({
  waitMsEffect: (milliseconds, k) => {
    return singleCallback((done) => setTimeout(done, milliseconds)).chain(() => resume(k))
  }
});
```

2 - Add the handlers to the program to be handled
Handlers are like try catch blocks, so they are scoped and only affect the nested portion of the program

```javascript
const handledProgram = withGetMessage(withWaitMs(program));
```


### Learn more about Algebraic Effects

You can read more about algebraic effects in the links bellow

Why PLs Should Have Effect Handlers
https://robotlolita.me/diary/2018/10/why-pls-need-effects/

What does algebraic effects mean in FP?
https://stackoverflow.com/questions/49626714/what-does-algebraic-effects-mean-in-fp/57280373#57280373

A collection anything related to Algebraic Effects
https://github.com/yallop/effects-bibliography

Algebraic Effects for React Developers
https://reesew.io/posts/react-algebraic-effects

An Introduction to Algebraic Effects and Handlers
https://www.eff-lang.org/handlers-tutorial.pdf

Effect Handlers for the Masses
https://dl.acm.org/doi/pdf/10.1145/3276481

Handlers in Action
http://homepages.inf.ed.ac.uk/slindley/papers/handlers.pdf
