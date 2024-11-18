# **err-dat**

## Summary

Exports functions { ***`syncTry`***, ***`asyncTry`***, ***`multiSyncTry`***, ***`multiAsyncTry`***, ***`pipeSyncTry`***, ***`pipeAsyncTry`*** } that **catch thrown errors** and provides them **as values**, which conform to an **`[err, dat]` tuple** format when returning from their wrapped functions, in a pattern corresponding to the proposal: ["Safe Assignment Operator"](https://github.com/arthurfiorette/proposal-safe-assignment-operator) **`?=`** *(<ins>which perhaps should be</ins> **`!?=`** <ins>instead...</ins>)*

Also provides { ***`panic`***, ***`ensureError`*** } helper functions that help ease and enforce robust error handling!  <ins>**`ensureError`**</ins> allows you to take thrown non-error values or built-in `Error`s from existing catch blocks, or third party functions that throw things, and wrap them into a standardized error (returning `GenericError` or `UnresolvableError`): so that you know what you're getting and it always has a context (which built-in `Error`s do not have; along with `.cause`, `.context` help debugging more easily and quickly).  There is also the `cause` property *(which the built-in `Error` actually has in most environments now)* that allows you to build up your stack trace.  <ins>**`panic`**</ins> is for when you find an `UnresolvableError` & cannot recover, so your program is in an indeterminate state and should abort, failing fast (*extremely helpful in dev/debug mode*).  `panic` takes the error as input and makes clear that you are doing so, and allows you to tack on context if desired: things like the code `owners: string[]` (*that points you to the* ( potential ) *developer(s) that work on the particular code / know it the best*), the `fileName` to look at, even the `lineNumber` to help pinpoint either the exact line or at least the beginning of the rough area, and then whatever else values (*including `value`*) you think is relevant to help debug!

Finally, as mentioned above, the library provides a set of custom Errors: { **`GenericError`** } that *`extends Error`* & adds *`this.context`*, as well as errors { `UnresolvableError`, `BadRequestError`, `NotFoundError`, `...` } that also *`extends GenericError`*, where **`UnresolvableError`** indicates that the state of the program is such that it should abort, usually (*if not always*) via `panic`!  These <ins>custom errors conform to a superset of the HTTP statusCode spec</ins>, with the addition of `"0xx"` errors reserved for `GenericError` and `CustomError`s, and `"600"` being reserved for `UnresolvableError`.

### Quick examples:
```ts
import { 
  // errors...
  BadRequestError,
  GenericError,
  NotFoundError,
  UnresolvableError,
  // functions...
  asyncTry,
  ensureError,
  multiAsyncTry,
  multiSyncTry,
  panic,
  pipeAsyncTry,
  pipeSyncTry,
  syncTry,
} from "err-dat";
```

#### `asyncTry`
```ts
/**
 * `asyncTry`
 *  where: 
 *    <B extends any, As extends any[]>
 * @param {(...args: As) => Promise<B>} asyncFnToTry
 * @param {(E[] | null) | undefined} errorsToCatch
 * @param {((B) => void) | undefined} onDone
 */
const tryGetUser = asyncTry<User, [number]>(getUser/* , 
  [
    BadRequestError,
    NotFoundError,
    CustomError,
    UnresolvableError,
  ] */
);

const [err, dat] = await tryGetUser(2, 
  [
    BadRequestError,
    NotFoundError,
    CustomError,
    UnresolvableError,
  ]
);
// first check if there's an error, and if so, handle it appropriately!
if (err) {
  if (err instanceof UnresolvableError) {
    const message = err.message ?? "Something went wrong while trying to get user";
    panic(
      message, 
      {
        value: 2,
        functionName: "tryGetUser",
        owners: ["Xs-and-10s"],
        fileName: "@/src/dir/file.ts",
        lineNumber: 42,
      }
    );
  }
  if (err instanceof NotFoundError) {
    handleNotFound(err);
    // ...recover?...
  }
  if (err instanceof BadRequestError) {
    handleBadRequest(err);
    // ...recover?...
  }
  if (err instanceof GenericError) {
    handleGeneric(err);
    // ...recover?...
  }
}
// ...get to the happy-path logic!
// .
// .
// .
// v
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

const msg: string = "there was an error!";
const throwThat = (msg: string) => {
  throw new GenericError(msg);
}
const captureThrownErrorWith = syncTry<string>(throwThat, 
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
      functionName: "captureThrownErrorWith",
      value: msg,
      info: {
        // ...helpfulHints
      }
    });
  }
  if (err instanceof NotFoundError) {
    handleNotFound(err);
    // ...recover?...
  }
  if (err instanceof BadRequestError) {
    handleBadRequest(err);
    // ...recover?...
  }
  if (err instanceof GenericError) {
    handleGeneric(err);
    // ...recover?...
  }
  // ... now we're on the happy path!
  // .
  // .
  // .
  // v
}
```
```ts
// ! `syncTry` can also handle recursive functions (both tail & non-tail):
const total = 5050;
const range = [1, 100] as const;

/**
 * tail-call recursion: summing up the numbers from 1 to 100
 */
const sumRange = ([a, z]: readonly [a: number, z: number], y = 0) => {
  // Base case: when we've processed all pairs
  if (a > z) return y;
  // Edge case: If we have a single number left, add it to accumulator `y`
  if (a === z) return y + a;
  // Add current pair and continue with next pair
  return sumRange([a + 1, z - 1] as const, y + a + z);
};

const trySumRange = syncTry<[[number, number], number]>(sumRange);

const [err, dat] = trySumRange<number, [GenericError]>(range, 0);
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
 * ! `multiAsyncTry`
 * 
 * @typedef {Object} MultiSettled
 * @property {P[]} allSettled
 * @property {P} firstSettled
 * 
 * @params {((...args: As) => B)[]} asyncFns
 * @params {E[] | null} errorsToCatch
 * @params {(B => void)} afterFirstSettled
 * @params {(B => void)[]} afterAllSettled
 * @returns {(Promise<A>) => B}
 * @returns {MultiSettled} {firstSettled, allSettled}
 * `allSettled` is fully populated when all the promises have settled, while `firstSettled` is the first promise to settle... where each promise for both is converted into an `[err, dat]` format.
 */
//
const [fetchUserServices, exception] = multiAsyncTry<[string, string, any],[UserHistory, UserProfile, never]>([
  fetchUserHistory,
  fetchUserProfile,
  Promise.reject,
],
(first: B) => {
  console.log("The first promise settled. You can now do something with this callback.");
},
(all: (B | undefined)[]) => {
  console.log"All the promises have settled.  You can now do something with this callback."
});

if (exception) {
  panic(exception.message, exception.context);
}

const {
  firstSettled,
  allSettled,
} = await fetchUserServices([id, id, new GenericError("an error")]);

const [theFirstError, theFirstResult] = await firstSettled;
// ....^..............^
// ... handle/log/etc if needed for the first results...
// .
// .
// .
const [[err1, dat1], [err2, dat2], [err3, dat3]] = await allSettled;
// .....^.....^.......^.....^.......^.....^
// ...handle/log/etc if needed for all the results...
// .
// .
// .
expect(theFirstError).toBe(err3);
expect(theFirstResult).toBeUndefined();
expect(theFirstResult).toBe(dat3);
```

#### `multiSyncTry`
```ts
/**
 * `multiSyncTry`
 *    where:
 *      <?>
 * @params {}
 */
//
const [parsePair, exception] = multiSyncTry<[string, string]>([
  (a) => JSON.parse(a),
  JSON.parse
]);

if (exception) {
  panic(exception.message, exception.context);
}

const { finished } = parsePair<[string, string], [Jsonable, Jsonable]>("null", '{"x":}');

const [[err1, dat1], [err2, dat2]] = finished;
// .....^.....^.......^.....^
// .
// .
// .
expect(err1).toBeUndefined();
expect(dat1).toBe(null);
expect(err2).toBeInstanceOf(GenericError)
expect(dat2).toBeUndefined();
// .
// .
// .
// v
```

#### `pipeAsyncTry`
```ts
/**
 * `pipeAsyncTry`
 *  where:
 *    <?>
 */
// ...
const fetchUserInfo = pipeAsyncTry<[number, number], UserInfo>([
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
const inc_etc = pipeSyncTry<[number, number, string], number>([
  (x) => x + 1
  (n) => n.toString()
  JSON.parse
]);

const [err, dat] = await inc_etc(0);
// ....^....^
// .
// .
// .
expect(err).toBeUndefined();
expect(dat).toBe(1);
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
  const [err, errName] = ensureError(e1);
  // ....^.....^
  // .
  // ...do something with error &| errorName
  expect(errName).toBe("Error")
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
  const [err, errName] = ensureError(str);
  // ! now we know we're dealing with an error
  // ! (rather than a primitive type), 
  // ! of at least `GenericError`, 
  // ! but possibly `UnresolvableError`, etc.
  // .
  // ... do something with the error
  expect(errName).toBe("GenericError");
  expect(err).toBeInstanceOf(GenericError);
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

## Why this library?

### These are some of the advantages of this approach: 
1. **Errors** as <ins>***values***!</ins>
   - Similar to golang, it's easier to reason about errors and handling them if they are values, rather than thrown unchecked or checked exceptions.
   - Very similar to the ["Safe Assignment Operator"](https://github.com/arthurfiorette/proposal-safe-assignment-operator) proposal, where a tuple of `[error, data]` is returned from an async function via `?=`... e.g., `[err, dat] ?= await fetch(...)`
2. Improved ergonomics encourages ***actual* handling of errors / thrown exceptions**!
   - Sometimes, maybe even quite often, the *only* error handling is a simple `console.error` of the error... this library's **`[err, dat]`** tuple format discourages simple console logs and <ins>encourages detecting & handling the error</ins>.
   - Also potentially quite often, ***multiple*** potentially throwing functions are lumped into ***one*** `try` block... this library's  provision of separate **`{ syncTry, asyncTry }`** functions discourage lumping multiple throwable functions together and instead <ins>encourage separating throwable functions by error to be handled</ins>.
   - **`{ multiSyncTry, multiAsyncTry, pipeSyncTry, pipeAsyncTry }`** functions are there to handle when you do need to lump multiple throwable functions together, while still keeping them separatable and clean. *(<ins>**`multi__Try(fs: Fs[]): (xs: Xs[]) => readonly [err, dat][Length<Xs> extends number]`**</ins> functions take an array of functions to call and return a function that takes an array of inputs that correspond to the original array of functions input.  <ins>**`pipe__Try(fs: Fs[]): (x: X) => readonly [err, dat]`**</ins> functions take an array of (sync/async) functions to call and return a function that takes a single input to be threaded through the original array of functions, from left-to-right or top-to-bottom, with the result of one `f(x) -> y` being passed to be called by the next function `g(y) -> z`, and so on, until the final `func(_) -> [err, dat]`)*
   - **If something is thrown, but it's a primitive value, a non-error, or even a built-in Error** (without `.context`), you can wrap it with **`ensureError`** to make sure that the result is at least a `GenericError`, or a subclass like `UnresolvableError`.  Use this function to handle libraries that throw errors, or in the top of `catch` blocks in the portions of your codebase that still use `try`/`catch`.  By using the function this way, you can always be sure you are dealing with specialized errors that have `.context` and `.statusCode` properties.
   - **If the error cannot be handled**, provides a way to crash quickly with a descriptive report... this library's **`{ panic }`** function causes the application to crash, with as much information as you want to give it, including `description: string`, `cause` (the/an error), `fileName?: string`, and `lineNumber: number` in the form **`panic(error, { cause, fileName, lineNumber})`**.
3. **Fewer & less nestings** leads to improved code readability FTW!
   - `try`/`catch`/`finally` intrinsically, inexorably leads to nested code; this library helps you <ins>avoid this nesting by abstracting it away</ins>.
   - checking for the error as a first step, like in the **go** language, tends toward simpler code: less nesting and <ins>***more up-&-down reading***</ins>.
4. Optional **handling of `finally` blocks** with a ***function***!
   - Use it if you need it!
   - Don't use it if you don't! 
5. DRY, robust handling of errors!
   - **Solid handling logic** accomplished *for* you, in *one* place, a simple *library*...
   - **Standardized Errors**...
     - that all extend the `GenericError` class that itself extends `Error` properly!
     - that respond to ***`instanceof`***!
     - *with `.statusCode`s* (*both* <ins>static *&* dynamic properties</ins>) corresponding to ***HTTP error status codes*** (Except for `GenericError` & `CustomError`, which have non-HTTP `"000"` (`GenericError`) or ["001"..."099"] (`CustomError`s) `.statusCodes`, as well as `UnresolvableError` (which has a `.statusCode` of `"600"`) for DX ergonomics)! 
   - **CustomError type**...
     - automatically extended from `GenericError`, but with room for customization by *statusCode* & *description*, per CustomError instance.  Custom error instances are meant to be instantiated once, then reused, though they *can* be reused by instantiating it with the same information (although this is discouraged, as it's easy to be off by just one character, for example).
     - **also** *with `.statusCode`s* (*& also* with both <ins>static *&* dynamic properties</ins>): in the range **[001, 099]**...
       - Application limited to 99 `CustomError` instances, to prevent status code collision with HTTP status codes.
       - You can set the `.statusCode` **explicitly** upon construction.
       - You can let the `CustomError` set it's own `.statusCode` **implicitly** for you, automagically, simply by not specifying it at construction.
       - `CustomError` detects & prevents collisions for each new instance constructed.
       - Prevented from using `.statusCode` of `"000"`, as that is reserved for `GenericError`.
       - throws an `GenericError` (with *description*) if there are more than 99 instances, to <ins>encourage you to use pre-defined Standard Errors</ins>, while still allowing you the escape hatch of `CustomError`.
6. **TypeScript**!
   - Built with *types*, exposing Intellisense, and helping to prevint many faults/errors...
   - Exposes *standardized error types* for you to use!
   - Autocomplete!

## Examples:

### Usage of `syncTry`:

### Usage of `asyncTry`:

Given an async function that could throw:
```ts
async function getUser(id: number) {
  await millisToWait(1000);
  if (id === 2) {
    const code = NotFoundError.statusCode;
    throw new NotFoundError(`${err.statusCode}: Error retrieving user`, {
      cause: new GenericError(`${code}: User does not exist`),
      context: {
        owners: ["Someone-else"],
        fileName: "some file",
        lineNumber: 47
      }
    });
  }
  return { id, name: "Jo Person" };
}
```
> ^ Example async function that could potential throw an Error:
> (throws if `user.id === 2`)

...

***BEFORE***: using `try`/`catch`:
```ts
let theUser;
try {
  const user = await getUser(1);
  console.log(user);
  theUser = user;
} catch (error: unknown) {
  console.error(error);
  // and MAYBE:
  handleError(error);
  // and SOMETIMES even:
} finally {
  doSomethingWith(theUser);
}
```
...

AFTER: with err-dat package functions:
```ts
import { asyncTry, panic } from 'err-dat';
```

```ts 
const tryGetUser = asyncTry(getUser);
const [err, dat] = await tryGetUser(1);
if (err) {
  handleIt(err);
  // ...recover?...
}
```
> ^ check for simple, unspecified Error

 If you don't know what argument you'll be passing, you can partially apply the function:
```ts
const tryGetUser = asyncTry(getUser);

const [err, dat] = await tryGetUser(n);
```
or wrap it, if you don't feel comforable with tacit composition:
```ts
const [err, dat] = await (async function tryGetUser (n) {
  const [err, dat] = await asyncTry(getUser)(n);
  if (err) {
    return [err, undefined] as const;
  } else {
    return [undefined, dat] as const;
  }
}(3))
```

If you're handling a function where you only care if there's an error, e.g., a side-effect:
```ts
const [err] = await asyncTry(postUser)(2);
if (err) {
  handleIt(err);
}
// ...
```
> ^ if there's truly just an error, e.g., a side-effect

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
  if (e instanceof UnresolvableError) {
    panic(
      "Something went wrong while trying to get user", 
      {
        functionName: "tryGetUser"
        value: 2,
        cause: e.cause,
        fileName: e.fileName,
        lineNumber: e.lineNumber
      }
    );
  }
  if (e instanceof BadRequestError) {
    return handleBadRequest(e);
  }
  if (e instanceof NotFoundError) {
    return handleNotFound(e);
  } 
}
```
> ^ If given an array of `GenericError` subclasses, will attempt to 

You can use a 3rd parameter to activate the eqivalent of a `finally` clause (*with successful value as input*):
```ts
const [error, user] = await asyncTry(getUser, null, (u?: User) => {
    console.log("Got user 2 or error: now time to clean up!")
    if (u) {
      doSomethingWith(u)
    }
    cleanupResource()
  },
)(2); // <- try to get user 2... will give error, but will cleanup first!
if (error) {
  handleIt(error);
}
// ...
```
> ^ with an `onResolved` callback, in this case it will cleanup some resource, since it is an error, & there will be no successful value!

### Usage of `multiSyncTry`:
...TODO...

### Usage of `multiAsyncTry`:

awaiting multiple async functions that could throw an error:

#### BEFORE, wrapping with `try`/`catch`, with native `Promise` methods:

> In this case, using **`Promise.all`**,
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

> Using **`Promise.allSettled`**, we don't have a straightforward way to destructure awaited `promises`
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
  // ... custom logic to test if each `promise.status` is `"fulfilled"` or `"rejected"`:
  // .
  // .
  // .
  // v
} catch (error: unknown) {
  console.error(error);
  // reimplement err-dat?
  throw error;
}
```

#### AFTER: with err-dat package function `multiAsyncTry`:

```ts
import { multiAsyncTry, panic } from 'err-dat';
```

> ...
```ts
// const {
//   firstSettled,
//   allSettled,
// } = await multiAsyncTry([
//   fetchUserHistory(id),
//   fetchUserProfile(id),
//   Promise.reject(new Error("an error")),
// ]);
```
```ts
const [exceptionAtSetup, tryFetchUserInfo] = multiAsyncTry<[string, string, string]>([
  fetchUserHistory,
  fetchUserProfile,
  Promise.reject
]);
if (exceptionAtSetup) {
  panic(exceptionAtSetup.message, exceptionAtSetup);
}

const { 
  exception, 
  failed, 
  firstSettled, 
  allSettled 
} = tryFetchUserInfo([
  id,
  id,
  "network failure",
], [
  [BadRequestError, NotFoundError],
  [BadRequestError, NotFoundError],
  [BadRequestError, NotFoundError]
]);
if (failed) {
  panic(exception.message, exception)
}

const [theFirstError, theFirstResult] = await firstSettled;
const [[err1, dat1], [err2, dat2], [err3, dat3]] = await allSettled;
// ... handle complex logic now...
// .
// .
// .
expect(theFirstError).toBe(err3);
expect(theFirstResult).toBeUndefined();
expect(dat3).toBeUndefined();
```
