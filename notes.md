should be:
activatedHandlerCtx -> transformCtx -> handlerScopeCtx -> newHandlerScopeCtx -> programCtx

currently:
handlerScopeCtx -> activatedHandlerCtx -> newHandlerScopeCtx -> transformCtx -> programCtx

eff lang:
activatedHandlerCtx -> newHandlerScopeCtx -> transformCtx -> handlerScopeCtx -> programCtx


todo: - make initially and finally handlers from koka - add `use` from koka - add mask from koka

solution to context problem:
have a handlers LL (handlers -> handlers -> handlers -> handlers)

```javascript
const activatedHandlerCtx = {
    prev: transformCtx.prev,
    handlers: transformHandlers.prev.prev,
    action: handlerAction
};
```
```
handler {
    error: (k) => {
        // performing here will use the handlers scope
        perform raise "error"
        with { error: (k) => resume k () } handle {
            perform raise "error" // performing here will use `with handle` + handlers scope
            resume k () // performing in resume will use `with handle` + program scope (w deep handler) + handlers scope
        }
    }
}
```