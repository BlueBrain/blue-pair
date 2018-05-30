
function eachAsync(
  array,
  iterateeFunc,
  filterPredicate = () => true,
  timeout = 0,
) {
  let i = 0;
  let index = 0;
  const chunkSize = 4;
  const arrayLength = array.length;
  const runIteration = () => {
    iterateeFunc(array[i], i);

    i += 1;
    while (i < arrayLength && !filterPredicate(array[i])) i += 1;

    if (i >= arrayLength) return;
    index += 1;
    if (index % chunkSize) {
      runIteration();
    } else {
      setTimeout(runIteration, timeout);
    }
  };

  runIteration();
}

export default eachAsync;
