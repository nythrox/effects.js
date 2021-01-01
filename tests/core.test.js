const { handler, effect, run, resume, pipe, eff, pure } = require("../src");

describe("effect multiple arguments", () => {
  it("should always receive all the arguments passed", async () => {
    const multiply = effect("multiply");
    const withMultipy = handler({
      multiply: (value, n, k) => {
        expect([value, n]).toEqual([20, 10]);
        return resume(k, value * n);
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
      defer: (fn, k) => {
        return resume(k).chain((value) => fn.map(() => value));
      },
    });
    let i = 1;
    const withLog = handler({
      log: (msg, k) => {
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
        return resume(k);
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

describe("resume", () => {
  test("resume out of scope", async () => {
    const print = effect("print");
    const DO_THIS_LATER = "do this later";
    const DO_AFTER = "do after";
    const DONE = "done ";
    const PRINTED = " printed ";
    const NOW = "now";
    const withPrint = handler({
      print: (value, k) => {
        expect(value).toEqual(DO_AFTER);
        return resume(k).map((res) => res + PRINTED + value);
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
      const result = yield later(DO_THIS_LATER);
      expect(result).toEqual(NOW);
      yield print(DO_AFTER);
      return DONE + result;
    });

    const res = await run(withLater(test));
    expect(res).toEqual(DO_THIS_LATER);

    const res2 = await run(withPrint(resume(callLater, NOW)));
    expect(res2).toEqual(DONE + NOW + PRINTED + DO_AFTER);
  });
});
