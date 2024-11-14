# **err-dat**

## Summary

Exports functions { `syncTry`, `asyncTry`, `multiSyncTry`, `multiAsyncTry`, `pipeSyncTry`, `pipeAsyncTry` } that **catch thrown errors** and provides them **as values**, which conform to an **`[err, dat]` tuple** format when returning from their wrapped functions, in a pattern corresponding to the proposal: ["Safe Assignment Operator"](https://github.com/arthurfiorette/proposal-safe-assignment-operator) `?=` *(which should probably be `!?=` instead...)*

Also provides { `panic`, `ensureError` } helper functions that help ease and enforce robust error handling!

Finally, provides a set of custom Errors: { `GenericError` } that `extends Error` & adds `this.context`, as well as errors { `UnresolvableError`, `...` } that `extends GenericError`, where `UnresolvableError` indicates that the state of the program is such that it should abort, usually (*if not always*) via `panic`!  These custom errors conform to a superset of the HTTP statusCode spec, with the addition of `"0xx"` errors reserved for `GenericError` and `CustomError`s, and `"600"` being reserved for `UnresolvableError`.

### Quick examples:
```ts
import { asyncTry, ensureError, multiAsyncTry, panic, multiSyncTry, panic, syncTry } from "err-dat";
```

#### `asyncTry`
```ts
/**
 * `asyncTry`
 *  where: 
 *    <As extends any[], B extends any, E extends GenericError>
 * @param {(...args: As) => B} asyncFnToTry
 * @param {(E[] | null) | undefined} errorsToCatch
 * @param {((B) => void) | undefined} onDone
 */
const tryGetUser = asyncTry(getUser, 
  [
    BadRequestError,
    NotFoundError,
    CustomError,
    UnresolvableError,
  ]
);

const [err, dat] = await tryGetUser(2);
// check if there's an error, and if so, handle it appropriately!
if (err) {
  if (err instanceof UnresolvableError) {
    panic(
      "Something went wrong while trying to get user", 
      {
        value: 2,
        cause: err.cause,
        fileName: err.fileName,
        lineNumber: err.lineNumber,
      }
    );
  }
  if (err.cause instanceof NotFoundError) {
    return handleNotFound(err.cause, err.fileName, err.lineNumber);
  }
  if (err.cause instanceof BadRequestError) {
    return handleBadRequest(err.cause, err.fileName, err.lineNumber);
  }
  if (err.cause instanceof GenericError) {
    return handleGeneric(err.message, err.cause, err.cause?.cause);
  }
}
// ...get to the happy-path logic!
// .
// .
// .
```

#### `syncTry`
```ts
/**
 * `syncTry`
 *  where:
 *    <A extends any[], B extends any, E extends GenericError>
 * @param {(...args: As) => B} fnToTry 
 * ? a synchronous function that might throw an error.
 * @param {(E[] | null) | undefined} errorsToCatch 
 * ? an optional Array of GenericError class or subclass, where: class GenericError extends Error (+ adds a this.context).
 * @param {((B) => void) | undefined} onDone 
 * ? an optional parameter that is called with the returned value when successful, and without the returned value when unsuccessful.
 */
const msg: string = "test";
const that = (msg: string) => {
  throw new GenericError(msg);
}
const captureThrownErrorWith = syncTry(that, 
  [
    UnresolvableError,
    NotFoundError,
    BadRequestError,
    // GenericError, // (redundant, already baked-in as a check)
  ],
  (successValue) => {
    console.log({ successValue })
  }
);

const [err, dat] = captureThrownErrorWith(msg);
if (err) {
  if (err instanceof UnresolvableError) {
    panic(err.message, {
      owners: ["Xs-and-10s"],
      fileName: "README.md",
      lineNumber: 42,
      info: "captureThrownErrorWith",
      value: msg
    });
    return;
  }
  if (err instanceof NotFoundError) {
    return handleNotFound(err);
  }
  if (err instanceof BadRequestError) {
    return handleBadRequest(err);
  }
  if (err instanceof GenericError) {
    return handleGeneric(err);
  }
  // ... now we're on the happy path!
  // .
  // .
  // .
}
```
```ts
// ! `syncTry` can also handle recursive functions (both tail & non-tail):
const total = 5050;
const range = [1, 100] as const;

const sumRange = ([a, z]: readonly [a: number, z: number], y = 0) => {
  // Base case: when we've processed all pairs
  if (a > z) return y;
  // Edge case: If we have a single number left, add it to accumulator `y`
  if (a === z) return y + a;
  // Add current pair and continue with next pair
  return sumRange([a + 1, z - 1] as const, y + a + z);
};
const trySumRange = syncTry(sumRange);

const [err, dat] = trySumRange(range, 0);
// ....^....^
// .
// .
// .
expect(err).toBeUndefined();
expect(dat).toBe(total);
```

#### `multiAsyncTry`
```ts
/**
 *  where:
 *    <X extends UnresolvableError, P extends Promise<any>>
 * @typedef {Object} MultiSettled
 * @property {X} exception
 * ? // only present when `failed === true`, in which case `firstSettled` & `allSettled` are absent ! 
 * @property {boolean} failed
 * ? // indicates the presence of an `exception` and the absence of both `firstSettled` & `allSettled` (IFF failed: true)... or the opposite (IFF failed: false) !
 * @property {P[]} allSettled
 * @property {P} firstSettled
 */

/**
 * ! `multiAsyncTry`
 * 
 * @param {Array<Promise<any>>} promisesToTry an array of promises
 * @returns {MultiSettled} {failed: false, firstSettled, allSettled}
 * `allSettled` is fully populated when all the promises have settled, while `firstSettled` is the first promise to settle... where each promise for both is converted into an `[err, dat]` format.
 * @returns {MultiSettled} {failed: true, exception}
 * Alternatively, could return an exception if an UnresolvableError occurred, corrupting the state of the program/fiber.
 */
//
const fetchUserServices = multiAsyncTry<[number, number, GenericError]>([
  fetchUserHistory,
  fetchUserProfile,
  Promise.reject,
]);

const {
  exception,
  failed,
  firstSettled,
  allSettled,
} = await fetchUserServices([id, id, new GenericError("an error")]);

if (failed) {
  throw exception;
}
const [theFirstError, theFirstResult] = await firstSettled;
// ... handle logic if needed for the first results...
// .
// .
// .
const [[err1, dat1], [err2, dat2], [err3, dat3]] = await allSettled;
// ...handle rest of the logic now...
// .
// .
// .
expect(theFirstError).toBe(err3);
expect(theFirstResult).toBeUndefined();
expect(dat3).toBe(theFirstResult);
```

#### `multiSyncTry`
```ts
/**
 * `multiSyncTry`
 *    where:
 *      <?>
 * 
 */
//
const parsePair = multiSyncTry<[string, string], [Jsonable, Jsonable]>([
  (a) => JSON.parse(a),
  JSON.parse
]);
const { exception, failed, finished } = parsePair("null", '{"x":}');

if (failed) {
  throw exception;
}

const [[err1, dat1], [err2, dat2]] = finished;
// .....^.....^.......^.....^
// .
// .
// .
expect(err1).toBeUndefined();
expect(dat1).toBe(null);
expect(err2).toBeInstanceOf(GenericError)
expect(dat2).toBeUndefined();
```

#### `pipeAsyncTry`
```ts
/**
 * `pipeAsyncTry`
 *  where:
 *    <?>
 */
// ...
const fetchUserInfo = pipeAsyncTry<[number, number], User>([
  fetchUserById,
  fetcherUserAvatar,
]);

const [err, dat] = await fetchUserInfo(42);
// ....^....^
// .
// .
// .
// v
if (err) {
  // ... handle errors
}
```

#### `pipeSyncTry`
```ts
/**
 * `pipeSyncTry`
 *  where:
 *    <?>
 */
// ...
const inc_toString = pipeSyncTry<[number, number], string>([
  (x) => x + 1
  (n) => n.toString()
]);

const [err, dat] = await inc_toString(0);
// ....^....^
// .
// .
// .
expect(err).toBeUndefined();
expect(dat).toBe("1");
```

#### `ensureError`
```ts
/**
 * `ensureError`
 *  where:
 *    <E extends GeneericError, EName extends string>
 * @param {string} message
 * @param {Jsonable} options
 * @returns {readonly [E, EName]}
 * ! takes either a Jsonable type, turning it into a GenericError, or an error type, passing it along w/ some minor decoration...  !
 */
//
try {
  throw Error("built_in")
} catch (e1: unknown) {
  const [err1, errName1] = ensureError(e1);
  // ....^.....^
  // .
  // ...do something with error &| errorName
} // .
//   .
//   .
//   ...then enjoy the happy path!
//   .
//   .
//   .
//<-...eventually return a happy camper.
try {
  throw "primitive";
} catch (str: unknown) {
  const [err2, errName2] = ensureError(str);
  // ! now we know we're dealing with an error
  // ! (rather than a primitive type), 
  // ! of at least `GenericError`, 
  // ! but possibly `UnresolvableError`, etc.
  // .
  // ... do something with the error
  // .
  // .
  // .
  // ... then enjoy the happy path!
  // .
  // .
  // .
  // v
}
```

### These are some of the advantages of this approach: 
1. **Errors** as ***values***!
2. Improved ergonomics encourages ***actual* handling of errors / thrown exceptions**!
   - Sometimes, maybe even quite often, the *only* error handling is a simple `console.error` of the error... this library's **`[err, dat]`** tuple format discourages simple console logs and <ins>encourages detecting & handling the error</ins>.
   - Also potentially quite often, ***multiple*** potentially throwing functions are lumped into ***one*** `try` block... this library's  provision of separate **`{ syncTry, asyncTry }`** functions discourage lumping multiple throwable functions together and instead <ins>encourage separating throwable functions by error to be handled</ins>.
   - **`{ multiSyncTry, multiAsyncTry, pipeSyncTry, pipeAsyncTry }`** functions are there to handle when you do need to lump multiple throwable functions together, while still keeping them separatable and clean. *(<ins>**`multi__Try(fs: Fs[]): (xs: Xs[]) => readonly [err, dat][Length<Xs> extends number]`**</ins> functions take an array of functions to call and return a function that takes an array of inputs that correspond to the original array of functions input.  <ins>**`pipe__Try(fs: Fs[]): (x: X) => readonly [err, dat]`**</ins> functions take an array of (sync/async) functions to call and return a function that takes a single input to be threaded through the original array of functions, from left-to-right or top-to-bottom, with the result of one `f(x) -> y` being passed to be called by the next function `g(y) -> z`, and so on, until the final `func(_) -> [err, dat]`)*
   - **If the error cannot be handled**, provides a way to crash quickly with a descriptive report... this library's **`{ panic }`** function causes the application to crash, with as much information as you want to give it, including `description: string`, `cause` (the/an error), `fileName?: string`, and `lineNumber: number` in the form **`panic(error, { cause, fileName, lineNumber})`**.
3. **Less nesting** leads to improved code readability FTW!
   - `try`/`catch`/`finally` intrinsically, inexorably leads to nested code; this library helps you <ins>avoid this nesting by abstracting it away</ins>.
   - checking for the error first, like in the **go** language, tends toward simpler code: <ins>less nesting</ins> and <ins>more up-&-down reading</ins>.
4. Optional **handling of `finally` blocks** with a ***function***!
   - Use it if you need it!
   - Don't use it if you don't! 
5. DRY, robust handling of errors!
   - **Solid handling logic** accomplished *for* you, in *one* place, a simple *library*...
   - **Standardized Errors**...
     - that all extend the `GenericError` class that itself extends `Error` properly!
     - that respond to ***`instanceof`***!
     - *with `.statusCode`s* (*both* <ins>static *&* dynamic properties</ins>) corresponding to ***HTTP error status codes*** (Except for `GenericError` & `CustomError`, which have non-HTTP `"000"` ["001"..."099"] statusCodes, for DX ergonomics)! 
   - **CustomError type**...
     - automatically extended from `GenericError`, but with room for customization by *statusCode* & *description*.
     - **also** *with `.statusCode`s* (*& also* with both <ins>static *&* dynamic properties</ins>): in the range **[001, 099]**...
       - Limited to 99 `CustomError` instances, to prevent status code collision with HTTP status codes.
       - You can set the code **explicitly** upon construction.
       - You can let the `CustomError` set it's own code **implicitly** for you, automagically, simply by not specifying it at construction.
       - `CustomError` detects & prevents collisions for each new instance constructed.
       - Prevented from using `.statusCode` of `"000"`, as that is reserved for `GenericError`.
       - throws an `GenericError` (with *description*) if there are more than 99 instances, to <ins>encourage you to use pre-defined Standard Errors</ins>, while <ins>still allowing you the escape hatch of `CustomError`</ins>.
6. **TypeScript**!
   - Built with *types*, exposing Intellisense, and previnting many whoopsies...
   - Exposes *standardized error types* for you to use...
   - Autocomplete...

## Examples:

### Usage of `syncTry`:

### Usage of `asyncTry`:

Given an async function that could throw:

```ts
async function getUser(id: number) {
  await millisToWait(1000);
  if (id === 2) {
    const code = NotFoundError.statusCode;
    const err = new NotFoundError(`${code}: User does not exist`);
    throw new ApplicationError(`${err.statusCode}: Error retrieving user`, {
      cause: err,
      fileName: "some file",
      lineNumber: 47
    });
  }
  return { id, name: "Jo Person" };
}
```
> Example async function that could potential throw an Error:
> (throws if `user.id === 2`)

...

***BEFORE***: using `try`/`catch`:
```ts
let someVariable;
try {
  const user = await getUser(1);
  console.log(user);
  someVariable = user;
} catch (error) {
  console.error(error);
  // and MAYBE:
  handleError(error);
  // and SOMETIMES even:
} finally {
  doSomethingWith(someVariable);
}
```
...

AFTER: with err-dat package function `single:

```ts
import { asyncTry, panic } from 'err-dat';
```

```ts 
const getUserWithHandling = asyncTry(getUser);
const [err, dat] = await getUserWithHandling(1);
if (err) {
  handleIt(err.cause, err.fileName, err.lineNumber);
  return;
} else {
  return doSomethingWith(dat);
}
```
> ^ check for simple, unspecified Error

 If you don't know what argument you'll be passing, you can partially apply the function:
```ts
const getUserOrError = asyncTry(getUser);

const [err, dat] = await getUserOrError(n);
```
or wrap it, if you don't want to partially apply
```ts
async function getErrorOrUser (n) {
  const [err, dat] = await asyncTry(getUser)(n);
  if (err) {
    return [err, undefined] as const;
  } else {
    return [undefined, dat] as const;
  }
}
```

If you're handling a function where you only care if there's an error, e.g., a side-effect:
```ts
const [err] = await asyncTry(postUser)(2);
if (err) {
  handleIt(err.cause, err.fileName, err.lineNumber);
}
return;
```
> ^ if there's really just an error, e.g., a side-effect

Ignoring the error:
```ts
const [_, user1] = await asyncTry(getUser)(1);
doSomethingWith(user1);
```
> ^ if you somehow know there will be no error, or REALLY need an escape hatch

you can specify the types of errors you expect:
```ts
const [e] = await asyncTry(getUser, 
  [
    BadRequestError,
    NotFoundError,
    CustomError,
    UnresolvableError,
  ]
)(2);
if (e) {
  if (e.cause instanceof BadRequestError) {
    return handleBadRequest(e.cause, e.fileName, e.lineNumber);
  }
  if (e.cause instanceof NotFoundError) {
    return handleNotFound(e.cause, e.fileName, e.lineNumber);
  } 
  if (e instanceof UnresolvableError) {
    panic(
      "Something went wrong while trying to get user", 
      {
        value: 2,
        cause: e.cause,
        fileName: e.fileName,
        lineNumber: e.lineNumber
      }
    );
  }
}
```
> ^ If given an array of `GenericError` subclasses, will attempt to 

You can use a 3rd parameter to activate the eqivalent of a `finally` clause (*with a `let` variable to capture the successful value*):
```ts
const [error, user] = await asyncTry(getUser, null, (u?: User) => {
    console.log("Got user 3 or error: now time to clean up!")
    if (u) {
      doSomethingWith(u)
    }
    cleanupResource()
  },
)(2);
if (error) {
  handleIt(error.cause);
  return;
}
return user
```
> ^ with an `onResolved` callback

### Usage of `multiSyncTry`:

### Usage of `multiAsyncTry`:

awaiting multiple async functions that could throw an error:

#### BEFORE, wrapping with `try`/`catch`, with native `Promise` methods:

> In this case, using `Promise.all`,
> each promise is supposed to succeed,
> or else the entire thing fails:
> but what is the error?
```ts
let result;
try {
  const fails_huh = await Promise.all([
    fetchUserHistory(id),
    fetchUserProfile(id),
    Promise.reject(new Error("an error")),
  ]);
} catch (someError: unknown) {
  if (youKnowTheCauseOf(someError)) {
    console.error(someError);
    result = handleItSomehowSomeWay(someError)
  } else {
    // what else can you really do?
    console.error(someError);
    throw someError;
  }

  return result ?? something;
}
```

> in THIS case, we don't know how to destructure `promises`
> since each could be either
`{ status: "fulfilled", value: ... }`,
> or
`{ status: "rejected", reason: ...}`
```ts
try {
  const promises = await Promise.allSettled([
    fetchUserHistory(id),
    fetchUserProfile(id),
    Promise.reject(new Error("an error")),
  ]);
  // custom logic to test if each `promise.status` is `"fulfilled"` or `"rejected"`:
  // .
  // .
  // .
} catch (unknownError) {
  console.error(unknownError);
  // what else can you really know to do?
  throw unknownError;
}
```

#### AFTER: with err-dat package function `multiAsyncTry`:

```ts
import { multiAsyncTry, panic } from 'err-dat';
```

> ...
```ts
const {
  firstSettled,
  allSettled,
} = await multiAsyncTry([
  fetchUserHistory(id),
  fetchUserProfile(id),
  Promise.reject(new Error("an error")),
]);

const [theFirstError, theFirstResult] = await firstSettled;
const [[err1, dat1], [err2, dat2], [err3, dat3]] = await allSettled;
// handle complex logic now...
// .
// .
// .
expect(theFirstError).toBe(err3);
expect(theFirstResult).toBeUndefined();
expect(dat3).toBeUndefined();
```
