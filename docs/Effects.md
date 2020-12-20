
### Effects
Effects are actions that will find a handler and receive the value that it returns

To create an effect, you just need to call the curried `effect` function with the effects' key
```javascript
const log = effect('logEffect')
```
After that you can call the effect, and it will return an Action that provides the value of the result of the effect
```javascript
  log('hello world') // call effect
 // throws Error: "No handler found for effect logEffect"
```