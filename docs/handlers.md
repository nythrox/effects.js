### Handlers

Handlers are responsible for catching the effect call and resuming with a result (optional)
To create a handler you can use the curried function `handler`, which receives as a first argument a map of handlers, and the second argument is the program to be handled

```javascript
const withLog = handler({
  // optional return: (values) => eff(function* () { return value }),
  logEffect: (...values) => eff(function* () {
    console.log(values);
    return resume()
  }),
});
```

Inside the map of handlers, each key should be a function that will handle an effect (of the same key), and the `return` function is a special function that transforms the result of the handled action (it is optional)

If you want to resume asynchronously, you can use the `singleCallback` action (see in API)

You can also use the generator version

```javascript
const withLog = handler({
  return: (value) => eff(function* () {
    return value;
  }),
  logEffect: (...values) => eff(function* () {
    console.log(values);
    const result = yield resume(undefined);
    return result;
  }),
});
```

Since each handler can return a different value (with use of `return` or simply returning a different value from `resume()`), you can provide the handlers in different orders to change the behaviour of your program.
```javascript
  // program: Action<Promise<Array<value>>>
  const program = withAsync(withForeach(stuff))

  // program: Action<Array<Promise<value>>>
  const program = withForeach(withAsync(stuff))
```
You can learn more about how this works in <a href="https://awesomereact.com/videos/hrBq8R_kxI0" target="_blank">this</a> talk on Effects in Koka by Daan Leijen 


#### Resume

Calling resume will resume the program with a value, and then return the result of the resumed program after it finishes running up to the point of the handler.

### Return

The `return` field inside a handler is a function that is always called once after the program inside the handler finishes executing. It will transform the value and then return it (either to the parent of the handler, or to the result of `resume` if it is called)

### Handlers in details
If you want to learn more about how handlers work in detail, see <a href="https://www.eff-lang.org/handlers-tutorial.pdf">here</a>


