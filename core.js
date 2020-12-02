import { flow, makeMultishotGeneratorDo, makeGeneratorDo } from "./utils";

const findHandler = (key) => (arr) => {
  let handlers;
  // reverse map
  arr.forEach((_, index, array) => {
    const curr = array[array.length - 1 - index];
    if (curr.handlers[key]) {
      handlers = [curr.handlers[key], curr.context];
    }
  });
  if (!handlers) throw new Error("Handler not found: " + key.toString());
  return handlers;
};
/**
 * Creates a action (monad) that returns a value `value`
 * @param value
 */
export const of = (value) => ({
  type: "of",
  value
});

export const chain = (chainer) => (action) => ({
  type: "chain",
  chainer,
  after: action
});

/**
 * Creates an effect
 * @param key key of the effect to later be handled in a map
 * @param value value to be passed to the handler
 */

export const effect = (key) => (value) => ({
  type: "effect",
  value,
  key
});

/**
 * Provides handlers to the program passed in the `program` ar
 * @param handlers map of handlers
 * @param program program to handle
 */
export const handler = (handlers) => (program) => ({
  type: "handler",
  handlers,
  program
});

export const interpret = (context) => (action) => {
  switch (action.type) {
    case "of": {
      context.then(action.value);
      return;
    }
    case "chain": {
      interpret({
        prev: context,
        handlers: context.handlers,
        then: (e) => {
          const eff2 = action.chainer(e);
          interpret(context)(eff2);
        }
      })(action.after);
      return;
    }
    case "effect": {
      const [handler, handlerCtx] = findHandler(action.key)(context.handlers);
      handler(
        action.value,
        // exec
        (action) => (then) => {
          const effectCtx = {
            prev: handlerCtx,
            handlers: handlerCtx.prev.handlers,
            then
          };
          interpret(effectCtx)(action);
        },
        // k/resume
        (value) => (thenContinueHandler) => {
          //when the (return) transforming is done, call `thenContinueHandler`
          handlerCtx.prev.then = thenContinueHandler;
          context.then(value);
        },
        // instead of returning to parent, return to the handlers parent
        handlerCtx.prev.then
      );
      return;
    }
    case "handler": {
      const { handlers, program } = action;
      const programBeingHandledCtx = {
        prev: context,
        then: (val) => {
          if (handlers.return) {
            interpret(context)(handlers.return(val));
          } else interpret(context)(of(val));
        }
      };
      programBeingHandledCtx.handlers = [
        ...context.handlers,
        {
          handlers,
          context: programBeingHandledCtx
        }
      ];
      interpret(programBeingHandledCtx)(program);
      return;
    }
    default: {
      throw new Error("invalid instrution: " + JSON.stringify(action));
    }
  }
};

/**
 * Transforms the value inside an Action (monad)
 * @param {*} mapper
 */
export const map = (mapper) => (effect) => chain(flow(mapper, of))(effect);

/**
 * This function is the same as `handler` but with the `program` argument first and `handlers` argument second
 *
 * Provides handlers to the program passed in the `program` arg
 * @param program program to handle
 * @param handlers map of handlers
 */
export const handle = (program) => (handlers) => handler(handlers)(program);

export const Effect = {
  map,
  chain,
  of,
  single: makeGeneratorDo(of)(chain),
  do: makeMultishotGeneratorDo(of)(chain)()
};
