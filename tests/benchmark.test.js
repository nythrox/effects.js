const {
  effect,
  handler,
  resume,
  run,
  singleCallback,
} = require("../src");
const testEff = effect("test");
const newPromise = () =>
  new Promise((resolve, reject) => setImmediate(resolve));

// const withTest1Handler = handler({
//   test: (k) => resume(k),
// });

const withTest2Handler = handler({
  test: (k) =>
    singleCallback((done) => setImmediate(done)).chain((val) => resume(k, val)),
});

function eff(n) {
  if (n < 1) return testEff();
  return testEff().chain(() => eff(n - 1));
}
function p(n) {
  if (n < 1) return newPromise();
  return newPromise().then(() => p(n - 1));
}

describe("benchmarks", () => {
  it("should run faster than promises and not stack overflow", async () => {
    const promiseStartTime = performance.now();
    await p(100000);
    const promiseEndTime = performance.now();
    const promiseTime = promiseEndTime - promiseStartTime;
    // const test1StartTime = performance.now();
    // await run(withTest1Handler(eff(100000)));
    // const test1EndTime = performance.now();
    // const test1Time = test1EndTime - test1StartTime;
    const test2StartTime = performance.now();
    await run(withTest2Handler(eff(100000)));
    const test2EndTime = performance.now();
    const test2Time = test2EndTime - test2StartTime;
    // expect(test1Time).toBeLessThan(promiseTime);
    expect(test2Time).toBeLessThan(promiseTime);
    console.log(
      "promise: ",
      promiseTime,
      "eff: ",
      // test1Time,
      test2Time,
    );
  });
});
