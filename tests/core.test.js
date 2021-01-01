const { handler, effect, run, resume, pipe, eff } = require("../src");

describe("effect multiple arguments", () => {
  it("should always receive all the arguments passed", async () => {
    const multiply = effect("multiply");
    const withMultipy = handler({
      multiply: (value, n) => {
        expect([value, n]).toEqual([20, 10]);
        return resume(value * n);
      },
    });
    const res = await pipe(multiply(20, 10), withMultipy, run);
    expect(res).toEqual(200);
  });
});

describe("defer actions for later", () => {
  it("should execute in the correct order", async () => {
    const defer = effect("defer");
    const log = effect("log");

    const withDefer = handler({
      defer: (fn) => {
        return resume().chain((value) => fn.map(() => value));
      },
    });
    let i = 1;
    const withLog = handler({
      log: (msg) => {
        switch (i) {
          case 1: {
            expect(msg).toEqual("loading");
            break;
          }
          case 2: {
            expect(msg).toEqual("finished");
            break;
          }
          case 3: {
            expect(msg).toEqual("done2");
            break;
          }
          case 3: {
            expect(msg).toEqual("done1");
            break;
          }
        }
        i++;
        return resume();
      },
    });

    const program = eff(function* () {
      yield defer(log("done1"));
      yield log("loading");
      yield defer(log("done2"));
      yield log("finished");
    });

    await run(withLog(withDefer(program)));
  });
});
