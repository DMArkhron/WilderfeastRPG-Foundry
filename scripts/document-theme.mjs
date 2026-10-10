/** Style native editors without replacing their submission or text-editor handlers. */
export function themeDocumentSheet(app,html) {
  if(game.system.id!=='wilderfeast')return;
  const doc=app.document??app.item??app.object;
  if(!['Item','JournalEntry','JournalEntryPage'].includes(doc?.documentName))return;
  const candidate=html?.[0]??html;
  const root=candidate?.classList?candidate:app.element?.[0]??app.element;
  if(!root?.classList)return;
  root.classList.add('wfe-document-sheet');
  if(!app._wfeDocumentSized && app.setPosition) {
    app._wfeDocumentSized=true;
    app.setPosition({width:Math.min(Math.max(Number(app.position?.width)||0,660),Math.max(280,(globalThis.innerWidth??1000)-40)),height:Math.min(Math.max(Number(app.position?.height)||0,760),Math.max(260,(globalThis.innerHeight??900)-60))});
  }
}
for(const name of ['renderItemSheet','renderJournalSheet','renderJournalEntrySheet','renderJournalPageSheet','renderJournalEntryPageSheet','renderApplication','renderApplicationV2'])Hooks.on(name,themeDocumentSheet);
