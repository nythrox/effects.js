### Effects
Effect lets you perform an effect and get the result from the handlers (or it throws an Exception if no handlers are found)
An Effect will find the closest handler and activate it, then receive the value that it `resumes` (if it does).


Effects should be used to model anything that could make a function impure - IO operations (logging, db calls, api calls - any interaction with the ouside world), exceptions, global mutation (or any interaction with outside of the function), nullable values, etc. This will make it really easy to test and better understand your code, guaranteeing referential transparency and allowing you to easily have dependency injection. 

To create an effect, you can use the curried `effect` function with the effects' key
> effect: (key) => (...args) => Action
The `effect` function receives an argument with the effects key, and then the value to be passed onto the handler 
```javascript
const log = effect('logEffect')
```
After that you can call the effect, and it will return an Action that provides the value of the result of the effect
```javascript

  // plusOne: (value) => Action<void>
  const log = effect('logEffect')

  // performed: Action<void>
  const performed = log('hello world')
  
  run(error).then(console.log).catch(console.error)
  // Error: "No handler found for effect logEffect"
```
