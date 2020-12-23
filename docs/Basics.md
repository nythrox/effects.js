### Algebraic Effects
How do algebraic effects work? The easiest explanation I've had is to think of them like try/catch:

- Effects are like exceptions

You can perform (`yield`) an effect the same way you would `throw` an exception. The difference is that when you perform an effect, a handler that `catches` it can return a value.

- Handlers are like `try catch`

Handlers are nested just like `try catch` blocks, and when an handler is performed (`yielded`) it will be caught by the nearest handler.

Handlers can also `rethrow` the effect (by performing/`yielding` the effect again), or then can `resume` the computation and return a value to the function that performed the effect, or they can cancel (not resume) the computation and return a different value. Each time you `resume` the computation, you will get the result of resuming it, and can choose what to do with it (returning the result, perform other effects, transform the result and returning it).

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
  yield* waitMs(500);
  // perform getMessage effect
  const message = yield* getMessage();
  return "done waiting, message: " + message;
});
```

#### Handling effects

1 - Create the handler

```javascript
const withGetMessage = handler({
  getMessageEffect: () => resume("This is the message"),
});

const withWaitMs = handler({
  waitMsEffect: (milliseconds) => {
    return callback((done) => setTimeout(done, milliseconds)).chain(() => resume())
  }
});
```

2 - Add the handlers to the program to be handled
Handlers are like try catch blocks, so they are scoped and only affect the nested portion of the program

```javascript
const handledProgram = withGetMessage(withWaitMs(program));
```


### Learn more about Algebraic Effects

You can read more about algebraic effects in the links bellow, or see some examples <a href="https://nythrox.github.io/effects.js/#/basics?id=learn-more-about-algebraic-effects">here</a>:

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
