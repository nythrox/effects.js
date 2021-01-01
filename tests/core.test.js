const { handler, effect, run, resume } = require("../src");

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
