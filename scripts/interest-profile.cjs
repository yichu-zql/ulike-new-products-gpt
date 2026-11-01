function summarize(data){
 const picked=data.items.filter(i=>i.picked);
 const counts=key=>Object.fromEntries(Object.entries(picked.reduce((r,i)=>{for(const v of (Array.isArray(i[key])?i[key]:[i[key]]).filter(Boolean))r[v]=(r[v]||0)+1;return r;},{})).sort((a,b)=>b[1]-a[1]));
 return {mode:'learn-only',sampleSize:picked.length,ids:picked.map(i=>i.id),directions:counts('direction'),categories:counts('category'),technologies:counts('tech'),productTypes:counts('type'),brands:counts('brands'),instruction:'只用于学习偏好和调整排序；不得据此回查、改动意向品或收缩品类方向。频数是已有样本特征，不是用户明确偏好强度。'};
}
module.exports={summarize};
if(require.main===module)console.log(JSON.stringify(summarize(require('../data/products.json')),null,2));
