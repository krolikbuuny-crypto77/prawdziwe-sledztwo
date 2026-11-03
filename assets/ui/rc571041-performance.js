/* RC57.10.41: offscreen images only. No changes to evidence availability or dialogue. */
(function(){'use strict';
function optimizeImages(){
 document.querySelectorAll('#evidence img,#labs img,#notebook img,#deduction img,#final img,#photoGrid img').forEach(function(im){
  if(!im.hasAttribute('loading'))im.loading='lazy';
  if(!im.hasAttribute('decoding'))im.decoding='async';
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',optimizeImages,{once:true});else optimizeImages();
})();
