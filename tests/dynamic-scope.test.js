// const { run, pure, effect, handler, eff, resume } = require("../src");


// TODO: inserting a new Handler() around Resume() should make it the most recent handler in the scope
describe("dynamic scope", () => {
  it("shoud handle with the right handlers and return in the correct order", async () => {
//     const message = effect();
//     const logs1 = []
//     const logs2 = []
//     const handleMessage1 = handler({
//       return: (value) => pure(`(${value} into ${logs1})`),
//     //   [message]: (value, k) => (logs1.push(value), resume(k, value)),
//     name: 1,
//       [message]: (value, k) => (logs1.push(value), handleMessage2(resume(k, value))),
//     });
//     const handleMessage2 = handler({
//         name: 2,
//       return: (value) => pure(`(${value} into ${logs2})`),
//       [message]: (value, k) => (logs2.push(value), resume(k, value)),
//     });
//     const res = await run(
//       handleMessage1(
//         eff(function* () {
//           yield message(1)
//           console.log('----')
//           yield message(2)
//         //   yield message(3)
//         //   yield message(4)
//         })
//       )
//     );
//     console.log(res)
//     console.log(logs1, logs2)
//     // expect(res).toEqual("(handleMessage2 (handleMessage1 1))");
  });
});
