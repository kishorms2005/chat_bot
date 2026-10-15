ATTENDWISE — GOOGLE SHEETS SETUP

FILES
- index.html, style.css, script.js: website files
- config.js: paste your deployed Apps Script Web App URL here
- GoogleAppsScript.gs: backend code to paste into Google Apps Script

1) CREATE THE SPREADSHEET
- Create a new Google Sheet at https://sheets.google.com/
- Give it a name such as AttendWise Data.
- You do not need to create tabs manually; the script creates AppData, Subjects, Attendance, and Settings tabs.

2) ADD THE BACKEND
- In the spreadsheet, open Extensions > Apps Script.
- Replace the starter code in Code.gs with the entire contents of GoogleAppsScript.gs.
- Click Save.

3) DEPLOY AS A WEB APP
- Click Deploy > New deployment.
- Select type: Web app.
- Execute as: Me.
- Who has access: Anyone (needed for this simple static-site demo).
- Click Deploy and complete Google's authorization prompts.
- Copy the Web app URL ending in /exec.

4) CONNECT THE WEBSITE
- Open config.js.
- Set SHEETS_API_URL to the copied URL, for example:
  window.ATTENDWISE_CONFIG = {
    SHEETS_API_URL: 'https://script.google.com/macros/s/PASTE_DEPLOYMENT_ID/exec'
  };
- Save the file.
- Keep config.js, index.html, style.css and script.js together in the same folder.

5) TEST
- Open index.html using a local web server or deploy the folder to Netlify.
- Add a subject and mark attendance. The website keeps a local copy and sends the full snapshot to Google Sheets.
- Refresh/reopen the page to load the saved snapshot from Google Sheets.
- The Subjects and Attendance tabs show readable rows; AppData!A1 holds the full JSON snapshot used to restore the app.

SECURITY AND LIMITATIONS
- This no-login version uses one shared spreadsheet dataset. Anyone who gets the public website and Apps Script URL can potentially read/write the shared data. Do not use it for private/sensitive data.
- The browser's POST request uses no-cors, so the page cannot verify that Google's server accepted the save. Check the Google Sheet after the first test. Local browser storage remains as a fallback.
- If you change the Apps Script code after deployment, use Deploy > Manage deployments > Edit, select a new version, and deploy it.
- This is a simple demo bridge, not a secure multi-user backend. For private data, use authenticated server-side access (for example Firebase/Supabase with security rules).
