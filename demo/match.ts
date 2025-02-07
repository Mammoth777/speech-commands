export function showMatch(isMatch: boolean) {
  if (isMatch) {
    const dom = document.getElementById('matchMsg')!
    dom.classList.add('highlight')
    setTimeout(() => {
      dom.classList.remove('highlight')
    }, 2000);
  }
}