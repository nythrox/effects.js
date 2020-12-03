import { interpret } from "./core";
import { withCps, withIo } from "./core_effects";
/**
 * Runs a program (action monad) and then calls the callback with the result. Might throw an error if there are no handlers found for a effect. Automatically comes with the io and cps handlers 
 * @param action
 * @param then callback to be called after the program finishes
 */

export const run = (then) => (action) =>
  interpret({
    prev: undefined,
    handlers: [],
    then: (io) => io()(then),
  })(withIo(withCps(action)));

export {
  of,
  map,
  chain,
  effect,
  handler,
  Effect,
  handle,
  interpret,
} from "./core";
export {
  id,
  pipe,
  flow,
  makeMultishotGeneratorDo,
  makeGeneratorDo,
  CPS,
} from "./utils";
export {
  wait,
  withPromise,
  cps,
  withCps,
  foreach,
  withForeach,
  genHandler,
  raise,
  trycatch,
  io,
  withIo,
  reader,
  dependency
} from "./core_effects";
// const withTimesTwo = handler({
// timesTwo: (val, exec, resume, then) => {
//   exec(
//     Effect.do(function* () {
//       const timesTwo = yield cps((then) => {
//         then(val * 2);
//         then(val * 2);
//       });
//       console.log("called!");
//       const res = yield cps(resume(timesTwo));
//       return res;
//     })
//   )(then);
// }
//   timesTwo: genHandler(function* (val, resume) {
//     const res = yield resume(val * 2);
//     return res;
//   })
// });
// pipe(
//   effect("timesTwo")(10),
//   map((n) => n + 1),
//   withTimesTwo,
//   run(console.log)
// );

// const programmulti = Effect.do(function* () {
//   const num = yield foreach([1, 2, 3, 4, 5]);
//   const num2 = yield foreach([1, 2]);
//   return num * 2 * num2;
// });

// pipe(withForeach(programmulti), run(console.log));

// const programstream = Effect.do(function* () {
//   const num = yield forEachInStream(Rx.of(1, 2));
//   const num2 = yield forEachInStream(Rx.of(1, 2, 3));
//   const num3 = yield foreach([1, 2, 3, 4, 5]);
//   const num4 = yield waitFor(Promise.resolve(5));
//   return [num, num2, num3, num4];
// });

// pipe(
//   programstream,
//   withForeach,
//   withForEachInStream,
//   withPromise,
//   run((promise) => {
//     promise.then((stream) => {
//       stream.subscribe((array) => {
//         array.forEach((e) => {
//           console.log(e);
//         });
//       });
//     });
//   })
// );
