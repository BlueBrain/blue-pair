
function eachAsync(
  array,
  iterateeFunc,
  filterPredicate = () => true,
  timeout = 0,
) {
  let i = 0;
  const arrayLength = array.length;
  const runIteration = () => {
    iterateeFunc(array[i], i);

    i += 1;
    while (i < arrayLength && !filterPredicate(array[i])) i += 1;

    if (i < arrayLength) setTimeout(runIteration, timeout);
  };

  runIteration();
}

export default eachAsync;
