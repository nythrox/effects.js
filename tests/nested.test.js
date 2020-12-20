const {
  effect,
  handler,
  resume,
  run,
  singleCallback,
  pipe,
  pure,
} = require("../src");

const test1 = effect("test1");
const test2 = effect("test2");
const test3 = effect("test3");

const withTest1 = handler({
  return: (val) => pure(val + "f1"),
  // test1: (value) =>
  //   callback((exec, done) => {
  //     exec(resume(value + "!"))((val) => done("~" + val + "~"));
  //   }),
  test1: (value) => resume(value + "!").map((val) => "~" + val + "~"),
});
const withTest2 = handler({
  return: (val) => pure(val + "f2"),
  // test2: (value) =>
  //   callback((exec, done, resume) => {
  //     resume(value + "!")((val) => done("+" + val + "+"));
  //     // exec(resume(value + "!"))((val) => done("+" + val + "+"));
  //     // .chain((val) => finishHandler("+" + val + "+")));
  //   })

  test2: (value) =>
    resume(value + "!").chain((val) =>
      singleCallback((done) => {
        done("+" + val + "+");
      })
    ),
  // test2: (value) => resume(value + "!").map((val) => "+" + val + "+")
});
const withTest3 = handler({
  return: (val) => pure(val + "f3"),
  // test3: (value) =>
  //   callback((exec, done, resume) => {
  //   resume(value + "!")((val) => done("(" + val + ")"));
  //   // exec(resume(value + "!"))((val) => done("(" + val + ")"));
  //   // exec(
  //   //   resume(value + "!")
  //   //     // owo
  //   //     .chain((val) => finishHandler("(" + val + ")"))
  //   //   // owo
  //   // );
  // })
  test3: (value) =>
    resume(value + "!").chain(
      (val) =>
        // singleCallback((done) => {
        pure("(" + val + ")")
      // })
    ),
  // test3: (value) => resume(value + "!").map((val) => "(" + val + ")")
});

const programhandlerscopedtest = test1("hi0").chain((hi1) =>
  test2("hi2").chain((hi2) => test3("hi3").map((hi3) => hi1 + hi2 + hi3))
);

describe("nested handlers", () => {
  it("should have the correct result",async () => {
    const res = await pipe(programhandlerscopedtest, withTest1, withTest2, withTest3, run);
    expect(res).toEqual("(+~hi0!hi2!hi3!f1~f2+f3)")
  });
});
