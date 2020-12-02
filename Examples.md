### Examples
Here are a few examples of effects and handlers you can create

### Exceptions
You can very easily create try/catch and exceptions with some simple effects
```javascript
// creaet a new effect
const raise = effect('exn')
```
You can handle raised exceptions using a normal effect handler and simply not resuming the continuation
```javascript
const program = raise(new Error('something went wrong')
const myCustomErrorHandler = handler({
    exn: genHandler(function*(error, resume) {
        // we won't resume anything here, instead just return a different answer
        console.log(error)
        return "nothing went wrong! :)"
    })
})
```
Or you can create a handler that takes a function
```javascript
const trycatch = (program) => (oncatch) =>
  handler({
    exn: genHandler(function*(error, resume) {
       // we won't resume, instead we will call the provided function and return its result
       const result = yield Effect.do(() => oncatch(error))
       return result;
    })
  })(program);
  
  const handledProgram = trycatch(program)(function*(error) {
      console.log(error)
      return "nothing went wrong! :)"
  })
```
