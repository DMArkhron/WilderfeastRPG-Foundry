/** Visual regression checks for the rendered previews, not a Foundry runtime. */
import fs from "node:fs/promises";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const require=createRequire(import.meta.url),root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const {chromium}=require(require.resolve("playwright",{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES??root,root]}));
let launch={headless:true};
if(process.env.WFE_CHROMIUM_PACKAGE) {
  const packed=require(process.env.WFE_CHROMIUM_PACKAGE);launch={...launch,executablePath:await packed.executablePath(),args:packed.args};
} else if(process.env.WFE_CHROME_PATH)launch={...launch,executablePath:process.env.WFE_CHROME_PATH,args:["--no-sandbox"]};
const browser=await chromium.launch(launch),results=[],base=path.join(root,"preview");
try {
  for(const type of ["feral","monster"]) {
    const page=await browser.newPage({viewport:{width:1100,height:1160},deviceScaleFactor:1});let errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(`file://${base}/${type}.html`);await page.screenshot({path:`${base}/${type}.png`});
    await page.locator("main.window-app").screenshot({path:`${base}/${type}-sheet.png`});
    for(const tab of ["mechanics","conditions","identity","notes"]) {
      await page.locator(`[data-tab="${tab}"]`).first().click();
      const info=await page.evaluate(()=>({horizontalOverflow:[...document.querySelectorAll(".wfe-panel,.wfe-header,.wfe-tabs")].filter(el=>el.offsetParent&&el.scrollWidth>el.clientWidth+2).map(el=>el.className),activeTabs:document.querySelectorAll(".wfe-body>.tab.active").length,missingImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
      assert.deepEqual(info.horizontalOverflow,[]);assert.equal(info.activeTabs,1);assert.equal(info.missingImages,0);assert.deepEqual(errors,[]);
      results.push({type,tab,width:1100,...info,errors});
      if(tab==="identity"||tab==="conditions")await page.screenshot({path:`${base}/${type}-${tab}.png`});
    }
    await page.close();
  }
  {
    const page=await browser.newPage({viewport:{width:1100,height:1160}});await page.goto(`file://${base}/feral.html`);
    const pick=page.locator('[data-wfe-action="tool-configure"]');await pick.scrollIntoViewIfNeeded();
    assert.equal(await pick.isEnabled(),true);
    assert.equal(await pick.evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2));}),true);
    assert.ok((await pick.locator('img').boundingBox()).width>=140);
    const panel=await page.locator('.wfe-tool-panel').boundingBox();await page.screenshot({path:`${base}/utensil-panel.png`,clip:{x:panel.x,y:panel.y-18,width:panel.width,height:panel.height+18}});
    await page.goto(`file://${base}/feral-readonly.html`);assert.equal(await page.locator('[data-wfe-action="tool-configure"]').isDisabled(),true);
    results.push({toolIconLarge:true,toolPickerUnobstructed:true,toolReadonly:true});await page.close();
  }
  for(const type of ["feral","monster"]) {
    const page=await browser.newPage({viewport:{width:580,height:1100},deviceScaleFactor:1});await page.goto(`file://${base}/${type}.html`);
    await page.screenshot({path:`${base}/${type}-compact.png`});
    const info=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,panelOverflow:[...document.querySelectorAll(".wfe-panel,.wfe-header")].filter(el=>el.offsetParent&&el.scrollWidth>el.clientWidth+2).map(el=>el.className)}));
    assert.equal(info.overflow,false);assert.deepEqual(info.panelOverflow,[]);results.push({type,width:580,...info});await page.close();
    const readonly=await browser.newPage({viewport:{width:1100,height:1160}});await readonly.goto(`file://${base}/${type}-readonly.html`);
    const enabledInputs=await readonly.locator("main input:not([disabled]),main textarea:not([disabled])").count();assert.equal(enabledInputs,0);
    results.push({type,readonly:true,enabledInputs});await readonly.close();
  }
  for(const type of ["feral","monster"]) {
    const page=await browser.newPage({viewport:{width:1200,height:1100}});
    await page.goto(`file://${base}/${type}.html`);
    await page.locator('main.window-app').evaluate(el=>{el.style.width='500px';el.style.height='940px';});
    for(const tab of ["mechanics","identity"]){
      await page.locator(`[data-tab="${tab}"]`).first().click();
      const info=await page.evaluate(()=>({overflow:[...document.querySelectorAll('.wfe-panel,.wfe-header,.wfe-tabs')].filter(el=>el.offsetParent&&el.scrollWidth>el.clientWidth+2).map(el=>el.className),bodyBottom:document.querySelector('.wfe-body').getBoundingClientRect().bottom,footerTop:document.querySelector('.wfe-landscape').getBoundingClientRect().top,footerPointerEvents:getComputedStyle(document.querySelector('.wfe-landscape')).pointerEvents,portraitHeight:document.querySelector('.wfe-portrait').getBoundingClientRect().height}));
      assert.deepEqual(info.overflow,[]);assert.ok(info.bodyBottom<=info.footerTop+1);assert.equal(info.footerPointerEvents,'none');assert.equal(info.portraitHeight,97);
      results.push({type,tab,sheetWidth:500,viewportWidth:1200,...info});
    }
    await page.close();
  }
  for(const type of ["feral","monster"]) {
    const page=await browser.newPage({viewport:{width:1100,height:1160}});await page.goto(`file://${base}/${type}.html`);
    const meter=page.locator('.wfe-vigor-meter');assert.equal(await meter.getAttribute('value'),type==='feral'?'17':'36');assert.equal(await meter.getAttribute('max'),type==='feral'?'22':'50');
    for(const button of await page.locator('[data-wfe-action="item-create"]').all()) {
      await button.scrollIntoViewIfNeeded();
      assert.equal(await button.evaluate(el=>{const b=el.getBoundingClientRect(),p=el.closest('.wfe-panel').getBoundingClientRect();return b.top>p.top+2&&document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)===el;}),true);
    }
    results.push({type,vigorMeter:true,creationButtonsUnobstructed:true});await page.close();
  }
  {
    const page=await browser.newPage({viewport:{width:1100,height:1160}});await page.goto(`file://${base}/feral.html`);
    const card=page.locator('.wfe-item[data-item-id="s1"]');await card.locator('details').evaluate(el=>el.open=true);await card.scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.wfe-type').count(),0);assert.equal(await page.locator('[data-wfe-action="turn"],input[name="flags.wilderfeast-enhanced.identity.pronouns"]').count(),0);assert.equal(await page.locator('[data-wfe-action="harmony"]').count(),1);assert.equal(await page.locator('input[name="flags.wilderfeast-enhanced.state.actions"]').count(),1);assert.match(await card.innerText(),/SEQUÊNCIA DE MOVIMENTOS/);assert.equal(await page.getByRole('button',{name:'Procurar',exact:true}).count(),1);
    assert.equal(await card.locator('.wfe-cost').textContent(),'5 de Vigor');
    await card.screenshot({path:`${base}/technique-card.png`});results.push({recipeCard:true,skillLabel:'Procurar',costPrefixRemoved:true});await page.close();
  }
  {
    const page=await browser.newPage({viewport:{width:1100,height:1160}});await page.goto(`file://${base}/feral.html`);
    await page.locator('.chat-preview').screenshot({path:`${base}/chat-roll.png`});
    assert.equal(await page.locator('.wfe-action-die').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(37, 72, 134)');
    assert.equal(await page.locator('.wfe-die').count(),4);assert.equal(await page.locator('.wfe-chat-damage').count(),1);
    assert.equal(await page.locator('.wfe-chat-tool').evaluate(el=>el.naturalWidth>0),true);
    results.push({visualRoll:true,bookToolImage:true,damageBlock:true});await page.close();
  }
  {
    const page=await browser.newPage({viewport:{width:1100,height:1160}});await page.goto(`file://${base}/feral.html`);
    await page.locator('.wfe-header').screenshot({path:`${base}/header-resources.png`});
    await page.locator('.wfc-toolbar').screenshot({path:`${base}/compendium-toolbar.png`});
    await page.locator('.wfe-position').scrollIntoViewIfNeeded();const p=await page.locator('.wfe-position').boundingBox();await page.screenshot({path:`${base}/hunt-position.png`,clip:{x:p.x,y:p.y-18,width:p.width,height:p.height+18}});
    for(const el of await page.locator('.wfe-small-frame input,.wfe-harmony-frame').all()) {await el.scrollIntoViewIfNeeded();assert.equal(await el.evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2));}),true);}
    results.push({headerResourcesAccessible:true,huntPosition:true,toolbarRestyled:true});await page.close();
  }
  for(const width of [1100,390]) {
    const page=await browser.newPage({viewport:{width,height:1160}});await page.goto(`file://${base}/feral.html`);
    const buttons=page.locator('.wfe-action-toolbar button');assert.equal(await buttons.count(),6);
    for(const button of await buttons.all()) {await button.scrollIntoViewIfNeeded();assert.equal(await button.locator('svg').count(),1);assert.equal(await button.evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2));}),true);}
    if(width===1100){const box=await page.locator('.wfe-action-toolbar').boundingBox();await page.screenshot({path:`${base}/action-buttons.png`,clip:{x:box.x-4,y:box.y-4,width:box.width+12,height:box.height+14}});}
    await page.goto(`file://${base}/feral-readonly.html`);assert.equal(await page.locator('.wfe-action-toolbar button:disabled').count(),6);
    results.push({actionButtons:6,width,clickable:true,readonly:true});await page.close();
  }
  for(const type of ['monster','feral']) {
    const page=await browser.newPage({viewport:{width:1100,height:1160}});await page.goto(`file://${base}/${type}.html`);
    const primary=page.locator('.wfe-action-toolbar [data-wfe-action="roll"]');assert.equal(await primary.evaluate(el=>getComputedStyle(el).backgroundColor),type==='monster'?'rgb(54, 122, 98)':'rgb(37, 72, 134)');
    const frame=await page.locator('.wfe-nameplate').evaluate(el=>getComputedStyle(el).backgroundImage);assert.ok(frame.includes(type==='monster'?'monster-frame.svg':'chapter-frame.svg'));
    assert.equal(await page.locator('.wfe-monster-sheet').count(),type==='monster'?1:0);
    results.push({palette:type,isolated:true});await page.close();
  }
  for(const [width,height] of [[1440,900],[1280,600],[390,520]])for(const name of ['utensil','equip','confirm','test','attack','vigor','item','trait','specialty','specialty-traits']) {
    const page=await browser.newPage({viewport:{width,height}});await page.goto(`file://${base}/dialogs/${name}.html`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).length),0);
    const button=page.locator('.form-footer button').first();
    const reachable=()=>button.evaluate(el=>{const b=el.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight&&document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)===el;});
    assert.equal(await reachable(),true,`${name} ${width}x${height}: rodapé acessível`);
    await page.locator('.wfe-dialog-body').evaluate(el=>el.scrollTop=el.scrollHeight);assert.equal(await reachable(),true);
    if(['trait','specialty','specialty-traits'].includes(name)) {
      const select=page.locator('select[data-wfe-preview-select]').first(),group=await select.getAttribute('data-wfe-preview-select');
      const panels=page.locator(`[data-wfe-preview-group="${group}"]:not([hidden])`);assert.equal(await panels.count(),1);
      const before=await panels.innerText();await select.selectOption({index:1});assert.equal(await panels.count(),1);assert.notEqual(await panels.innerText(),before);assert.ok((await panels.innerText()).length>100);
    }
    if(name==='utensil') {
      assert.equal(await page.locator('.wfe-tool-chooser img').count(),6);
      assert.ok((await page.locator('.wfe-tool-chooser img').first().boundingBox()).width<=88);
      await page.locator('.wfe-tool-chooser label').last().click();assert.equal(await page.locator('.wfe-tool-chooser input').last().isChecked(),true);
    }
    await button.click();assert.equal(await page.locator('body').getAttribute('data-confirmed'),'true');
    if(width===1440){await page.locator('.wfe-dialog-body').evaluate(el=>el.scrollTop=0);await page.locator('.application').screenshot({path:`${base}/dialogs/${name}.png`});}
    if(width===390&&name==='attack')await page.locator('.application').screenshot({path:`${base}/dialogs/attack-compact.png`});
    results.push({dialog:name,width,height,confirmationReachable:true});await page.close();
  }
  for(const width of [1100,390])for(const name of ['technique','trait','recipe']) {
    const page=await browser.newPage({viewport:{width,height:800}});await page.goto(`file://${base}/editors/${name}.html`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.locator('.item-sheet').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
    assert.equal(await page.locator('.editor-content').evaluate(el=>getComputedStyle(el).fontFamily),'Arial, sans-serif');
    assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).length),0);
    await page.locator('.editor-edit').click();assert.equal(await page.locator('textarea[name="system.description"]').isVisible(),true);
    await page.locator('.editor-edit').click();assert.equal(await page.locator('.editor-content').isVisible(),true);
    if(width===1100)await page.locator('.window-app').screenshot({path:`${base}/editors/${name}.png`});
    results.push({editor:name,width,nativeTemplate:true,descriptionToggle:true});await page.close();
  }
  for(const [width,height] of [[1440,1100],[1280,600],[390,520]])for(const name of ['tool','specialty','origin','pack','name']) {
    const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`file://${base}/generator/generator-${name}.html`);
    assert.deepEqual(errors,[]);assert.equal(await page.locator('[data-wfe-generator-step]').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).length),0);
    assert.equal(await page.locator('.wfe-generator-progress .active').count(),1);
    for(const button of await page.locator('.form-footer button').all())assert.equal(await button.evaluate(el=>{const b=el.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight&&el.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2));}),true,`${name} ${width}: navegação acessível`);
    if(width===1440)await page.locator('.application').screenshot({path:`${base}/generator/generator-${name}.png`});
    if(name==='tool') {
      await page.locator('.wfe-tool-chooser label').last().click();
      assert.equal(await page.locator('[data-wfe-generator-tool]:not([hidden])').count(),1);
      assert.equal(await page.locator('[data-wfe-generator-tool][hidden] select:not([disabled])').count(),0);
      const chooser=page.locator('[data-wfe-generator-tool]:not([hidden]) select[data-wfe-preview-select]');await chooser.selectOption({index:1});
      const group=await chooser.getAttribute('data-wfe-preview-select');assert.equal(await page.locator(`[data-wfe-preview-group="${group}"]:not([hidden])`).count(),1);
    }
    if(name==='specialty') {
      await page.locator('[data-wfe-generator-specialty]').selectOption({index:1});assert.equal(await page.locator('[data-wfe-generator-specialty-panel]:not([hidden])').count(),1);
      assert.equal(await page.locator('[data-wfe-generator-specialty-panel][hidden] select:not([disabled])').count(),0);
    }
    if(name==='pack') {await page.locator('.wfe-generator-pack label').last().click();assert.equal(await page.locator('input[value="personalizada"]').isChecked(),true);}
    if(name==='name')assert.equal(await page.locator('input[name="name"]').inputValue(),'Lina, a Feral');
    assert.equal(await page.locator('.wfe-generator-next').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(37, 72, 134)');
    if(name==='name')assert.equal(await page.locator('.form-footer button').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 248, 229)');
    await page.locator('.wfe-dialog-body').evaluate(el=>el.scrollTop=el.scrollHeight);
    await page.locator('.form-footer button[type="submit"]').click();assert.equal(await page.locator('body').getAttribute('data-confirmed'),'true');
    results.push({generator:name,width,height,singlePage:true,navigationReachable:true,errors});await page.close();
  }
  {
    const page=await browser.newPage({viewport:{width:420,height:560}});await page.goto(`file://${base}/generator/generator-button.html`);
    assert.equal(await page.locator('[data-wfe-generate-character]').count(),1);await page.locator('[data-wfe-generate-character]').click();
    assert.ok((await page.locator('[data-wfe-generate-character]').boundingBox()).width>280);
    assert.equal(await page.locator('body').getAttribute('data-generator-opened'),'true');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.locator('.actors-sidebar').screenshot({path:`${base}/generator/generator-button.png`});results.push({generatorDirectoryButton:true,clickable:true});await page.close();
  }
  for(const width of [1100,390]){
    const page=await browser.newPage({viewport:{width,height:1000}});await page.goto(`file://${base}/feral.html`);
    const attacks=page.locator('[data-wfe-action="tool-attack"]');assert.equal(await attacks.count(),8);
    for(const b of await attacks.all()){await b.scrollIntoViewIfNeeded();assert.equal(await b.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}),true);}
    if(width===1100){
      const markup=await page.locator('.wfe-tool-panel').evaluate(el=>el.outerHTML),css=(await fs.readFile(path.join(root,'styles/enhanced.css'),'utf8')).replaceAll('../assets/','../../assets/');
      const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#c9c3b5;font:14px Arial}.wfe-sheet{width:980px;max-width:100%;margin:auto;background:#fff8e5 url('../../assets/sheet/paper-grain.svg');container-type:inline-size;container-name:wfeSheet}input{width:100%}${css}</style><main class="wfe-sheet">${markup.replaceAll('src="../','src="../../')}</main></html>`;
      await fs.writeFile(`${base}/hunt/tool-attacks.html`,html);
      const preview=await browser.newPage({viewport:{width:1028,height:850}});await preview.goto(`file://${base}/hunt/tool-attacks.html`);const box=await preview.locator(".wfe-sheet").boundingBox();await preview.setViewportSize({width:1028,height:Math.ceil(box.y+box.height+24)});await preview.screenshot({path:`${base}/hunt/tool-attacks.png`,fullPage:true});await preview.close();
    }
    await page.goto(`file://${base}/feral-readonly.html`);assert.equal(await page.locator('[data-wfe-action="tool-attack"]:disabled').count(),8);
    results.push({toolAttacks:8,width,clickable:true,readonly:true});await page.close();
  }
  for(const [width,height] of [[1100,900],[1280,600],[390,520]])for(const readonly of [false,true]){
    const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`file://${base}/hunt/hunt-marker${readonly?'-readonly':''}.html`);assert.deepEqual(errors,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).length),0);
    if(!readonly){
      for(const b of await page.locator('.form-footer button,.wfe-marker-map-buttons button').all())assert.equal(await b.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}),true,'Navegação do marcador visível');
      await page.locator('[data-wfe-marker-delta="1"]').click();assert.ok((await page.locator('.wfe-hunt-marker img').getAttribute('src')).endsWith('marcador-3.svg'));
      await page.locator('[data-wfe-marker-value="0"]').click();assert.equal(await page.locator('[data-wfe-marker-delta="-1"]').isDisabled(),true);
      await page.locator('[data-wfe-marker-value="4"]').click();assert.equal(await page.locator('[data-wfe-marker-delta="1"]').isDisabled(),true);
      await page.locator('[data-wfe-marker-place="positions"]').click();assert.equal(await page.locator('body').getAttribute('data-placed'),'positions');
      await page.locator('[data-wfe-marker-value="2"]').click();if(width===1100)await page.locator('.application').screenshot({path:`${base}/hunt/hunt-marker.png`});
    }else assert.equal(await page.locator('button:not([disabled])').count(),0);
    results.push({huntMarker:true,width,height,readonly,errors});await page.close();
  }
  for(const width of [1100,390]){
    const page=await browser.newPage({viewport:{width,height:850}});await page.goto(`file://${base}/hunt/hunt-map.html`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).length),0);
    assert.equal(await page.locator('.token').count(),2);if(width===1100)await page.locator('.hunt-map').screenshot({path:`${base}/hunt/hunt-map.png`});
    results.push({huntMap:true,width,tokensAbove:true});await page.close();
  }
  await fs.writeFile(`${base}/ui-checks.json`,JSON.stringify(results,null,2));
  console.log(`${results.length} cenários de interface aprovados: abas, redimensionamento da janela, imagens e leitura sem edição.`);
} finally {await browser.close();}
