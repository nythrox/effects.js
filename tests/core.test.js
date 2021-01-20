const { handler, effect, run, resume, pipe, eff, pure } = require("../src");

// describe("effect multiple arguments", () => {
//   it("should always receive all the arguments passed", async () => {
//     const multiply = effect("multiply");
//     const withMultipy = handler({
//       multiply: (value, n, k) => {
//         expect([value, n]).toEqual([20, 10]);
//         return resume(k, value * n);
//       },
//     });
//     const res = await pipe(multiply(20, 10), withMultipy, run);
//     expect(res).toEqual(200);
//   });
// });

// describe("defer actions for later", () => {
//   it("should execute in the correct order", async () => {
//     const defer = effect("defer");
//     const log = effect("log");

//     const withDefer = handler({
//       defer: (fn, k) => {
//         return resume(k).chain((value) => fn.map(() => value));
//       },
//     });
//     let i = 1;
//     const withLog = handler({
//       log: (msg, k) => {
//         switch (i) {
//           case 1: {
//             expect(msg).toEqual("loading");
//             break;
//           }
//           case 2: {
//             expect(msg).toEqual("finished");
//             break;
//           }
//           case 3: {
//             expect(msg).toEqual("done2");
//             break;
//           }
//           case 3: {
//             expect(msg).toEqual("done1");
//             break;
//           }
//         }
//         i++;
//         return resume(k);
//       },
//     });

//     const program = eff(function* () {
//       yield defer(log("done1"));
//       yield log("loading");
//       yield defer(log("done2"));
//       yield log("finished");
//     });

//     await run(withLog(withDefer(program)));
//   });
// });

describe("resume", () => {
  test("resume out of handler", async () => {
    const print = effect("print");
    const withPrint = handler({
      print: (value, k) => {
        expect(value).toEqual("printing (after being resumed from outside)");
        return resume(k);
      },
    });
    let callLater;
    const later = effect("later");
    const withLater = handler({
      later: (value, k) => {
        callLater = k;
        return pure(value);
      },
    });
    const test = eff(function* () {
      const result = yield later("do this later");
      yield print("printing (after being resumed from outside)");
      const result2 = yield later("do this later again");
      return { result, result2 };
    });

    const res = await run(withLater(test));
    expect(res).toEqual("do this later");
    const res2 = await run(withPrint(resume(callLater, "now1")));
    expect(res2).toEqual("do this later again");
    // you can call resume without adding an extra withLater handler, because the handler
    // was already added to the continution thanks to deep handlers
    const res3 = await run(resume(callLater, "now2")); 
    expect(res3).toEqual({
      result: "now1",
      result2: "now2"
    });
  });
});

// describe("scheduler", () => {
//   it("should execute in the correct order", async () => {
//     const fork = effect("fork");
//     const yield_ = effect("yield");
//     const schedule = (program) => {
//       const queue = [];
//       const enqueue = (k) => {
//         queue.push(k);
//       };
//       const dequeue = () => {
//         if (queue.length) {
//           return resume(queue.shift());
//         }
//         return pure();
//       };
//       const spawn = handler({
//         return: () => dequeue(),
//         yield: (k) => (enqueue(k), dequeue()),
//         fork: (program, k) => (enqueue(k), spawn(program))
//       });
//       return spawn(program);
//     };
//     const log = effect("log");
//     const withLog = handler({
//       log: (...msgs) => {
//         const k = msgs.pop();
//         console.log(...msgs);
//         return resume(k);
//       },
//     });
//     const tree = (id, depth) =>
//       eff(function* () {
//         yield log("starting with num", id);
//         if (depth > 0) {
//           yield log("forking num", id * 2 + 1);
//           yield fork(tree(id * 2 + 1, depth - 1));
//           yield log("forking num", id * 2 + 2);
//           yield fork(tree(id * 2 + 2, depth - 1));
//         } else {
//           yield log("yielding in num", id);
//           yield yield_();
//           yield log("resumed in number", id);
//         }
//         yield log("finishing number", id);
//       });

//     run(withLog(schedule(tree(0, 3))));
//   });
// });
