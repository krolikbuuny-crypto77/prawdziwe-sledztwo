import assert from 'node:assert/strict';import fs from 'node:fs';
import {registry} from '../lib/witness-engine-rc22.js';
const events=[
 ['shift','ADM-01','18:00',1080,1080],['course','TEC-02','18:26',1106,1106],
 ['warning','TEC-03','19:11',1151,1151],['order','TEC-04','19:46',1186,1186],
 ['work','EVID_WORK_ORDER_RAW','20:54',1254,1254],['bhp-contact','DIG-01','21:47',1307,1307],
 ['dispatch','EVID_DISPATCH_REVISION','23:14',1394,1394],['card-issued','ADM-07','00:16',1456,1456],
 ['card-handover','EVID_RESOURCE_HANDOVER','00:39',1479,1479],
 ['test-start','EVID_TCMS_SESSION','01:06',1506,1506],['test-end','EVID_TCMS_SESSION','01:24',1524,1524],
 ['audit-session','EVID_CONFERENCE_SESSION','01:30',1530,1560],
 ['message','EVID_MESSAGE_THREAD_RECOVERED','01:32',1532,1532],
 ['death-window','MED-03','01:41–01:49',1541,1549],['impact','TEC-14','01:44',1544,1544],
 ['alarm','MED-01','02:02:11',1562+11/60,1562+11/60],
 ['securing','ADM-13','03:14',1634,1634],['deposit','ADM-13','05:41',1781,1781]
].map(([id,document,anchor,start,end])=>({id,document,anchor,start,end}));
for(const event of events)assert(registry.documents[event.document].body.includes(event.anchor),event.id+' source time changed');
const byId=Object.fromEntries(events.map(e=>[e.id,e]));
const before=[['shift','course'],['warning','order'],['order','work'],['card-issued','card-handover'],['card-handover','test-start'],['test-start','test-end'],['test-end','death-window'],['message','death-window'],['death-window','alarm'],['alarm','securing'],['securing','deposit']];
for(const [a,b] of before)assert(byId[a].end<byId[b].start,a+' must precede '+b);
assert(byId.impact.start>=byId['death-window'].start&&byId.impact.end<=byId['death-window'].end);
// A time interval is preserved as an interval: impact is not asserted as exact death time.
assert.notEqual(byId['death-window'].start,byId['death-window'].end);
const get=(id,key)=>registry.profiles[id].facts.find(f=>f.authoredId===key)?.text||'';
for(const id of ['MAREK','JANUSZ'])assert(get(id,'RC19-'+id+'-S02').includes('przed północą'));
for(const id of ['JANUSZ','KAMIL'])assert(get(id,'RC19-'+id+'-S02').includes('przed sesją diagnostyczną'));
for(const id of ['MAREK','JANUSZ','KAMIL'])assert(get(id,'RC19-'+id+'-S02').includes('01:30–02:05'));
const findings={version:'RC22',events,before,interpretation:['Temporal ordering is not causation.','The medical death interval is not reduced to the sensor minute.','A work conversation before midnight or before diagnostics does not establish continuous presence during the critical interval.'],remainingLimits:['Automated temporal/source checks do not prove every narrative statement semantically consistent.','No new independent evidence was added to corroborate the authored mutual conversations.']};
fs.writeFileSync(new URL('../AUDYT-CHRONOLOGII-RC22.json',import.meta.url),JSON.stringify(findings,null,2));
console.log('PASS RC22 narrative: 18 sourced time nodes, temporal constraints, medical uncertainty and reciprocal limited corroboration');
