// import { of as RxJsOf, merge, Subject, ReplaySubject } from "rxjs";
import { handler, of, effect, Effect } from "./core";
import { CPS, makeMultishotGeneratorDo, pipe } from "./utils";

export const genHandler = (genHandler) => (val, exec, resume, then) => {
  const dogen = makeMultishotGeneratorDo(Effect.of)(Effect.chain)(val, (val) =>
    cps(resume(val))
  );
  exec(dogen(genHandler))(then ? then : resume); // in case used on return
};

export const io = effect("io");
export const withIo = handler({
  return: (res, exec, then) => then(() => res),
  io(thunk, exec, resume, then) {
    resume(thunk())(then);
  }
});

export const wait = effect("async");
export const withPromise = handler({
  return: (res, exec, then) => then(Promise.resolve(res)),
  // return: genHandler(function* (val) {
  //   return Promise.resolve(val);
  // }),
  // async(value, exec, resume, then) {
  //   value.then((promiseVal) => {
  //     resume(promiseVal)(then);
  //   });
  // },
  async: genHandler(function* (thunk, resume) {
    const promise = yield io(thunk);
    const promiseVal = yield cps((then) => promise.then(then));
    const res = yield resume(promiseVal);
    return res;
  })
});

export const foreach = effect("list");

export const withForeach = handler({
  return: (res, exec, then) => then([res]),

  // array(value, exec, resume, then) {
  //   function flatmap(arr, remaining) {
  //     const first = remaining[0];
  //     if (first) {
  //       resume(first)((res) => {
  //         flatmap(arr.concat(res), remaining.slice(1, remaining.length));
  //       });
  //     } else then(arr);
  //   }
  //   flatmap([], value);
  // },

  list: genHandler(function* (list, resume) {
    let newArray = [];
    for (let i = 0; i < list.length; i++) {
      const res = yield resume(list[i]);
      newArray = [...newArray, ...res];
    }
    return newArray;
  })
});
export const raise = effect("exn");

export const trycatch = (program) => (oncatch) =>
  handler({
    exn(value, exec, resume, then) {
      exec(oncatch(value))(then);
    }
  })(program);
export const cps = effect("cps");
export const withCps = handler({
  return: (value, exec, then) => {
    then(CPS.of(value));
  },
  cps(fn, exec, resume, then) {
    pipe(fn, CPS.chain(resume))(then);
  }
});

// export const subscribe = effect("subscribe");
// export const withSubscribe = handler({
//   return: (value) => of(RxJsOf(value)),
//   // subscribe: genHandler(function* (stream, resume) {
//   //   let newStream = of();
//   //   let sub;
//   //   const item = yield cps((then) => {
//   //     stream.subscribe(then);
//   //   });
//   //   const res = yield resume(item);
//   //   newStream = merge(res, newStream);
//   //   return newStream;
//   // })
//   subscribe: (stream, exec, resume, then) => {
//     let newStream = new ReplaySubject();
//     let sub = stream.subscribe((item) => {
//       resume(item)((res) => {
//         res.subscribe((e) => {
//           newStream.next(e);
//         });
//       });
//     });
//     then(newStream);
//   }
// });

export const dependency = effect("dependencies");
export const dependencies = (dependencyMap) =>
  handler({
    dependencies: genHandler(function* (key, resume) {
      const value = dependencyMap[key];
      if (value) {
        return yield resume(value);
      }
      return yield dependency(key);
    })
  });
