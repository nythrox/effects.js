import { makeGeneratorDo, makeMultishotGeneratorDo } from "./utils";
class Of {
  constructor(value) {
    this.value = value;
  }
}
export class Chain {
  constructor(chainer, after) {
    this.chainer = chainer;
    this.after = after;
  }
}
export class Perform {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}
export class Handler {
  constructor(handlers, program) {
    this.handlers = handlers;
    this.program = program;
  }
}
export class Resume {
  constructor(value) {
    this.value = value;
  }
}

export class MultiCallback {
  constructor(callback) {
    this.callback = callback;
  }
}
export class SingleCallback {
  constructor(callback) {
    this.callback = callback;
  }
}
export class FinishHandler {
  constructor(value) {
    this.value = value;
  }
}
const c = function (chainer) {
  return new Chain(chainer, this);
};
const m = function (mapper) {
  return new Chain((e) => of(mapper(e)), this);
};

Of.prototype.chain = c;
Of.prototype.map = m;
Chain.prototype.chain = c;
Chain.prototype.map = m;
Perform.prototype.chain = c;
Perform.prototype.map = m;
Handler.prototype.chain = c;
Handler.prototype.map = m;
Resume.prototype.chain = c;
Resume.prototype.map = m;
MultiCallback.prototype.chain = c;
MultiCallback.prototype.map = m;
SingleCallback.prototype.chain = c;
SingleCallback.prototype.map = m;
FinishHandler.prototype.chain = c;
FinishHandler.prototype.map = m;

const finishHandler = (value) => new FinishHandler(value);

/**
 * Creates a action (monad) that returns a value `value`
 * @param value
 */
export const of = (value) => new Of(value);

export const chain = (chainer) => (action) => new Chain(chainer, action);

/**
 * Transforms the value inside an Action (monad)
 * @param mapper
 */
export const map = (mapper) => (action) =>
  new Chain((val) => of(mapper(val)), action);

/**
 * Creates an effect
 * @param key key of the effect to later be handled in a map
 * @param value value to be passed to the handler
 */

export const effect = (key) => (value) => new Perform(key, value);

/**
 * Provides handlers to the program passed in the `program` ar
 * @param handlers map of handlers
 * @param program program to handle
 */
export const handler = (handlers) => (program) =>
  new Handler(handlers, program);

/**
 * This function is the same as `handler` but with the `program` argument first and `handlers` argument second
 *
 * Provides handlers to the program passed in the `program` arg
 * @param program program to handle
 * @param handlers map of handlers
 */
export const handle = (program) => (handlers) => handler(handlers)(program);
export const resume = (value) => new Resume(value);

export const callback = (callback) => new MultiCallback(callback);
export const singleCallback = (callback) => new SingleCallback(callback);

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
export class Interpreter {
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
            handlers: context.handlers,
            prev: context,
            resume: context.resume,
            action: action.after
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
        case FinishHandler: {
          this.context = undefined;
          const { callback, value } = action.value;
          // console.log("calling", callback.toString(), "with", value);
          callback(value);
          break;
        }
        case MultiCallback: {
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
                )
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
        case Handler: {
          const { handlers, program } = action;
          this.context = {
            prev: context,
            action: program,
            resume: context.resume,
            handlers: [
              ...context.handlers,
              {
                handlers,
                context
              }
            ]
          };

          break;
        }
        case Perform: {
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
              programCtx: context
            }
          };
          this.context = activatedHandlerCtx;
          break;
        }
        case Resume: {
          // inside activatedHandlerCtx
          const { value } = action;
          const { resume } = context;
          // context of the transformer, context of the program to continue
          if (!resume) {
            throw new Error("using resume outside of handler");
            return;
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
          throw new Error("invalid instruction: " + JSON.stringify(action));
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
          const { handlers } = prev.action;
          this.context = {
            resume: prev.resume,
            handlers: prev.handlers,
            prev: prev.prev,
            action: handlers.return ? handlers.return(value) : new Of(value)
          };
          break;
        }
        case Chain: {
          this.context = {
            handlers: prev.handlers,
            prev: prev.prev,
            resume: prev.resume,
            action: prev.action.chainer(value)
          };
          break;
        }
        default: {
          throw new Error("invalid state");
        }
      }
    } else {
      this.onDone(value);
      this.context = undefined;
    }
  }
}
export const io = effect("io");
export const withIo = handler({
  return: (value) => of(() => value),
  io(thunk) {
    const value = thunk();
    return resume(value);
  }
});
export const run = (program) =>
  new Promise((resolve, reject) => {
    try {
      new Interpreter((thunk) => resolve(thunk()), {
        handlers: [],
        prev: undefined,
        resume: undefined,
        action: withIo(program)
      }).run();
    } catch (e) {
      reject(e);
    }
  });

export const Effect = {
  map,
  chain,
  of,
  single: makeGeneratorDo(of)(chain),
  do: makeMultishotGeneratorDo(of)(chain)
};
export const eff = Effect.single;
export const forEach = effect("forEach");

export const withForEach = handler({
  return: (val) => of([val]),
  forEach: (array) => {
    const nextInstr = (newArr = []) => {
      if (array.length === 0) {
        return of(newArr);
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

export { flow, pipe, id } from "./utils";
