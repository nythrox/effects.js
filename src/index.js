const {
  makeGeneratorDo,
  makeMultishotGeneratorDo,
  flow,
  pipe,
  id,
} = require("./utils");

const _chain = function (chainer) {
  return chain(chainer)(this);
};
const _map = function (mapper) {
  return map(mapper)(this);
};
const finishHandler = (value) => ({
  value,
  type: "FinishHandler",
  chain: _chain,
  map: _map,
});

/**
 * Creates a action (monad) that returns a value `value`
 * @param value
 */
const pure = (value) => ({
  value,
  type: "Pure",
  chain: _chain,
  map: _map,
});

const chain = (chainer) => (action) => ({
  chainer,
  after: action,
  type: "Chain",
  chain: _chain,
  map: _map,
});

/**
 * Transforms the value inside an Action (monad)
 * @param mapper
 */
const map = (mapper) => (action) => chain((val) => pure(mapper(val)))(action);

/**
 * Creates an effect
 * @param key key of the effect to later be handled in a map
 * @param value value to be passed to the handler
 */

const effect = (key) => (value) => ({
  key,
  value,
  type: "Effect",
  chain: _chain,
  map: _map,
});

const perform = (key, value) => effect(key)(value);
/**
 * Provides handlers to the program passed in the `program` ar
 * @param handlers map of handlers
 * @param program program to handle
 */
const handler = (handlers) => (program) => ({
  handlers,
  program,
  type: "Handler",
  chain: _chain,
  map: _map,
});

/**
 * This function is the same as `handler` but with the `program` argument first and `handlers` argument second
 *
 * Provides handlers to the program passed in the `program` arg
 * @param program program to handle
 * @param handlers map of handlers
 */
const handle = (program) => (handlers) => handler(handlers)(program);
const resume = (value) => ({
  value,
  type: "Resume",
  chain: _chain,
  map: _map,
});
const callback = (callback) => ({
  callback,
  type: "MultiCallback",
  chain: _chain,
  map: _map,
});
const singleCallback = (callback) => ({
  callback,
  type: "SingleCallback",
  chain: _chain,
  map: _map,
});

const findHandlers = (key) => (array) => {
  let handlers;
  // reverse map
  for (var i = array.length - 1; i >= 0; i--) {
    const curr = array[i];
    if (curr.handlers[key]) {
      handlers = [curr.handlers[key], curr.context];
    }
  }
  if (!handlers) {
    throw Error("Handler not found: " + key.toString());
  }
  return handlers;
};
class Interpreter {
  constructor(onDone, context) {
    this.context = context;
    this.onDone = onDone;
    this.isPaused = true;
  }
  run() {
    this.isPaused = false;
    while (this.context) {
      const action = this.context.action;
      const context = this.context;
      // console.log(action);
      switch (action.type) {
        case "Chain": {
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
            handlers: context.handlers,
            prev: context,
            resume: context.resume,
            action: action.after,
          };
          break;
        }
        case "Pure": {
          this.return(action.value, context);
          break;
        }
        case "SingleCallback": {
          this.context = undefined;
          action.callback((value) => {
            this.return(value, context);
            if (this.isPaused) {
              this.run();
            }
          });
          break;
        }
        case "FinishHandler": {
          this.context = undefined;
          const { callback, value } = action.value;
          // console.log("calling", callback.toString(), "with", value);
          callback(value);
          break;
        }
        case "MultiCallback": {
          this.context = undefined;
          action.callback(
            // exec
            (execAction) => (then) => {
              const ctx = {
                prev: context.prev,
                resume: context.resume,
                handlers: context.handlers,
                action: execAction.chain((n) =>
                  finishHandler({ callback: then, value: n })
                ),
              };
              const i = new Interpreter(undefined, ctx);
              i.isClone = true;
              i.run();
            },
            // done
            (value) => {
              if (this.isClone && !context.prev) {
                this.onDone(value);
              } else {
                this.return(value, context);
                context.prev = undefined;
                if (this.isPaused) {
                  this.run();
                }
              }
            }
          );
          break;
        }
        case "Handler": {
          const { handlers, program } = action;
          this.context = {
            prev: context,
            action: program,
            resume: context.resume,
            handlers: [
              ...context.handlers,
              {
                handlers,
                context,
              },
            ],
          };

          break;
        }
        case "Effect": {
          const { value } = action;
          const [handler, transformCtx] = findHandlers(action.key)(
            context.handlers
          );
          if (!handler || !transformCtx) {
            return;
          }
          const handlerAction = handler(value);
          const activatedHandlerCtx = {
            // 1. Make the activated handler returns to the *return transformation* parent,
            // and not to the *return transformation* directly (so it doesn't get transformed)
            prev: transformCtx.prev,
            action: handlerAction,
            handlers: transformCtx.handlers,
            resume: {
              transformCtx,
              programCtx: context,
            },
          };
          this.context = activatedHandlerCtx;
          break;
        }
        case "Resume": {
          // inside activatedHandlerCtx
          const { value } = action;
          const { resume } = context;
          // context of the transformer, context of the program to continue
          if (!resume) {
            throw Error("using resume outside of handler");
          }
          const { transformCtx, programCtx } = resume;
          // 2. continue the main program with resumeValue,
          // and when it finishes, let it go all the way through the *return* transformation proccess
          // /\ it goes all the way beacue it goes to programCtx.prev (before perform) that will eventuallyfall to transform
          // this.context = programCtx.nextInstruction(value);
          this.return(value, programCtx);
          // this.nextInstruction(value, programCtx);
          // 3. after the transformation is done, return to the person chaining `resume`
          // /\ when the person chaining resume (activatedHandlerCtx) is done, it will return to the transform's parent
          transformCtx.prev = context.prev;
          break;
        }
        default: {
          throw Error("invalid instruction: " + JSON.stringify(action));
        }
      }
    }
    this.isPaused = true;
  }
  return(value, currCtx) {
    const prev = currCtx && currCtx.prev;
    if (prev) {
      switch (prev.action.type) {
        case "Handler": {
          const { handlers } = prev.action;
          this.context = {
            resume: prev.resume,
            handlers: prev.handlers,
            prev: prev.prev,
            action: handlers.return ? handlers.return(value) : pure(value),
          };
          break;
        }
        case "Chain": {
          this.context = {
            handlers: prev.handlers,
            prev: prev.prev,
            resume: prev.resume,
            action: prev.action.chainer(value),
          };
          break;
        }
        default: {
          throw Error("invalid state: " + prev.action.type);
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
  },
});
const run = (program) =>
  new Promise((resolve, reject) => {
    try {
      new Interpreter((thunk) => resolve(thunk()), {
        handlers: [],
        prev: undefined,
        resume: undefined,
        action: withIo(program),
      }).run();
    } catch (e) {
      reject(e);
    }
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
  },
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
  callback,
  chain,
  pure,
  map,
  handle,
  handler,
  resume,
  perform,
  effect,
  Effect,
  eff
};


const timeout = handler({
  
})