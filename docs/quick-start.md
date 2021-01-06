### Quick start

#### Create an effect

First, we'll start by creating a simple effect

```javascript
const getMessage = effect("message");
```

Next, you can create a handler to provide an implementation to this effect
We'll use `resume` to return a value to the program (continuation/`k`) that calls `getMessage`

```javascript
const withMessage = handler({
  message: (k) => resume(k, "hello world"),
});
```

After that, we can create our program that uses the `message` effect

```javascript
const program = eff(function* () {
  const msg = yield getMessage();
  return "my message to the world is: " + msg;
});
```

Finally, we can provide the handler to the effect (`withMessage`) and run the program

```javascript
run(withMessage(program))
.then(console.log)
.catch(console.error)
```

The result you'll will be `"my message to the world is: hello world"`

You can test effkit in this starter codesandbox [https://codesandbox.io/s/effkit-8nkwc?file=/src/index.js](https://codesandbox.io/s/effkit-8nkwc?file=/src/index.js) 