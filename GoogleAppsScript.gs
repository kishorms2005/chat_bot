/** AttendWise ↔ Google Sheets bridge
 * Deploy as a Web app: Execute as Me; access Anyone.
 * This is a simple shared-data demo. Anyone who obtains the URL can read/write its data.
 */
const APP_DATA_TAB = 'AppData';
const SUBJECTS_TAB = 'Subjects';
const ATTENDANCE_TAB = 'Attendance';
const SETTINGS_TAB = 'Settings';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'load';
  if (action !== 'load') return output_({ok:false, error:'Unknown action'});
  const data = readData_();
  const callback = e && e.parameter && e.parameter.callback;
  const json = JSON.stringify({ok:true, data:data});
  if (callback && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action !== 'save' || !body.data || !Array.isArray(body.data.subjects)) {
      return output_({ok:false, error:'Invalid payload'});
    }
    writeData_(body.data);
    return output_({ok:true, savedAt:new Date().toISOString()});
  } catch (err) {
    return output_({ok:false, error:String(err)});
  } finally {
    lock.releaseLock();
  }
}

function readData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tab = ss.getSheetByName(APP_DATA_TAB);
  if (!tab || !tab.getRange('A1').getValue()) {
    return {subjects:[], theme:'dark', target:75, settings:{firstDay:0}};
  }
  try { return JSON.parse(tab.getRange('A1').getValue()); }
  catch (err) { return {subjects:[], theme:'dark', target:75, settings:{firstDay:0}}; }
}

function writeData_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appData = getOrCreate_(ss, APP_DATA_TAB);
  appData.clearContents();
  appData.getRange('A1').setValue(JSON.stringify(data));
  appData.getRange('A2').setValue('Stores the latest AttendWise data snapshot. Do not edit A1 manually.');

  const subjects = getOrCreate_(ss, SUBJECTS_TAB);
  subjects.clearContents();
  subjects.getRange(1,1,1,5).setValues([['Subject ID','Subject Name','Class Days','Initial Present','Initial Absent']]);
  const subjectRows = data.subjects.map(s => [String(s.id || ''), String(s.name || ''), (s.days || []).join(', '), Number(s.initialPresent || 0), Number(s.initialAbsent || 0)]);
  if (subjectRows.length) subjects.getRange(2,1,subjectRows.length,5).setValues(subjectRows);

  const attendance = getOrCreate_(ss, ATTENDANCE_TAB);
  attendance.clearContents();
  const subjectNames = {};
  data.subjects.forEach(s => { subjectNames[String(s.id)] = String(s.name || ''); });
  const rows = [];
  data.subjects.forEach(s => (s.records || []).forEach(r => rows.push([
    String(s.id || ''), String(s.name || subjectNames[String(s.id)] || ''), String(r.id || ''), String(r.date || ''), String(r.status || ''), String(r.time || ''), String(r.note || '')
  ])));
  // Header has seven columns, matching the rows above.
  attendance.getRange(1,1,1,7).setValues([['Subject ID','Subject Name','Entry ID','Date','Status','Class Timing','Note']]);
  if (rows.length) attendance.getRange(2,1,rows.length,7).setValues(rows);

  const settings = getOrCreate_(ss, SETTINGS_TAB);
  settings.clearContents();
  settings.getRange(1,1,1,2).setValues([['Setting','Value']]);
  settings.getRange(2,1,3,2).setValues([
    ['Theme', String(data.theme || 'dark')],
    ['Attendance Target', Number(data.target || 75)],
    ['Settings JSON', JSON.stringify(data.settings || {firstDay:0})]
  ]);
}

function getOrCreate_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function output_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
