const {
  makeGeneratorDo,
  makeMultishotGeneratorDo,
  flow,
  pipe,
  id
} = require("./utils");
const c = function (chainer) {
  return new Chain(chainer, this);
};
const m = function (mapper) {
  return new Chain((e) => pure(mapper(e)), this);
};
class Of {
  constructor(value) {
    this.value = value;
  }
}
Of.prototype.chain = c;
Of.prototype.map = m;
class Chain {
  constructor(chainer, after) {
    this.chainer = chainer;
    this.after = after;
  }
}
Chain.prototype.chain = c;
Chain.prototype.map = m;
class Perform {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}
Perform.prototype.chain = c;
Perform.prototype.map = m;
class Handler {
  constructor(handlers, program) {
    this.handlers = handlers;
    this.program = program;
  }
}
Handler.prototype.chain = c;
Handler.prototype.map = m;
class Resume {
  constructor(value) {
    this.value = value;
  }
}
Resume.prototype.chain = c;
Resume.prototype.map = m;

class Break {}
Break.prototype.chain = c;
Break.prototype.map = m;
export const stop = () => new Break();
const pure = (value) => new Of(value);

const chain = (chainer) => (action) => new Chain(chainer, action);

const map = (mapper) => (action) =>
  new Chain((val) => pure(mapper(val)), action);

const effect = (key) => (value) => new Perform(key, value);

const perform = (key, value) => new Perform(key, value);

const handler = (handlers) => (program) => new Handler(handlers, program);

const resume = (value) => new Resume(value);
const resume$ = (interpreter) => (value) => {
  interpreter.return(value, interpreter.lastStop.context);
  interpreter.lastStop = undefined;
  if (interpreter.isPaused) {
    interpreter.run();
  }
};
const findHandlers = (key) => (context) => (onError) => {
  // reverse map
  let curr = context;
  while (curr) {
    const action = curr.action;
    if (curr.action.constructor === Handler) {
      // console.log(curr.action.handlers);
      const handler = action.handlers[key];
      if (handler) {
        // console.log("found handler", handler.toString(), curr.transformCtx);
        return [handler, curr.transformCtx];
      }
    }
    curr = curr.prev;
  }
  onError(Error("Handler not found: " + key.toString()));
};
// todo: callback that can return void (single) or return another callback
class Interpreter {
  constructor(onDone, onError, context, resume) {
    this.context = context;
    this.onError = onError;
    this.onDone = onDone;
    this.resume = resume;
    this.isPaused = true;
  }
  run() {
    this.isPaused = false;
    while (this.context) {
      const action = this.context.action;
      const context = this.context;
      // console.log(action, context);
      switch (action.constructor) {
        case Chain: {
          // const nested = action.after;
          // switch (nested.type) {
          //   case "of": {
          //     this.context = {
          //       prev: context.prev,
          //       action: action.chainer(nested.value)
          //     };
          //     break;
          //   }
          //   default: {}}
          this.context = {
            // handlers: context.handlers,
            prev: context,
            action: action.after
          };
          break;
        }
        case Of: {
          this.return(action.value, context);
          break;
        }
        case Break: {
          this.lastStop = { context };
          this.context = undefined;
          // action.callback((value) => {
          //   this.return(value, context);
          //   if (this.isPaused) {
          //     this.run();
          //   }
          // });
          break;
        }
        case Handler: {
          const { handlers, program } = action;
          const transformCtx = {
            prev: context,
            action: handlers.return ? program.chain(handlers.return) : program
            // handlers: [
            //   ...context.handlers,
            //   {
            //     handlers,
            //     context
            //   }
            // ]
          };
          context.transformCtx = transformCtx;
          this.context = transformCtx;

          break;
        }
        case Perform: {
          const { value } = action;
          const h = findHandlers(action.key)(context)(this.onError);
          if (!h) return;
          const [handler, transformCtx] = h;

          const handlerAction = handler(value, this);

          const activatedHandlerCtx = {
            // 1. Make the activated handler returns to the *return transformation* parent,
            // and not to the *return transformation* directly (so it doesn't get transformed)
            prev: transformCtx.prev,
            action: handlerAction
          };
          this.resume = {
            transformCtx,
            programCtx: context
          };
          this.context = activatedHandlerCtx;
          break;
        }
        case Resume: {
          // inside activatedHandlerCtx
          const { value } = action;
          // context of the transformer, context of the program to continue
          if (!resume) {
            this.onError(Error("using resume outside of handler"));
            return;
          }
          const { transformCtx, programCtx } = this.resume;
          transformCtx.prev = context.prev;
          this.return(value, programCtx);
          break;
        }
        default: {
          this.onError(Error("invalid instruction: " + JSON.stringify(action)));
          return;
        }
      }
    }
    this.isPaused = true;
  }
  return(value, currCtx) {
    const prev = currCtx && currCtx.prev;
    if (prev) {
      switch (prev.action.constructor) {
        case Handler: {
          this.return(value, prev);
          break;
        }
        case Chain: {
          this.context = {
            prev: prev.prev,
            action: prev.action.chainer(value)
          };
          break;
        }
        default: {
          this.onError("invalid state");
          return;
        }
      }
    } else {
      this.onDone(value);
      this.context = undefined;
    }
  }
}
const io = effect("io");
const withIo = handler({
  return: (value) => pure(() => value),
  io(thunk) {
    const value = thunk();
    return resume(value);
  }
});

