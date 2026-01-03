function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i = i + 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

function getTwoLargestFactors(num) {
    if (isPrime(num) || num <= 1) {
        return null;
    }

    for (let i = Math.floor(Math.sqrt(num)); i >= 1; i--) {
        if (num % i === 0) {
            return [num / i, i];
        }
    }
    return null;
}
