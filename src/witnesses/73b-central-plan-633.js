/* 6.33: one plan for browser request construction and offline scope routing. */
(function(){'use strict';
 const old=window.PS611_NLU;
 if(!old||!window.PS633_INTENT)throw Error('Unified question interpreter missing');
 window.PS611_NLU=Object.freeze({...old,analyze:window.PS633_INTENT.legacyQuestionPlan,version:'6.33'});
 window.PS613_NLU=window.PS611_NLU;
})();
