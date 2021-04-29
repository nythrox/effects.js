const {
  makeGeneratorDo,
  makeMultishotGeneratorDo,
  flow,
  pipe,
  id,
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
  constructor(key, args, options) {
    this.key = key;
    this.args = args;
    this.options = options;
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
  constructor(cont, value) {
    this.cont = cont;
    this.value = value;
  }
}
Resume.prototype.chain = c;
Resume.prototype.map = m;
class SingleCallback {
  constructor(callback) {
    this.callback = callback;
  }
}
SingleCallback.prototype.chain = c;
SingleCallback.prototype.map = m;

const pure = (value) => new Of(value);

const chain = (chainer) => (action) => new Chain(chainer, action);

const map = (mapper) => (action) =>
  new Chain((val) => pure(mapper(val)), action);

const effect = (key) => (...args) => new Perform(key, args);

const options = (options) => (perform) => (
  (perform.options = options), perform
);

const perform = (key, ...args) => new Perform(key, args);

const handler = (handlers) => (program) => new Handler(handlers, program);

const resume = (continuation, value) => new Resume(continuation, value);

const singleCallback = (callback) => new SingleCallback(callback);

const findHandlers = (key) => (context) => (onError) => {
  let curr = context;
  while (curr) {
    const action = curr.action;
    if (curr.action.constructor === Handler) {
      const handler = action.handlers[key];
      if (handler) {
        return [handler, curr.transformCtx];
      }
    }
    curr = curr.prev;
  }
  onError(Error("Handler not found: " + key.toString()));
};

class Interpreter {
  constructor(onDone, onError, context) {
    this.context = context;
    this.onError = onError;
    this.onDone = onDone;
    this.isPaused = true;
  }
  run() {
    this.isPaused = false;
    while (this.context) {
      const action = this.context.action;
      const context = this.context;
      // console.log(context, context.action);
      switch (action.constructor) {
        case Chain: {
          // const nested = action.after;
          // switch (nested.type) {
          //   case "of": {
          //     this.context = {
          //       handlers: context.handlers,
          //       prev: context.prev,
          //       resume: context.resume,
          //       action: action.chainer(nested.value)
          //     };
          //     break;
          //   }
          //   default: {}}
          this.context = {
            prev: context,
            action: action.after,
          };
          break;
        }
        case Of: {
          this.return(action.value, context);
          break;
        }
        case SingleCallback: {
          this.context = undefined;
          action.callback((value) => {
            this.return(value, context);
            if (this.isPaused) {
              this.run();
            }
          });
          break;
        }
        case Handler: {
          const { handlers, program } = action;
          const transformCtx = {
            prev: context,
            action: program,
          };
          const lastPrev = context.prev;
          context.prev = {
            prev: lastPrev,
            action: handlers.return
              ? program.chain(handlers.return)
              : program.chain(pure),
          };
          context.transformCtx = context.prev;
          this.context = transformCtx;
          break;
        }
        case Perform: {
          const { args, options } = action;
          const h = findHandlers(action.key)(
            options && options.scope ? options.scope.programCtx : context
          )(this.onError);
          if (!h) return;
          const [handler, transformCtx] = h;
          const handlerAction = handler(...args, {
            transformCtx,
            programCtx: context,
          });
          const activatedHandlerCtx = {
            // 1. Make the activated handler returns to the *return transformation* parent,
            // and not to the *return transformation* directly (so it doesn't get transformed)
            prev: transformCtx.prev,
            action: handlerAction,
          };
          this.context = activatedHandlerCtx;
          break;
        }
        case Resume: {
          // inside activatedHandlerCtx
          const { value, cont } = action;
          // context of the transformer, context of the program to continue
          if (!cont || !(cont && cont.transformCtx && cont.programCtx)) {
            this.onError(Error("Missing continuation parameter in resume"));
            return;
          }
          const { transformCtx, programCtx } = cont;
          // 3. after the transformation is done, return to the person chaining `resume`
          // /\ when the person chaining resume (activatedHandlerCtx) is done, it will return to the transform's parent
          transformCtx.prev = context.prev;
          // 2. continue the main program with resumeValue,
          // and when it finishes, let it go all the way through the *return* transformation proccess
          // /\ it goes all the way beacue it goes to programCtx.prev (before perform) that will eventually fall to transformCtx
          this.return(value, programCtx);
          break;
        }
        default: {
          this.onError(Error("Invalid instruction: " + JSON.stringify(action)));
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
            action: prev.action.chainer(value),
          };
          break;
        }
        default: {
          this.onError(new Error("Invalid state"));
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
  io: (thunk, k) => resume(k, thunk()),
});

const Effect = {
  map,
  chain,
  of: pure,
  single: makeGeneratorDo(pure)(chain),
  do: makeMultishotGeneratorDo(pure)(chain),
};
const eff = Effect.single;
const forEach = effect("forEach");

const withForEach = handler({
  return: (val) => pure([val]),
  forEach: (array, k) => {
    const nextInstr = (newArr = []) => {
      if (array.length === 0) {
        return pure(newArr);
      } else {
        const first = array.shift();
        return resume(k, first).chain((a) => {
          for (const item of a) {
            newArr.push(item);
          }
          return nextInstr(newArr);
        });
      }
    };
    return nextInstr();
  },
});

const raise = effect("error");
const handleError = (handleError) =>
  handler({
    error: (exn, k) => handleError(k, exn),
  });
const toEither = handler({
  return: (value) =>
    pure({
      type: "right",
      value,
    }),
  error: (exn) =>
    pure({
      type: "left",
      value: exn,
    }),
});
const waitFor = effect("async");

const withIoPromise = handler({
  return: (value) => pure(Promise.resolve(value)),
  async: (iopromise, k) =>
    io(iopromise).chain((promise) =>
      singleCallback((done) => {
        promise
          .then((value) => {
            done({ success: true, value });
          })
          .catch((error) => {
            done({ success: false, error });
          });
      }).chain((res) =>
        res.success
          ? resume(k, res.value)
          : options({
              scope: k,
            })(raise(res.error)).chain((e) => resume(k, e))
      )
    ),
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
        action: pipe(program, withIoPromise, toEither, withIo),
      }
    ).run();
  });
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
  singleCallback,
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
  handleError,
};
