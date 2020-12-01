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
export const of = (value) => (context) => void context.then(value);

export const chain = (chainer) => (effect) => (context) =>
  void effect({
    prev: context,
    handlers: context.handlers,
    then: (e) => {
      const eff2 = chainer(e);
      eff2(context);
    },
  });

/**
 * Runs a program (action monad) and returns a value. Might throw an error if there are no handlers found for a effect
 * @param effect
 * @param then callback to be called after the program finishes
 */
export const run = (action) => (then) =>
  void effect({
    prev: undefined,
    handlers: [],
    then,
  });

/**
 * Transforms the value inside an Action (monad)
 * @param {*} mapper
 */
export const map = (mapper) => (effect) => chain(flow(mapper, of))(effect);

/**
 * Creates an effect
 * @param key key of the effect to later be handled in a map
 * @param value value to be passed to the handler
 */

export const effect = (key) => (value) => (context) => {
  const [handler, handlerCtx] = findHandler(key)(context.handlers);
  handler(
    value,
    // exec
    (eff) => (then) => {
      const effectCtx = {
        prev: handlerCtx,
        handlers: handlerCtx.prev.handlers,
        then,
      };
      eff(effectCtx);
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
};

/**
 * Provides handlers to the program passed in the `program` ar
 * @param handlers map of handlers
 * @param program program to handle
 */
export const handler = (handlers) => (program) => (context) => {
  const programBeingHandledCtx = {
    prev: context,
    then: (val) => {
      if (handlers.return) {
        handlers.return(val)(context);
      } else of(val)(context);
    },
  };
  programBeingHandledCtx.handlers = [
    ...context.handlers,
    {
      handlers,
      context: programBeingHandledCtx,
    },
  ];
  program(programBeingHandledCtx);
};

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
  do: makeMultishotGeneratorDo(of)(chain),
};
