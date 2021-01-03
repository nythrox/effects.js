should be:
activatedHandlerCtx -> transformCtx -> handlerScopeCtx -> newHandlerScopeCtx -> programCtx

currently:
handlerScopeCtx -> activatedHandlerCtx -> newHandlerScopeCtx -> transformCtx -> programCtx

todo: 
    - make initially and finally handlers
    - add `use` 