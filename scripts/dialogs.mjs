/** Shared framing for every dialog owned by this module. */
export function dialogOptions(title,content,{compendium=false}={}) {
  return {window:{title},position:{width:560,height:'auto'},classes:['wfe-dialog',...(compendium?['wfc-dialog']:[])],rejectClose:false,render:bindChoicePreviews,
    content:`<div class="wfe-dialog-body">${content}</div>`};
}

export function bindChoicePreviews(_event,dialog) {
  const root=dialog.element;
  if(!root)return;
  for(const select of root.querySelectorAll('select[data-wfe-preview-select]')) {
    const update=()=>{
      for(const panel of root.querySelectorAll('[data-wfe-preview-group]')) {
        if(panel.dataset.wfePreviewGroup===select.dataset.wfePreviewSelect)panel.hidden=panel.dataset.wfePreviewId!==select.value;
      }
    };
    select.addEventListener('change',update);update();
  }
}
