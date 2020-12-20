
### Handlers
Handlers are responsible for catching the effect call and returning a result (resume) or skipping the computation and returning a value
To create a handler you can use the curried function `handler`, which receives as a first argument a map of handlers, and the second the program to be handled
```javascript
const withLog = handler({
   return(value, exec, then) { then(value) },
   logEffect(value, exec, resume, then) {
       console.log(value)
       resume(undefined)(then)
   }
})
```
Inside the map of handlers, each key should be a function that will handle an effect (of the same key), and the `return` function is a special function that transforms the result of the handled action (that is optional)

A handler function receives four parameters: 

`value` is the value passed in the effect (ex: 'hello world')

`exec: (action) => (callback) => void` will execute any action in the current handler stack (so you can perform other effects inside the handler) and then calls the callback with the result. this can be called multiple times

`resume: (value) => (callback) => void` will resume the effect call with a value, and then calls the callback with the result. this can be called multiple times

`then: (value) => void` should be called when the handler is done, passing in the result of the handler. this should only be called once

You can also use the generator version
```javascript
const withLog = handler({
  return: genHandler(function*(value) {
	  return value
  }),
  logEffect: genHandler(function* (value, resume) {
	  console.log(value)
	  const result = yield resume(undefined)
	  return result
   })
})
```

To learn more about effect handlers, see <a href="https://www.eff-lang.org/handlers-tutorial.pdf">here</a>
