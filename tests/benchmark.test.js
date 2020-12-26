const {
  effect,
  handler,
  resume,
  run,
  callback,
  singleCallback,
} = require("../src");
const testEff = effect("test");
const newPromise = () => new Promise((resolve, reject) => setImmediate(resolve));

const withTest1Handler = handler({
  test: () => resume(),
});

const withTest2Handler = handler({
  test: () => callback((exec, done) => setImmediate(done)).chain(resume),
});
const withTest3Handler = handler({
  test: () => singleCallback((done) => setImmediate(done)).chain(resume),
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
    const test1StartTime = performance.now();
    await run(withTest1Handler(eff(100000)));
    const test1EndTime = performance.now();
    const test1Time = test1EndTime - test1StartTime;
    const test2StartTime = performance.now();
    await run(withTest2Handler(eff(100000)));
    const test2EndTime = performance.now();
    const test2Time = test2EndTime - test2StartTime;
    const test3StartTime = performance.now();
    await run(withTest3Handler(eff(100000)));
    const test3EndTime = performance.now();
    const test3Time = test3EndTime - test3StartTime;
    expect(test1Time).toBeLessThan(promiseTime);
    expect(test2Time).toBeLessThan(promiseTime);
    expect(test3Time).toBeLessThan(promiseTime);
    console.log(promiseTime, test1Time, test2Time, test3Time);
  });
});
