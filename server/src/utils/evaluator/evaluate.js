export const evaluateJS = (code, task) => {
try{
const fn = new Function(code + `; return ${task.functionName};`)();
let score = 0;
task.testCases.forEach(tc=>{
if(fn(...tc.input) === tc.output) score += 100/task.testCases.length;
});
return { score, status: score>=70?"approved":"rejected" };
}catch{
return { score:0, status:"rejected" };
}
};