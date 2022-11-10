 function id(a) {
  return a;
}
 function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
  switch (arguments.length) {
    case 0:
      return id;
    case 1:
      return ab;
    case 2:
      return function () {
        return bc(ab.apply(this, arguments));
      };
    case 3:
      return function () {
        return cd(bc(ab.apply(this, arguments)));
      };
    case 4:
      return function () {
        return de(cd(bc(ab.apply(this, arguments))));
      };
    case 5:
      return function () {
        return ef(de(cd(bc(ab.apply(this, arguments)))));
      };
    case 6:
      return function () {
        return fg(ef(de(cd(bc(ab.apply(this, arguments))))));
      };
    case 7:
      return function () {
        return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))));
      };
    case 8:
      return function () {
        return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))));
      };
    case 9:
      return function () {
        return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))));
      };
    default:
      const init_val = ab.apply(this, arguments);
       return function () {
        return Array.from(arguments).slice(1).reduce((acc, f) => f(acc), init_val);
       }
  }
}
 function pipe(
  a,
  ab,
  bc,
  cd,
  de,
  ef,
  fg,
  gh,
  hi,
  ij,
  jk,
  kl,
  lm,
  mn,
  no,
  op,
  pq,
  qr,
  rs,
  st
) {
   switch (arguments.length) {
     case 0:
        return;
    case 1:
      return a;
    case 2:
      return ab(a);
    case 3:
      return bc(ab(a));
    case 4:
      return cd(bc(ab(a)));
    case 5:
      return de(cd(bc(ab(a))));
    case 6:
      return ef(de(cd(bc(ab(a)))));
    case 7:
      return fg(ef(de(cd(bc(ab(a))))));
    case 8:
      return gh(fg(ef(de(cd(bc(ab(a)))))));
    case 9:
      return hi(gh(fg(ef(de(cd(bc(ab(a))))))));
    case 10:
      return ij(hi(gh(fg(ef(de(cd(bc(ab(a)))))))));
    case 11:
      return jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a))))))))));
    case 12:
      return kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a)))))))))));
    case 13:
      return lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a))))))))))));
    case 14:
      return mn(lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a)))))))))))));
    case 15:
      return no(mn(lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a))))))))))))));
    case 16:
      return op(no(mn(lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a)))))))))))))));
    case 17:
      return pq(op(no(mn(lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a))))))))))))))));
    case 18:
      return qr(
        pq(op(no(mn(lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a))))))))))))))))
      );
    case 19:
      return rs(
        qr(pq(op(no(mn(lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a)))))))))))))))))
      );
    case 20:
      return st(
        rs(
          qr(pq(op(no(mn(lm(kl(jk(ij(hi(gh(fg(ef(de(cd(bc(ab(a)))))))))))))))))
        )
      );
     default:
       return Array.from(arguments).reduce((acc, f) => f(acc));
  }
}

 const makeMultishotGeneratorDo = (of) => (chain) => (generatorFun) => {
  function run(history) {
    const it = generatorFun();
    let state = it.next();
    history.forEach((val) => {
      state = it.next(val);
    });
    if (state.done) {
      return of(state.value);
    }
    return chain((val) => {
      return run([...history, val]);
    })(state.value);
  }
  return run([]);
};
 const makeGeneratorDo = (of) => (chain) => (generatorFun) => {
  const it = generatorFun();
  let state = it.next();
  function run(state) {
    if (state.done) {
      return of(state.value);
    }
    return chain((val) => {
      return run(it.next(val));
    })(state.value);
  }
  return run(state);
};

module.exports = {
  makeGeneratorDo,
  makeMultishotGeneratorDo,
  pipe,
  flow,
  id
}