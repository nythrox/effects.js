### What are Algebraic Effects?
Algebraic effects are based on two two primary concepts: effects and handlers. Effects are just a representation of an action that can be performed. Handlers will catch the performed effects and can choose to resume the continuation with a result (like a promise), resume the continuation multiple times (like a stream), or not resume at all and cancel the computation (like an exception). Handlers can also transform the result of the computation (into a promise, a stream, an array, etc). 

Algebraic effects bring a multitude of advantages: 
- dependency injection
- programming in direct style (like async await - but for any data structure: streams, arrays, etc)
- combining monads
- working with effects while maintaining pure code
- many control flow constructs can be expressed with only algebraic effects: async/await, coroutines/fibers, generators, exceptions, backtracking, and more

TODO: add better explanations. 

You can read more about algebraic effects in the links bellow, or see some examples <a href="https://github.com/nythrox/effects.js/edit/master/Examples.md">here</a>:

https://github.com/yallop/effects-bibliography

https://www.eff-lang.org/handlers-tutorial.pdf

https://dl.acm.org/doi/pdf/10.1145/3276481

http://homepages.inf.ed.ac.uk/slindley/papers/handlers.pdf