const Effect = {
  map,
  chain,
  of: pure,
  single: makeGeneratorDo(pure)(chain),
  do: makeMultishotGeneratorDo(pure)(chain)
};
const eff = Effect.single;
const forEach = effect("forEach");

const withForEach = handler({
  return: (val) => pure([val]),
  forEach: (array) => {
    const nextInstr = (newArr = []) => {
      if (array.length === 0) {
        return pure(newArr);
      } else {
        const first = array.shift();
        return resume(first).chain((a) => {
          for (const item of a) {
            newArr.push(item);
          }
          return nextInstr(newArr);
        });
      }
    };
    return nextInstr();
  }
});

const raise = effect("error");
const handleError = (handleError) =>
  handler({
    error: (exn) => handleError(exn)
  });
const toEither = handler({
  return: (value) =>
    pure({
      type: "right",
      value
    }),
  error: (exn) =>
    pure({
      type: "left",
      value: exn
    })
});
const waitFor = effect("async");

const withIoPromise = handler({
  return: (value) => pure(Promise.resolve(value)),
  async: (iopromise, interpreter) =>
    io(iopromise).chain((promise) => {
      console.log("hello");
      promise.then(resume$(interpreter));
      return stop();
    })

  // .chain((promise) =>

  //   // callback((_, done, execInProgramScope) => {
  //   //   promise.then(done);
  //   //   promise.catch((err) => {
  //   //     execInProgramScope(raise(err))(done);
  //   //   });
  //   }).chain(resume)

  // .chain((promise) =>
  //   singleCallback((done) => {
  //     promise.then((value) =>
  //       done({
  //         success: true,
  //         value
  //       })
  //     );
  //     promise.catch((error) => {
  //       done({
  //         success: false,
  //         error
  //       });
  //     });
  //   })
  // )
  // .chain((res) => {
  //   if (res.success) {
  //     return resume(res.value);
  //   } else {
  //     return raise(res.error);
  //   }
  // })
});
const run = (program) =>
  new Promise((resolve, reject) => {
    new Interpreter(
      (thunk) => {
        const either = thunk();
        if (either.type === "right") {
          resolve(either.value);
        } else {
          reject(either.value);
        }
      },
      reject,
      {
        prev: undefined,
        resume: undefined,
        action: pipe(program, withIoPromise, toEither, withIo)
      }
    ).run();
  });

const test1 = effect("test1");
const handleTest1 = handler({
  return: (val) => pure(["dindonutin", ...val]),
  test1: (val) => handleTest1SecondImpl(resume(2))
});
const handleTest1SecondImpl = handler({
  test1: (val) => resume(10),
  return: (val) => pure([...val, "!"])
});
run(
  // handleTest1(pure(10))
  handleTest1(
    eff(function* () {
      const first = yield test1();
      const second = yield test1();
      const third = yield test1();
      return [first, second, third];
    })
  )
);
.then(console.log)
.catch(console.error);

const program = waitFor(() => Promise.resolve(10));
run(program).then(console.log).catch(console.error);
module.exports = {
  flow,
  pipe,
  id,
  withForEach,
  eff,
  forEach,
  run,
  io,
  withIo,
  Interpreter,
  chain,
  pure,
  map,
  handler,
  resume,
  perform,
  effect,
  Effect,
  toEither,
  waitFor,
  withIoPromise,
  raise,
  handleError
};
