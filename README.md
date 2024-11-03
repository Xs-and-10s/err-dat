# **err-dat**

Exports functions { `single`, `multi` } that provide errors as values, which conform to an **`[err, dat]` tuple** format when returning from functions that could throw Errors.


### These are some of the advantages of this approach (*Warning: there may be more advantages!*): 
1. **Errors** as ***values***!
2. Improved ergonomics encourages ***actual* handling of errors / thrown exceptions**!
   - Quite often, the *only* error handling is a simple `console.error` of the error... this library's `[err, dat]` tuple format (*+ destructuring*) <ins>discourages simple console logs</ins> and <ins>encourages detecting & handling the error</ins>.
   - Quite often, *multiple* potentially throwing functions are lumped into *one* `try` block... this library's `{ single, multi }` functions <ins>discourage lumping multiple throwable functions together</ins> and <ins>encourage separating throwable functions by error to be handled</ins>.
   - If the error cannot be handled, provides a way to crash quickly with a descriptive report... this library's `{ panic }` function causes the application to crash, with as much information as you want to give it, including `description: string`, `cause` (the/an error), `fileName?: string`, and `lineNumber: number` in the form `panic(error, { cause, fileName, lineNumber}).
3. **Less nesting** leads to improved code readability FTW!
   - `try`/`catch`/`finally` intrinsically, inexorably leads to nested code; this library helps you <ins>avoid this nesting by abstracting it away</ins>.
   - checking for the error first, like in the **go** language, tends toward simpler code: <ins>less nesting</ins> and <ins>more up-&-down reading</ins>.
4. Optional **handling of `finally` blocks** with a ***function***!
   - Use it if you need it!
   - Don't use it if you don't! 
5. DRY, robust handling of errors!
   - **Solid handling logic** accomplished *for* you, in *one* place, a simple *library*...
   - **Standardized Errors**...
     - that all extend the `ApplicationError` class that itself extends `Error` properly!
     - that respond to ***`instanceof`***!
     - *with `.statusCode`s* (*both* <ins>static *&* dynamic properties</ins>) corresponding to ***HTTP error status codes*** (Except for `ApplicationError` & `CustomError`, which have non-HTTP [000-099] statusCodes, for DX ergonomics)! 
   - **CustomError type**...
     - automatically extended from `ApplicationError`, but with room for customization by *statusCode* & *description*.
     - **also** *with `.statusCode`s* (*& also* with both <ins>static *&* dynamic properties</ins>): in the range **[001, 099]**...
       - Limited to 99 `CustomError` instances, to prevent status code collision with HTTP status codes.
       - You can set the code **explicitly** upon construction.
       - You can let the `CustomError` set it's own code **implicitly** for you, automagically, simply by not specifying it at construction.
       - `CustomError` detects & prevents collisions for each new instance constructed.
       - Prevented from using `.statusCode` of `"000"`, as that is reserved for `ApplicationError`.
       - throws an `ApplicationError` (with *description*) if there are more than 99 instances, to <ins>encourage you to use pre-defined Standard Errors</ins>, while <ins>still allowing you the escape hatch of `CustomError`</ins>.
6. **TypeScript**!
   - Built with *types*, exposing Intellisense, and previnting many whoopsies...
   - Exposes *standardized error types* for you to use...
   - Autocomplete...

## Examples:

### Usage of `single`:

> Example async function that could potential throw an Error:
> (throws if `user.id === 2`)
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

> BEFORE: using `try`/`catch`:
```ts
try {
  const user = await getUser(1);
  console.log(user);
} catch (error) {
  console.error(error);
  // and MAYBE:
  handleError(error)
}
```
> AFTER: with err-dat package function `single:

```ts
import { single, panic } from 'err-dat';
```

> check for simple, unspecified Error:
```ts 
const [err, dat] = await single(getUser(1));
if (err) {
  handleIt(err.cause, err.fileName, err.lineNumber);
} else {
  doSomethingWith(dat);
}
```

> if you don't know what argument you'll be passing:
```ts
async function getErrorOrUser (n) {
  const [err, dat] = await single(getUser(n));
  if (err) {
    return [err, undefined] as const;
  } else {
    return [undefined, dat] as const;
  }
}
```

> handling a function where you only care if there's an error, e.g., a side-effect:
```ts
const [err] = await single(getUser(2));
if (err) {
  handleIt(err.cause, err.fileName, err.lineNumber);
}
```

> if you somehow know there will be no error, or REALLY don't care:
```ts
const [_, user1] = await single(getUser(1));
doSomethingWith(user1);
```

> you can specify the types of errors you expect:
```ts
const [e] = await single(getUser(2), [
  BadRequestError,
  NotFoundError,
  CustomError,
  UnknownError,
]);
if (e) {
  if (e.cause instanceof BadRequestError) {
    return handleBadRequest(e.cause, e.fileName, e.lineNumber);
  }
  if (e.cause instanceof NotFoundError) {
    return handleNotFound(e.cause, e.fileName, e.lineNumber);
  } 
  if (e.cause instanceof UnknownError) {
    panic(
      new ApplicationError(`Something went wrong while trying to get user ${2}`), 
      {cause: e.cause, fileName: e.fileName, lineNumber: e.lineNumber}
    );
  }
}
```

> you can use a 3rd parameter to activate a `finally` clause:
```ts
const [error, user] = await single(getUser(2), null, () =>
  console.log("Got user 3 or unspecified error: now time to clean up!"),
);
if (error) {
  return handleIt(error.cause);
}
return user
```

### Usage of `multi`:

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

#### AFTER: with err-dat package function `multi`:

```ts
import { multi, panic } from 'err-dat';
```

> ...
```ts
const {
  firstSettled,
  allSettled,
} = await multi([
  fetchUserHistory(id),
  fetchUserProfile(id),
  Promise.reject(new Error("an error")),
]);

const [theFirstError, theFirstResult] = await firstSettled;
const [[_err1, dat1], [_err2, dat2], [err3, _dat3]] = await allSettled;
// handle complex logic now...
```
