import { expect, suite, test } from "vitest";
import { tryTo } from "./try-to.js";

suite("tryTo", async () => {
  const add = (a: number, b: number) => a + b;
  const addPromised = async (a: number, b: number) => a + b;
  const parse = JSON.parse;
  const parsePromised = async (maybeJSON: string) => JSON.parse(maybeJSON);

  test("1) sync thunk to sync function acts as expected", () => {
    const [err, dat] = tryTo(() => add(2, 2));

    expect(err).toBeUndefined();
    expect(dat).toBe(4);
  });
  test("2) async thunk to sync function acts as expected", async () => {
    const [err, dat] = await tryTo(async () => add(2, 2));

    expect(err).toBeUndefined();
    expect(dat).toBe(4);
  });
  test("3) sync thunk to async function acts as expected", async () => {
    const [err, dat] = await tryTo(() => addPromised(2, 2));

    expect(err).toBeUndefined();
    expect(dat).toBe(4);
  });
  test("4) async thunk to async function acts as expected", async () => {
    const [err, dat] = await tryTo(async () => addPromised(2, 2));

    expect(err).toBeUndefined();
    expect(dat).toBe(4);
  });
  test("5) async thunk to awaited function acts as expected", async () => {
    const [err, dat] = await tryTo(async () => await addPromised(2, 2));

    expect(err).toBeUndefined();
    expect(dat).toBe(4);
  });
  test("6) sync thunk to sync JSON.parse throws/catches as expected", () => {
    const invalidJSON = "{a:5050";

    const [err, dat] = tryTo(() => parse(invalidJSON));

    expect(err).toBeInstanceOf(Error);
    expect(dat).toBeUndefined();
  });
  test("7) async thunk to sync JSON.parse throws/catches as expected", async () => {
    const invalidJSON = "{a:5050";

    const [err, dat] = await tryTo(async () => parse(invalidJSON));

    expect(err).toBeInstanceOf(Error);
    expect(dat).toBeUndefined();
  });
  test("8) sync thunk to async JSON.parse throws/catches as expected", async () => {
    const invalidJSON = "{a:5050";

    const [err, dat] = await tryTo(() => parsePromised(invalidJSON));

    expect(err).toBeInstanceOf(Error);
    expect(dat).toBeUndefined();
  });
  test("9) async thunk to async JSON.parse throws/catches as expected", async () => {
    const invalidJSON = "{a:5050";

    const [err, dat] = await tryTo(async () => parsePromised(invalidJSON));

    expect(err).toBeInstanceOf(Error);
    expect(dat).toBeUndefined();
  });
  test("10) async thunk to awaited JSON.parse throws/catches as expected", async () => {
    const invalidJSON = "{a:5050";

    const [err, dat] = await tryTo(
      async () => await parsePromised(invalidJSON),
    );

    expect(err).toBeInstanceOf(Error);
    expect(dat).toBeUndefined();
  });
});
