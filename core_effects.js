export const waitFor = effect("async");
export const foreach = effect("list");

export const handlePromise = handler({
  return: (res) => of(Promise.resolve(res)),
  async(value, exec, resume, then) {
    value.then((promiseVal) => {
      resume(promiseVal)(then);
    });
  },
});

export const handleForeach = handler({
  return: (res) => of([res]),
  list(value, exec, resume, then) {
    function flatmap(arr, remaining) {
      const first = remaining[0];
      if (first) {
        resume(first)((res) => {
          flatmap(arr.concat(res), remaining.slice(1, remaining.length));
        });
      } else then(arr);
    }
    flatmap([], value);
  },
});
