const {
  withForEach,
  forEach,
  run,
  io,
  toEither,
  handleError,
  waitFor,
  raise,
  pure,
  pipe,
} = require("../src");

describe("forEach effect", () => {
  it("should not stackoverflow", async () => {
    const arr = Array.from({ length: 20000 });
    const arrProgram = withForEach(forEach(arr).map(() => 1));
    const res = await run(arrProgram);
    expect(res).toEqual(Array.from({ length: 20000 }).map(() => 1));
  });
});

describe("io effect", () => {
  it("should be automatically handled (io)", async () => {
    const program = io(() => 10);
    expect(await run(program)).toEqual(10);
  });
});

describe("ioPromise effect", () => {
  it("should be automatically handled ", async () => {
    const program = waitFor(() => Promise.resolve(10));
    expect(await run(program)).toEqual(10);
  });
});

describe("exception effect", () => {
  it("should be caught", async () => {
    const program = pipe(
      raise(1),
      handleError(() => pure(10))
    );
    expect(await run(program)).toEqual(10);
  });

  it("should be right", async () => {
    const program = pipe(pure(10), toEither);
    expect(await run(program)).toEqual({ type: "right", value: 10 });
  });

  it("should be left", async () => {
    const program = pipe(raise(10), toEither);
    expect(await run(program)).toEqual({ type: "left", value: 10 });
  });

  it("should throw an unhandled error", async () => {
    const program = raise(10);
    await run(program).catch((err) => {
      expect(err).toEqual(10);
    });
  });
});
