import Em from 'ember';
// /* global moment */

function fileSizeSI(a,b,c,d,e){
    b=Math;
    c=b.log;
    d=1e3;
    e=c(a)/c(d)|0;
    return (a/b.pow(d,e)).toFixed(2) + ' '+(e?'kMGTPEZY'[--e]+'B':'Bytes');
}

export default Em.Helper.helper(function(sz) {
    return fileSizeSI(sz);
});
