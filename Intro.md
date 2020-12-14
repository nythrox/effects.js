Algebraic effects bring a multitude of advantages:

dependency injection
programming in direct-style (like async await - but for any data structure: streams, arrays, etc)
combining monads
maintaining pure (referentially transparent) code while working with effects
many control flow constructs can be expressed with only algebraic effects: async/await, coroutines/fibers, generators, exceptions, backtracking, and more
It's easier to understand what it allows by seeing it in action:

  // write your program in direct style using the generator do notation
  const programDirectStyle = function*() {
     // dependency injection
     const auth = yield dependency('auth') 
     
     // run this every time the stream gets a new item
     const mouseEvent = yield subscribe(click$)
     
     // await for async call
     const user = yield getUser(auth.userId) 
     
     // for each account in the users list of accounts
     const account = yield foreach(user.accounts) 
     
     // await for async call
     yield submitEvent(user, { type: 'clicked', details: mouseEvent, account }) 
     
     return 'logged with account ${account.name}'
  } // after each click, returns ['logged with account account1', 'logged with account account2', ...] 

   <details>
   <summary>If you are not familiar with Functional Programming terms, see this explanation</summary>
   <br>
   explanation of only generator
   </details>


<details>
<summary>If you are familiar with Functional Programming terms (monads, do notation, pipe, currying, pointfree, etc), see this explanation</summary>
<br>
explanation of Action Monad, chain, map, etc
</details>
