const { run, pure, effect, handler, eff, resume } = require("../src");

describe("dynamic scope", () => {
  it("shoud handle with the right handlers and return in the correct order", async () => {
    const test = effect("test1");
    const handleTest1 = handler({
      return: (val) => pure(val + " -> handleTest1"),
      test1: (k) => handleTest1SecondImpl(resume(k, 2)),
    });
    const handleTest1SecondImpl = handler({
      test1: (k) => resume(k, 10),
      return: (val) => pure(val + " -> handleTest1SecondImpl"),
    });
    const res = await run(
      handleTest1(
        eff(function* () {
          const first = yield test();
          const second = yield test();
          return [first, second, second].toString();
        })
      )
    );
    expect(res).toEqual("2,10,10 -> handleTest1 -> handleTest1SecondImpl");
  });
});
