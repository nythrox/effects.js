### Actions

The Action monad is the data structure we use to represent our program in Algebraic Effects.

```typescript
type Action =
  | Pure
  | Chain
  | Effect
  | Handler
  | Resume
  | Callback
  | SingleCallback;
```

You can use the following methods on any action:

#### Pure

Pure lifts any value into an Action:

> pure: (value) => Action

```javascript
// const number: Action<10>
const number = pure(10);
```

#### Map

Map lets you transform the result of an action

> map: (mapper: (value) => value) => (Action) => Action

```javascript
// doubleNumber: Action<20>
const doubleNumberMappedt = number.map((num) => num * 2);
// or
const doubleNumberMapped = pipe(
  number,
  map((num) => num * 2)
);
```

#### Chain

Chain let you transform the value inside an action, and "chain" it into another action (like Promise.then)

> chain: (chainer: (value) => Action) => (Action) => Action

```javascript
// doubleNumber: Action<20>
const doubleNumberChainedt = number.chain((num) => pure(num * 2));
// or
const doubleNumberChained = pipe(
  number,
  chain((num) => pure(num * 2))
);
```

#### Effect

Effect lets you perform an effect and get the result from the handlers (or it throws an Exception if no handlers are found)

The `effect` function receives an argument with the effects key, and then the values to be passed onto the handler

```javascript
// plusOne: (number) => Action<number>
const plusOne = effect("plusOne");
// performed: Action<number>
const performed = plusOne(1);
// If you run `performed`, it will throw an error for no handler found
```

#### Handlers

Handlers let you catch effects and choose what to do with the continuation

```javascript
   // withPlusOne: (action) => Action
   const withPlusOne = handler({
      plusOne: (number) => resume(number + 1)
   })
   // program: Action<2>
   const program = withPlusOne(plusOne(1))  // wrap the program with the handler to handle it
```

### Running the Program

You can run an action using the `run` function

> run: (Action) => Promise

```javascript
run(program).then(console.log);
```
