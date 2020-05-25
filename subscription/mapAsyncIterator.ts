import { PromiseOrValue } from '../jsutils/PromiseOrValue.ts';

/**
 * Given an AsyncIterable and a callback function, return an AsyncIterator
 * which produces values mapped via calling the callback function.
 */
export default function mapAsyncIterator<T, U>(
  iterable: AsyncIterable<T>,
  callback: (arg: T) => PromiseOrValue<U>,
  rejectCallback?: (arg: any) => PromiseOrValue<U>
): AsyncGenerator<U, void, void> {
  const iteratorMethod = iterable[Symbol.asyncIterator];
  const iterator: any = iteratorMethod.call(iterable);
  let $return: any;
  let abruptClose: (error: any) => any;
  if (typeof iterator.return === 'function') {
    $return = iterator.return;
    abruptClose = (error) => {
      const rethrow = () => Promise.reject(error);
      return $return.call(iterator).then(rethrow, rethrow);
    };
  }

  function mapResult(result: any) {
    return result.done
      ? result
      : asyncMapValue(result.value, callback).then(iteratorResult, abruptClose);
  }

  let mapReject: any;
  if (rejectCallback) {
    // Capture rejectCallback to ensure it cannot be null.
    const reject = rejectCallback;
    mapReject = (error: any) =>
      asyncMapValue(error, reject).then(iteratorResult, abruptClose);
  }

  /* TODO: Flow doesn't support symbols as keys:
     https://github.com/facebook/flow/issues/3258 */
  return ({
    next() {
      return iterator.next().then(mapResult, mapReject);
    },
    return() {
      return $return
        ? $return.call(iterator).then(mapResult, mapReject)
        : Promise.resolve({ value: undefined, done: true });
    },
    throw(error) {
      if (typeof iterator.throw === 'function') {
        return iterator.throw(error).then(mapResult, mapReject);
      }
      return Promise.reject(error).catch(abruptClose);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  });
}

function asyncMapValue<T, U>(
  value: T,
  callback: (arg: T) => PromiseOrValue<U>,
): Promise<U> {
  return new Promise((resolve) => resolve(callback(value)));
}

function iteratorResult<T>(value: T): IteratorResult<T, void> {
  return { value, done: false };
}
