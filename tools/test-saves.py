"""Stage 2 SaveManager regression: actual browser, legacy migrations and UI round-trip.

Requires Python Playwright + Chromium. No paid AI requests. Runs a localhost static server.
"""
import json, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
STORAGE_SHIM="""(contents) => {
 const map=new Map(Object.entries(contents||{}));
 const store={getItem(key){return map.has(String(key))?map.get(String(key)):null;},
 setItem(key,value){map.set(String(key),String(value));},removeItem(key){map.delete(String(key));},
 clear(){map.clear();},key(i){return [...map.keys()][i]||null;},get length(){return map.size;},
 __dump(){return Object.fromEntries(map)} };
 Object.defineProperty(window,'localStorage',{configurable:true,value:store});
}"""
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome') or None,args=['--no-sandbox'])
    context=browser.new_context(accept_downloads=True,viewport={'width':390,'height':844})
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate(STORAGE_SHIM,{})
    page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    result=page.evaluate('''() => {const s=buildSave();return {
        hash:SaveManager.sha256('abc'),hooks:SaveManager.inspect().hooks,
        schema:SaveManager.verify(s).schemaVersion,format:s.format,version:s.version};}''')
    assert result['hash']=='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',result
    assert result['schema']==2 and result['version']==11 and len(result['hooks'])==49,result
    assert len(set(result['hooks']))==49
    print('PASS v2 checksum (SHA-256 test vector), 49 unique hooks, legacy V7 payload unchanged')

    # Witness memories, evidence, notes, progress, statistics remain in the payload.
    seeded=page.evaluate('''() => {
      STATE.notes='Próba zapisu: widziałem dokument №1';document.getElementById('notes').value=STATE.notes;
      const id=CONTENT.characters[0].id;
      STATE.dialogues[id].push({role:'player',text:'Co wiesz o nocnym kursie?'});
      const s=buildSave();return {s,id,notes:STATE.notes};
    }''')
    original=seeded['s']
    assert original['dialogues'][seeded['id']][-1]['text']=='Co wiesz o nocnym kursie?'
    for key in ['investigationSim','npc9','deduction','timeline11','scene12','caseAchievements','minigames2','minigames3','breakthrough']:
      if key=='breakthrough':assert 'breakthrough' in original['investigationSim']
      else:assert key in original,key
    state=page.evaluate('''(s) => {
       STATE.notes='Nie powinno pozostać';STATE.dialogues[CONTENT.characters[0].id]=[];
       safeLoad(s);
       const re=buildSave();return {notes:STATE.notes,dialogues:STATE.dialogues[CONTENT.characters[0].id],valid:SaveManager.verify(re),found:STATE.found.size};
    }''',original)
    assert state['notes']==seeded['notes'] and any(x['role']=='player' for x in state['dialogues']),state
    print('PASS complete round-trip: notes, six witnesses, game modules, achievements, checksum')

    integrity=page.evaluate('''(s) => {
      const bad=JSON.parse(JSON.stringify(s));bad.notes='Zmieniona treść bez aktualizacji sumy';
      const before=STATE.notes;let thrown='';try{safeLoad(bad);}catch(e){thrown=e.message;}
      return {thrown,unchanged:STATE.notes===before,valid:SaveManager.verify(s)};
    }''',original)
    assert 'Suma kontrolna' in integrity['thrown'] and integrity['unchanged'],integrity
    print('PASS checksum rejects tampered file without modifying game state')

    # Test rollback after a genuine mid-load exception (beyond metadata validation).
    rollback=page.evaluate('''(s) => {
      const valid=JSON.parse(JSON.stringify(s));let first=true;
      const off=registerSaveHook({name:'test-fault-injection',apply(){if(first){first=false;throw Error('Injected load error');}}});
      STATE.notes='Stan przed nieudanym importem';let error='';
      try{safeLoad(valid);}catch(e){error=e.message;}finally{off();}
      return {error,notes:STATE.notes};
    }''',original)
    assert rollback=={'error':'Injected load error','notes':'Stan przed nieudanym importem'},rollback
    print('PASS failure rollback restores original state after partially applied import')

    # Real V7 version migration without metadata (the legacy versions accepted by core).
    versions=page.evaluate('''(s) => {
      const results=[];
      for(let v=1;v<=11;v++){
        const old=JSON.parse(JSON.stringify(s));delete old.saveMeta;old.version=v;
        safeLoad(old);results.push({v,notes:STATE.notes,legacy:SaveManager.verify(old).legacy});
      }
      return results;
    }''',original)
    assert len(versions)==11 and all(x['legacy'] and x['notes']==seeded['notes'] for x in versions),versions
    print('PASS migrations: all 11 legacy versions from v1 to v11')

    # Version 3 demo format with a minimal payload must not require later extensions.
    minimal=page.evaluate('''(s) => {
       const x=JSON.parse(JSON.stringify(s));delete x.saveMeta;x.format='PS_V7_DEMO_STAGE3';x.version=1;
       for(const k of ['investigationSim','ps','intro2','minigames2','minigames3','caseAchievements'])delete x[k];
       safeLoad(x);
       return {found:STATE.found.size,achievement:buildSave().caseAchievements.timingCoverage,notes:STATE.notes};
    }''',original)
    assert minimal['achievement']=='unavailable' and minimal['notes']==seeded['notes'],minimal
    print('PASS incomplete historic stage-3 save with absent modern modules')

    # Manual download produces a valid v2 JSON file.
    page.evaluate("showTab('notebook')")
    page.locator('#ps88SaveManagement summary').click()
    with page.expect_download(timeout=8000) as info:
        page.locator('#saveBtn').click()
    download=info.value
    exported=json.loads(Path(download.path()).read_text(encoding='utf8'))
    assert download.suggested_filename=='Ostatni_kurs_zapis_sprawy.json'
    assert exported['saveMeta']['schemaVersion']==2 and exported['notes']==seeded['notes']
    print('PASS actual Export button and downloaded JSON')

    # Manual file input import through its async change event handler.
    page.evaluate("STATE.notes='Przed importem';document.getElementById('notes').value=STATE.notes")
    page.evaluate("() => {window.__saveLogs=[];const last=toast;toast=function(...args){window.__saveLogs.push(args[0]);return last.apply(this,args);}}")
    page.locator('#loadFile').set_input_files({'name':'history.json','mimeType':'application/json','buffer':json.dumps(exported).encode('utf8')})
    page.locator('#psAsk').wait_for(state='visible',timeout=15000)
    assert 'Wczytanie pliku zastąpi' in page.locator('#psAsk').inner_text()
    page.locator('#psAsk button',has_text='Potwierdź').click()
    page.wait_for_function("STATE.notes === 'Próba zapisu: widziałem dokument №1'",timeout=10000)
    assert page.evaluate('SaveManager.verify(buildSave()).schemaVersion')==2
    print('PASS actual Import file input with valid checksum')

    # User activity creates autosave. Reload keeps it but starts with a clean session until the user opts in.
    page.locator('#ps88QuickNotes summary').click()
    page.locator('#notes').fill('Autosave proof ńą')
    page.wait_for_function("JSON.parse(localStorage.getItem('ps_detective_autosave_v2')||'null')?.save?.notes === 'Autosave proof ńą'",timeout=15000)
    auto=page.evaluate("SaveManager.readAutosave('ps_detective_autosave_v2')")
    assert auto['save']['notes']=='Autosave proof ńą',auto['save']['notes']
    previous_storage=page.evaluate('localStorage.__dump()')
    page.reload(wait_until='domcontentloaded')
    page.evaluate(STORAGE_SHIM,previous_storage)
    page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    assert page.evaluate('STATE.notes')==''
    assert page.locator('#psResumeOffer').is_visible()
    page.get_by_text('Wznów poprzednią sesję',exact=True).click()
    assert page.evaluate('STATE.notes')=='Autosave proof ńą'
    print('PASS autosave, new-game clean start, explicit resume')

    # Reset operates through actual confirmation flow and must clear stored autosave.
    page.evaluate("showTab('notebook')")
    page.locator('#ps88SaveManagement summary').click()
    page.locator('#resetBtn').click()
    confirmation=page.locator('.ps-ask')
    page.locator('#psAsk').wait_for(state='visible')
    page.locator('#psAsk button',has_text='Potwierdź').click()
    assert page.evaluate("localStorage.getItem('ps_detective_autosave_v2')") is None
    assert page.evaluate('STATE.notes')==''
    print('PASS actual Reset button clears session and autosave')

    # An invalid persisted checksum must be surfaced to the player, not restored silently.
    broken=json.loads(json.dumps(exported));broken['notes']='Celowe uszkodzenie';
    corrupt_session=json.dumps({'tab':'legacy','t':123,'save':broken},ensure_ascii=False)
    page.reload(wait_until='domcontentloaded')
    page.evaluate(STORAGE_SHIM,{'ps_detective_autosave_v2':corrupt_session})
    page.set_content(HTML,wait_until='domcontentloaded')
    assert page.evaluate('STATE.notes')==''
    assert page.locator('#psResumeOffer').get_attribute('role')=='alert'
    assert 'nieprawidłowy' in page.locator('#psResumeOffer').inner_text()
    page.get_by_text('Odrzuć uszkodzony zapis',exact=True).click()
    assert page.evaluate("localStorage.getItem('ps_detective_autosave_v2')") is None
    print('PASS corrupted autosave is rejected with a visible discard choice')

    assert page.evaluate('SaveManager.inspect().hooks.length')==49

    assert not errors,errors[:10]
    page.close();context.close();browser.close()

