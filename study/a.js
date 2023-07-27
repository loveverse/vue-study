// const a = [3, 2, 4];
// // 第一个和第二个比
// for (let i = 0; i < a.length - 1; i++) {
//   for (let j = i; j < a.length - i - 1; j--) {
//     if (a[i] > a[j + 1]) {
//       [a[i], a[i + 1]] = [a[j + 1], a[j]];
//     }
//   }
// }
// console.log(a);

// function b(arr){
//   if(arr)
//   let num = arr / 2

// }

function makeMap(str, expectsLowerCase) {
  // 创建一个没有原型的空对象
  const map = Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => map[val.toLowerCase()] : (val) => map[val];
}
const a = makeMap("slot,component", true);
console.log("[ a ] >", a('slot'));
// Object.prototype.hasOwnProperty