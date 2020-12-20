const {
  effect,
  pipe,
  io,
  handler,
  resume,
  run,
  pure,
  callback,
  Effect,
  singleCallback,
} = require("../src/");

const zzz = effect("test");
const ez = () => zzz();
const seila = handler({
  test: () => resume(),
});
const promise = () =>
  new Promise((resolve, reject) => {
    resolve();
  });

function eff(n) {
  if (n < 1) return ez();
  return ez().chain(() => eff(n - 1));
}
function p(n) {
  if (n < 1) return promise();
  return promise().then(() => p(n - 1));
}

describe("benchmarks", () => {
  it("should run faster than promises", async () => {
    const promise1 = performance.now();
    await p(1000000);
    const promise2 = performance.now();
    const promiseTime = promise2 - promise1;
    const p1 = performance.now();
    await run(seila(eff(1000000)));
    const p2 = performance.now();
    const effTime = p2 - p1;
    expect(effTime).toBeLessThan(promiseTime);
    //   console.log(
    //     "eff1:",
    //     effTime,
    //     "promise:",
    //     promiseTime,
    //     "faster:",
    //     effTime < promiseTime ? "eff" : "promise"
    //   );
  });
});
