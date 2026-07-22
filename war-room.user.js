// ==UserScript==
// @name         War Room — Tribal Wars Command
// @namespace    https://danieltanasescu.dev/warroom
// @version      1.6.0
// @description  Unofficial in-game planning panel for Tribal Wars: farm queue, attack forms, attacker intel, attack timing, build guide. Fills the rally point but never sends — you press Attack yourself.
// @author       Daniel Tanasescu
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.tribalwars.co.uk/game.php*
// @match        https://*.tribalwars.us/game.php*
// @match        https://*.tribalwars.nl/game.php*
// @match        https://*.tribalwars.se/game.php*
// @match        https://*.tribalwars.com.br/game.php*
// @match        https://*.tribalwars.com.pt/game.php*
// @match        https://*.tribalwars.ae/game.php*
// @match        https://*.tribalwars.works/game.php*
// @match        https://*.plemiona.pl/game.php*
// @match        https://*.die-staemme.de/game.php*
// @match        https://*.staemme.ch/game.php*
// @match        https://*.guerrastribales.es/game.php*
// @match        https://*.tribalwars.gr/game.php*
// @match        https://*.divokekmeny.cz/game.php*
// @match        https://*.triburile.ro/game.php*
// @match        https://*.plemena.com/game.php*
// @match        https://*.tribalwars.dk/game.php*
// @match        https://*.tribalwars.no/game.php*
// @match        https://*.klanhaboru.hu/game.php*
// @match        https://*.tribalwars.hu/game.php*
// @match        https://*.tribals.it/game.php*
// @match        https://*.vojnaplemen.si/game.php*
// @match        https://*.fyristorg.com/game.php*
// @match        https://*.tribalwars.asia/game.php*
// @match        https://*.tribalwars.cz/game.php*
// @match        https://*.plemena.net/game.php*
// @match        https://*.bujokai.com/game.php*
// @match        https://*.no.tribalwars.com/game.php*
// @grant GM_setValue
// @grant GM_getValue
// @run-at       document-idle
// ==/UserScript==

/* ============================================================================
   WAR ROOM — Tribal Wars planning panel  ·  UNOFFICIAL USERSCRIPT
   ----------------------------------------------------------------------------
   READ BEFORE INSTALLING:

   • This is an UNOFFICIAL, community userscript. It is NOT an official or
     Innogames-approved Tribal Wars script and is not hosted on the official
     Scripts Database.

   • Installing unofficial userscripts may be against the rules of your world /
     server. Whether you may use it is YOUR responsibility — check your world's
     script rules first. Use entirely at your own risk. The author accepts no
     liability for account penalties.

   • What it does: it PLANS and it FILLS. It writes coordinates and unit counts
     into the game's own rally-point form and can move the cursor onto the
     Attack button — but it NEVER sends an attack on its own. YOU press the key
     to send, every time. There is no auto-send, no auto-click, no bot behaviour.

   • Data: the optional "World Data" feature only reads the PUBLIC map exports
     (village.txt / player.txt) that you paste in yourself. It stores that and
     your own settings locally in your browser. It sends nothing anywhere.

   • No warranty. Provided as-is. If your world forbids it, don't use it.
   ============================================================================ */

(function () {
  'use strict';
  /* global game_data, BuildingMain, TribalWars, Timing */
  if (document.getElementById('wr-host')) return;

  /* =================================================================
     STYLES (CSP safe – no external font imports)
     ================================================================= */
  var ORIG_CSS = '/* ============================================================\n     WAR ROOM — a campaign table, not a dashboard.\n     Palette: aged parchment, iron, wax-seal red, brass.\n     Font stacks rely on system fonts (no external imports – CSP safe).\n     Display: Cinzel / Georgia. Body: Spectral / Georgia. Data: JetBrains Mono.\n     ============================================================ */\n  :host{\n    --parchment:#e8ddc7;\n    --parchment-dark:#d8c9a8;\n    --ink:#241a10;\n    --ink-soft:#4a3a26;\n    --iron:#2c2620;\n    --iron-light:#3a332a;\n    --wax:#7c1f1a;         /* seal red */\n    --wax-bright:#a3352b;\n    --brass:#b08d44;\n    --brass-bright:#d9b45a;\n    --parchment-line:#c3b28c;\n    --good:#3f6b3f;\n    --warn:#8a6a2f;\n    --crit:#6b1f1f;\n    --shadow:rgba(20,14,6,.35);\n  }\n\n  *{box-sizing:border-box;}\n  html{scroll-behavior:smooth;}\n  body{\n    margin:0;\n    font-family:\'Spectral\',Georgia,serif;\n    color:var(--ink);\n    background:\n      radial-gradient(ellipse at 20% 0%, #efe6d1 0%, transparent 55%),\n      radial-gradient(ellipse at 90% 20%, #e2d5b8 0%, transparent 50%),\n      #e8ddc7;\n    background-attachment:fixed;\n    line-height:1.6;\n    min-height:100vh;font-size:16px;\n  }\n  body::before{\n    content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.05;\n    background-image:\n      repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 3px),\n      repeating-linear-gradient(90deg, #000 0 1px, transparent 1px 3px);\n    mix-blend-mode:multiply;\n  }\n  .wrap{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:0 20px 80px;}\n\n  /* ---------- Header ---------- */\n  header.masthead{\n    padding:38px 0 22px;border-bottom:3px double var(--ink-soft);margin-bottom:6px;\n  }\n  .crest{\n    display:flex;align-items:center;gap:18px;flex-wrap:wrap;\n  }\n  .crest .sigil{\n    width:56px;height:56px;flex:none;border:2px solid var(--ink);border-radius:50%;\n    display:grid;place-items:center;background:var(--wax);color:var(--brass-bright);\n    font-family:\'Cinzel\',serif;font-weight:700;font-size:26px;box-shadow:0 3px 0 var(--shadow);\n  }\n  .masthead h1{\n    font-family:\'Cinzel\',serif;font-weight:700;letter-spacing:.06em;\n    font-size:clamp(28px,5vw,44px);margin:0;color:var(--ink);text-transform:uppercase;\n  }\n  .masthead .sub{\n    font-style:italic;color:var(--ink-soft);font-size:15px;margin-top:2px;\n  }\n  .launch{display:flex;gap:10px;margin-left:auto;flex-wrap:wrap;}\n  .launch a{\n    font-family:\'Cinzel\',serif;font-weight:600;font-size:12.5px;letter-spacing:.05em;\n    text-decoration:none;text-transform:uppercase;color:var(--parchment);\n    background:var(--iron);border:1px solid var(--ink);padding:9px 15px;border-radius:2px;\n    box-shadow:0 2px 0 var(--shadow);transition:transform .08s, background .15s;\n    display:inline-flex;align-items:center;gap:7px;\n  }\n  .launch a:hover{background:var(--wax);transform:translateY(-1px);}\n  .launch a .arw{color:var(--brass-bright);font-size:14px;}\n\n  /* ---------- Tabs ---------- */\n  nav.tabs{\n    display:flex;gap:2px;margin:22px 0 24px;flex-wrap:wrap;\n    border-bottom:1px solid var(--parchment-line);\n  }\n  nav.tabs button{\n    font-family:\'Cinzel\',serif;font-weight:600;font-size:14px;letter-spacing:.04em;\n    text-transform:uppercase;color:var(--ink-soft);background:transparent;border:none;\n    padding:13px 20px 14px;cursor:pointer;position:relative;border-radius:3px 3px 0 0;\n    transition:color .15s, background .15s;\n  }\n  nav.tabs button .n{\n    font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--brass);\n    margin-right:7px;font-weight:700;\n  }\n  nav.tabs button:hover{color:var(--ink);background:rgba(176,141,68,.1);}\n  nav.tabs button.active{color:var(--ink);}\n  nav.tabs button.active::after{\n    content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;background:var(--wax);\n  }\n\n  /* ---------- Panels ---------- */\n  .panel{display:none;animation:rise .25s ease;}\n  .panel.active{display:block;}\n  @keyframes rise{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}\n\n  .panel-head{margin-bottom:18px;}\n  .panel-head h2{\n    font-family:\'Cinzel\',serif;font-weight:700;font-size:22px;letter-spacing:.03em;\n    margin:0 0 4px;color:var(--ink);\n  }\n  .panel-head p{margin:0;color:var(--ink-soft);font-size:16px;max-width:66ch;line-height:1.6;}\n  .eyebrow{\n    font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:.18em;\n    text-transform:uppercase;color:var(--wax);font-weight:700;margin-bottom:6px;\n  }\n\n  /* ---------- Cards / fields ---------- */\n  .card{\n    background:linear-gradient(180deg,#efe7d3,#e4d8bd);\n    border:1px solid var(--parchment-line);border-radius:5px;padding:18px 20px;\n    box-shadow:0 2px 0 var(--shadow), inset 0 1px 0 rgba(255,255,255,.4);\n    margin-bottom:16px;\n  }\n  .grid{display:grid;gap:14px;}\n  .grid > *{min-width:0;}\n  .grid input,.grid select,.grid textarea{min-width:0;}\n  .g2{grid-template-columns:1fr 1fr;}\n  .g3{grid-template-columns:1fr 1fr 1fr;}\n  .g4{grid-template-columns:repeat(4,minmax(0,1fr));}\n  @media(max-width:720px){.launch{margin-left:0;width:100%;}}\n\n  label.fld{display:block;}\n  label.fld > span{\n    display:block;font-family:\'Cinzel\',serif;font-size:12.5px;font-weight:600;\n    letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:6px;\n  }\n  input,select,textarea{\n    width:100%;font-family:\'Spectral\',serif;font-size:16.5px;color:var(--ink);\n    background:#f6f0e0;border:1px solid var(--parchment-line);border-radius:3px;\n    padding:9px 11px;transition:border .15s, box-shadow .15s;\n  }\n  /* compact fields: troop counts and speeds do not need a wide box; label stays full-width above */\n  input[type=\"number\"]{ width:auto; max-width:110px; min-width:68px; }\n  input.mono[type=\"text\"], input.mono:not([type]){ width:auto; max-width:150px; min-width:108px; }\n  input.fq-target{ width:auto; max-width:170px; min-width:120px; }\n  select{ width:auto; max-width:260px; min-width:150px; }\n  textarea{ width:100%; }\n  textarea{font-family:\'JetBrains Mono\',monospace;font-size:14.5px;line-height:1.6;resize:vertical;}\n  input:focus,select:focus,textarea:focus{\n    outline:none;border-color:var(--wax);box-shadow:0 0 0 2px rgba(124,31,26,.15);\n  }\n  .mono{font-family:\'JetBrains Mono\',monospace;}\n\n  button.act{\n    font-family:\'Cinzel\',serif;font-weight:700;font-size:13.5px;letter-spacing:.05em;\n    text-transform:uppercase;color:var(--parchment);background:var(--wax);\n    border:1px solid var(--ink);border-radius:3px;padding:12px 24px;cursor:pointer;\n    box-shadow:0 2px 0 var(--shadow);transition:transform .08s, background .15s;\n  }\n  button.act:hover{background:var(--wax-bright);transform:translateY(-1px);}\n  button.act:active{transform:translateY(1px);box-shadow:0 1px 0 var(--shadow);}\n  button.ghost{\n    font-family:\'Cinzel\',serif;font-weight:600;font-size:13.5px;letter-spacing:.05em;\n    text-transform:uppercase;color:var(--parchment);background:var(--iron);\n    border:1px solid var(--ink);border-radius:3px;padding:12px 24px;cursor:pointer;\n    box-shadow:0 2px 0 var(--shadow);transition:transform .08s, background .15s;\n  }\n  button.ghost:hover{background:var(--iron-light);transform:translateY(-1px);}\n  button.ghost:active{transform:translateY(1px);box-shadow:0 1px 0 var(--shadow);}\n  .btn-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px;}\n\n  /* ---------- Tables ---------- */\n  .tbl-wrap{overflow-x:auto;border:1px solid var(--parchment-line);border-radius:5px;margin-top:14px;}\n  table{width:100%;border-collapse:collapse;font-size:15px;background:#efe7d3;}\n  th{\n    font-family:\'Cinzel\',serif;font-weight:600;font-size:12px;letter-spacing:.04em;\n    text-transform:uppercase;text-align:left;color:var(--parchment);background:var(--iron);\n    padding:11px 13px;white-space:nowrap;\n  }\n  td{padding:10px 13px;border-bottom:1px solid var(--parchment-line);}\n  td.mono,th.mono{font-family:\'JetBrains Mono\',monospace;}\n  tr:last-child td{border-bottom:none;}\n  tbody tr:nth-child(even){background:rgba(195,178,140,.18);}\n  tbody tr:hover{background:rgba(176,141,68,.16);}\n\n  .badge{\n    display:inline-block;font-family:\'Cinzel\',serif;font-weight:700;font-size:10.5px;\n    letter-spacing:.06em;padding:2px 9px;border-radius:2px;text-transform:uppercase;color:#fff;\n  }\n  .b-CRITICAL{background:var(--crit);}\n  .b-HIGH{background:var(--wax);}\n  .b-MEDIUM{background:var(--warn);}\n  .b-LOW{background:var(--good);}\n  .b-UNKNOWN{background:#555;}\n\n  .rating{font-family:\'Cinzel\',serif;font-weight:600;font-size:11px;letter-spacing:.03em;}\n  .r-Excellent{color:var(--good);}\n  .r-Good{color:#5a7a3a;}\n  .r-Fair{color:var(--warn);}\n  .r-Poor{color:var(--wax);}\n\n  .hint{font-size:14px;color:var(--ink-soft);font-style:italic;margin-top:8px;}\n  .note{\n    border-left:3px solid var(--wax);background:rgba(124,31,26,.06);\n    padding:12px 16px;border-radius:0 4px 4px 0;font-size:14.5px;color:var(--ink-soft);margin-top:14px;line-height:1.55;\n  }\n  .note strong{color:var(--ink);}\n  .err{color:var(--wax);font-weight:600;font-size:14.5px;margin-top:10px;}\n  .ok{color:var(--good);font-weight:600;font-size:14.5px;margin-top:10px;}\n\n  .stat-row{display:flex;gap:20px;flex-wrap:wrap;margin-top:6px;}\n  .stat{text-align:left;}\n  .stat .v{font-family:\'Cinzel\',serif;font-weight:700;font-size:22px;color:var(--ink);line-height:1;}\n  .stat .l{font-family:\'JetBrains Mono\',monospace;font-size:10.5px;letter-spacing:.1em;\n    text-transform:uppercase;color:var(--ink-soft);margin-top:3px;}\n\n  .step{\n    display:flex;gap:14px;align-items:flex-start;padding:12px 0;\n    border-bottom:1px dashed var(--parchment-line);\n  }\n  .step:last-child{border-bottom:none;}\n  .step .num{\n    flex:none;width:30px;height:30px;border-radius:50%;background:var(--iron);color:var(--brass-bright);\n    font-family:\'JetBrains Mono\',monospace;font-weight:700;font-size:13px;display:grid;place-items:center;\n    box-shadow:0 2px 0 var(--shadow);\n  }\n  .step .body{flex:1;}\n  .step .body .h{font-family:\'Cinzel\',serif;font-weight:600;font-size:16.5px;color:var(--ink);}\n  .step .body .h .lvl{font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--wax);font-weight:700;margin-left:8px;}\n  .step .body .why{font-size:15px;color:var(--ink-soft);margin-top:3px;line-height:1.5;}\n\n  footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--parchment-line);\n    font-size:12.5px;color:var(--ink-soft);font-style:italic;}\n  footer .safe{font-style:normal;font-family:\'JetBrains Mono\',monospace;font-size:11px;\n    letter-spacing:.05em;color:var(--wax);margin-top:6px;}\n  a.inline{color:var(--wax);text-decoration:underline;text-underline-offset:2px;}';

  var CHROME_CSS = "\n/* ---- launcher lives in the PAGE (outside shadow) ---- */\n/* panel chrome lives inside shadow root #wr-host */\n.wr-launch{\n  position:fixed; z-index:2147483000; right:16px; bottom:16px;\n  font-family:'Cinzel',serif; font-weight:700; font-size:13px; letter-spacing:.05em;\n  text-transform:uppercase; color:#e8ddc7; background:#7c1f1a;\n  border:2px solid #241a10; border-radius:4px; padding:11px 16px; cursor:grab;\n  box-shadow:0 3px 8px rgba(0,0,0,.4); display:flex; align-items:center; gap:8px;\n}\n.wr-launch:active{ cursor:grabbing; }\n.wr-launch:hover{ background:#a3352b; }\n.wr-launch .s{ font-size:16px; color:#d9b45a; }\n.wr-overlay{ position:fixed; inset:0; z-index:2147482999; background:rgba(15,10,4,.45); display:none; }\n.wr-overlay.open{ display:block; }\n.wr-panel{\n  position:fixed; z-index:2147483000; top:5vh; left:50%; transform:translateX(-50%);\n  width:min(1140px,94vw); max-height:90vh; min-width:340px; min-height:220px; display:none; flex-direction:column;\n  border:2px solid #241a10; border-radius:8px; overflow:hidden;\n  box-shadow:0 12px 40px rgba(0,0,0,.5); background:#e8ddc7;\n}\n.wr-panel.open{ display:flex; }\n.wr-rz{ position:absolute; z-index:6; }\n.wr-rz-n{ top:0; left:10px; right:10px; height:6px; cursor:ns-resize; }\n.wr-rz-s{ bottom:0; left:10px; right:10px; height:6px; cursor:ns-resize; }\n.wr-rz-e{ right:0; top:10px; bottom:10px; width:6px; cursor:ew-resize; }\n.wr-rz-w{ left:0; top:10px; bottom:10px; width:6px; cursor:ew-resize; }\n.wr-rz-ne{ top:0; right:0; width:14px; height:14px; cursor:nesw-resize; }\n.wr-rz-nw{ top:0; left:0; width:14px; height:14px; cursor:nwse-resize; }\n.wr-rz-se{ bottom:0; right:0; width:18px; height:18px; cursor:nwse-resize; }\n.wr-rz-sw{ bottom:0; left:0; width:14px; height:14px; cursor:nesw-resize; }\n.wr-rz-se::after{ content:''; position:absolute; right:3px; bottom:3px; width:8px; height:8px; border-right:2px solid #8a6a2f; border-bottom:2px solid #8a6a2f; opacity:.55; pointer-events:none; }\n.wr-titlebar{\n  flex:none; display:flex; align-items:center; gap:10px; cursor:move;\n  background:#2c2620; color:#e8ddc7; padding:9px 14px;\n  font-family:'Cinzel',serif; font-weight:700; letter-spacing:.06em; font-size:14px; text-transform:uppercase;\n}\n.wr-titlebar .sig{ color:#d9b45a; font-size:17px; }\n.wr-titlebar .spacer{ flex:1; }\n.wr-titlebar button{\n  font-family:'Cinzel',serif; font-weight:700; font-size:12px; letter-spacing:.05em;\n  background:transparent; color:#e8ddc7; border:1px solid #55493a; border-radius:3px;\n  padding:5px 11px; cursor:pointer; text-transform:uppercase;\n}\n.wr-titlebar button:hover{ background:#7c1f1a; border-color:#7c1f1a; }\n.wr-scroll{ overflow-y:auto; padding:0; }\n.wr-scroll .wrap{ max-width:100%; padding:0 22px 30px; }\n.wr-scroll header.masthead{ padding-top:20px; }\n";

  // ========== BODY HTML ==========
  var BODY_HTML = '<div class="wrap">\n\n  <header class="masthead">\n    <div class="crest">\n      <div class="sigil">⚔</div>\n      <div>\n        <h1>War Room</h1>\n        <div class="sub">Campaign planning for Tribal Wars — the table thinks, you command.</div>\n      </div>\n      <div class="launch" id="wrLaunch"></div>\n    </div>\n  </header>\n\n  <nav class="tabs" id="tabs">\n    <button data-tab="farm" class="active"><span class="n">01</span>Farm Run</button>\n    <button data-tab="attack"><span class="n">02</span>Attack</button>\n    <button data-tab="intel"><span class="n">03</span>Attacker Intel</button>\n    <button data-tab="timing"><span class="n">04</span>Attack Timing</button>\n    <button data-tab="build"><span class="n">05</span>Build Guide</button>\n    <button data-tab="data"><span class="n">06</span>World Data</button>\n    <button data-tab="settings"><span class="n">07</span>Settings</button>\n  </nav>\n\n  <!-- ============ 01 FARM RUN ============ -->\n  <section class="panel active" id="panel-farm">\n    <div class="panel-head">\n      <div class="eyebrow">Order of March</div>\n      <h2>Batch Farm Run</h2>\n      <p>Set your source and unit, paste your targets, and get the full order of march — every distance, travel time, and arrival laid out. You can manually fill the rally point or <strong>fill &amp; focus Attack</strong> so you send with one keypress.</p>\n    </div>\n\n    <div class="card">\n      <div class="grid g2">\n        <label class="fld"><span>Your village (X|Y)</span><input id="fSrc" class="mono" placeholder="500|500" value="500|500"></label>\n        <label class="fld"><span>Server offset (min)</span><input id="fOffset" class="mono" type="number" value="0" step="1"></label>\n      </div>\n      <div style="margin-top:16px;"><span style="display:block;font-family:\'Cinzel\',serif;font-size:12.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:8px;">Units to send</span>\n        <div class="grid g4" id="fUnitGrid"></div>\n      </div>\n      <div class="grid g2" style="margin-top:16px;">\n        <label class="fld"><span>World speed</span><input id="fWorld" class="mono" type="number" value="1.25" step="0.05" min="0.1"></label>\n        <label class="fld"><span>Unit speed</span><input id="fUnitSpd" class="mono" type="number" value="0.8" step="0.05" min="0.1"></label>\n      </div>\n      <div style="margin-top:16px;">\n        <span style="display:block;font-family:\'Cinzel\',serif;font-size:12.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:8px;">Target queue <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">— fill a target, it clears and the next moves up · hotkey to fill the next (default Q; change in Settings)</span></span>\n        <label class="fld" style="margin-bottom:10px;"><span>Bulk paste targets <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">— any format, one or many per line</span></span><textarea id="fBulk" rows="4" placeholder="475|605 477|608 472|606 ...  (paste as many as you like)"></textarea></label>\n        <div class="btn-row" style="margin-bottom:10px;"><button class="ghost" data-act="bulkadd">Build queue from paste</button><button class="ghost" data-act="sortdist">Sort nearest-first</button><button class="ghost" data-act="findbarbs">Find nearby barbs</button></div>\n        <div id="barbFinderOut"></div>\n        <div id="fTargetQueue"></div>\n        <div class="btn-row" style="margin-top:4px;">\n          <button class="ghost" data-act="addtarget">+ Add target</button>\n          <span id="fQueueCount" class="mono" style="font-size:12px;color:var(--ink-soft);align-self:center;"></span>\n        </div>\n      </div>\n      <div style="margin-top:16px;">\n        <span style="display:block;font-family:\'Cinzel\',serif;font-size:12.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:8px;">Raids in flight <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">— return timers, live. Cancel any you didn\'t actually send.</span></span>\n        <div id="raidBoard"></div>\n      </div>\n      <div class="btn-row" style="margin-top:14px;">\n        <button class="act" onclick="planSingle()">Show timing</button>\n        <button class="ghost" data-act="savefarm">Save farm run</button>\n        <button class="ghost" onclick="clearFarmUnits()">Clear troops</button>\n        <label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-soft);margin-left:4px;">\n          <input type="checkbox" id="fSendNow" checked style="width:auto;"> arrival if I send now\n        </label>\n      </div>\n      <div class="note" style="margin-top:14px;"><strong>Each target has its own Fill and Fill &amp; focus button.</strong> Fill loads that target into the game\'s attack form, then the box clears and the queue shifts up so the next is ready — fill, press Attack in-game, fill the next. <em>You press Attack — the tool never sends on its own. Timing uses the slowest unit in the mix. Save farm run remembers your troops and whole target list across restarts.</em></div>\n    </div>\n    <div id="farmOut"></div>\n  </section>\n\n  <!-- ============ 02 ATTACK ============ -->\n  <section class="panel" id="panel-attack">\n    <div class="panel-head">\n      <div class="eyebrow">Order of Battle</div>\n      <h2>Attack</h2>\n      <p>Eight independent attack forms — each with its own source, target, troops and speeds. Fill and fire one at a time (fill form 1 → press Attack in-game → fill form 2 → …). <strong>Fill only</strong> — you press Attack in the game yourself.</p>\n    </div>\n\n    <div id="attackForms"></div>\n  </section>\n\n  <!-- ============ 03 ATTACKER INTEL ============ -->\n  <section class="panel" id="panel-intel">\n    <div class="panel-head">\n      <div class="eyebrow">Know Thine Enemy</div>\n      <h2>Attacker Intel</h2>\n      <p>An incoming attack shows you a <strong>landing time</strong> but never the units. This reads the timing backwards to name the <strong>slowest unit that could anchor the attack</strong> — telling you whether a noble (village-taker) or siege could be inside, or whether it\'s just fast cavalry. Load World Data (tab 06) to also name the attacker.</p>\n    </div>\n\n    <div class="card" style="background:linear-gradient(180deg,#e9e0cb,#ddd0b2);">\n      <div class="eyebrow" style="margin-bottom:8px;">How to read an incoming attack — 3 steps</div>\n      <div class="step"><div class="num">1</div><div class="body"><div class="h">Open the incoming attack in-game</div><div class="why">Overview → Incomings, or the rally point. Note the <strong>origin coordinates</strong> (where it\'s coming from) and the <strong>arrival time</strong> (when it lands).</div></div></div>\n      <div class="step"><div class="num">2</div><div class="body"><div class="h">Paste it, or type the three values</div><div class="why">Fastest: copy the whole incoming row and paste it in the box below — coords and time are pulled out automatically. Or type origin, your coords, and arrival by hand.</div></div></div>\n      <div class="step"><div class="num">3</div><div class="body"><div class="h">Read the threat report</div><div class="why">You get the anchor unit, what could be hidden with it, distance, and a threat level. Scout in-game to confirm — no tool can see their exact troops.</div></div></div>\n    </div>\n\n    <div class="card">\n      <div id="intelStatus" class="note" style="margin-top:0;margin-bottom:14px;border-color:var(--good);background:rgba(63,107,63,.08);">Reading world settings…</div>\n\n      <div class="btn-row" style="margin-bottom:14px;"><button class="act" data-act="intel-auto" style="background:var(--iron);">⚡ Auto-read incomings from this page</button></div>\n      <div id="intelAutoOut"></div>\n\n      <label class="fld"><span>Paste the incoming attack row <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(easiest — pulls coords + time for you)</span></span>\n        <textarea id="iPaste" rows="3" placeholder="e.g.  Attack  EnemyPlayer (532|488)  →  Your Village (500|500)  arrival 18:35:12"></textarea>\n      </label>\n      <div class="btn-row"><button class="act" data-act="intel-paste">Analyse pasted attack</button></div>\n\n      <div style="text-align:center;margin:14px 0;font-family:\'Cinzel\';font-size:12px;color:var(--ink-soft);letter-spacing:.1em;">— OR TYPE IT —</div>\n\n      <div class="grid g2">\n        <label class="fld"><span>Origin — attacker\'s coords <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(from the incoming)</span></span><input id="iOrigin" class="mono" placeholder="532|488"></label>\n        <label class="fld"><span>Target — your coords <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto-filled)</span></span><input id="iTarget" class="mono" placeholder="500|500"></label>\n      </div>\n      <div class="grid g4" style="margin-top:14px;">\n        <label class="fld"><span>Arrival (server) <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">HH:MM:SS</span></span><input id="iArrive" class="mono" placeholder="18:35:12"></label>\n        <label class="fld"><span>World speed <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto)</span></span><input id="iWorld" class="mono" type="number" value="1.25" step="0.05" min="0.1"></label>\n        <label class="fld"><span>Unit speed <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto)</span></span><input id="iUnitSpd" class="mono" type="number" value="0.8" step="0.05" min="0.1"></label>\n        <label class="fld"><span>Clock offset (min) <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto)</span></span><input id="iOffset" class="mono" type="number" value="0" step="1"></label>\n      </div>\n      <div class="btn-row"><button class="act" data-act="intel-fields">Analyse attack</button></div>\n    </div>\n    <div id="intelOut"></div>\n  </section>\n\n  <!-- ============ 04 ATTACK TIMING ============ -->\n  <section class="panel" id="panel-timing">\n    <div class="panel-head">\n      <div class="eyebrow">The Hour of Arrival</div>\n      <h2>Attack Timing</h2>\n      <p>Work backwards from a <strong>landing time</strong> to know exactly when to click send — for every unit at once. This is how you time a snipe, land nobles back-to-back, or coordinate hits with allies to the second.</p>\n    </div>\n\n    <div class="card" style="background:linear-gradient(180deg,#e9e0cb,#ddd0b2);">\n      <div class="eyebrow" style="margin-bottom:8px;">Two ways to use this</div>\n      <div class="step"><div class="num">A</div><div class="body"><div class="h">When must I send to land at a set time?</div><div class="why">Enter your village, the target, and the <strong>desired arrival</strong> (server time). Get a send-time for each unit — send that unit at that clock time and it lands exactly when you wanted.</div></div></div>\n      <div class="step"><div class="num">B</div><div class="body"><div class="h">How long does each unit take on this route?</div><div class="why">Leave arrival blank and press <strong>Compare units</strong> — see the travel time of every unit between the two villages, fastest first.</div></div></div>\n    </div>\n\n    <div class="card">\n      <div id="timingStatus" class="note" style="margin-top:0;margin-bottom:14px;border-color:var(--good);background:rgba(63,107,63,.08);">Reading world settings…</div>\n\n      <div class="grid g2">\n        <label class="fld"><span>From — your village (X|Y) <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto-filled)</span></span><input id="tOrigin" class="mono" placeholder="500|500"></label>\n        <label class="fld"><span>To — target (X|Y)</span><input id="tTarget" class="mono" placeholder="505|505"></label>\n      </div>\n      <div class="grid g4" style="margin-top:14px;">\n        <label class="fld"><span>World speed <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto)</span></span><input id="tWorld" class="mono" type="number" value="1.25" step="0.05" min="0.1"></label>\n        <label class="fld"><span>Unit speed <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto)</span></span><input id="tUnitSpd" class="mono" type="number" value="0.8" step="0.05" min="0.1"></label>\n        <label class="fld"><span>Desired arrival (server) <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">HH:MM:SS — leave blank for B</span></span><input id="tArrive" class="mono" placeholder="20:00:00"></label>\n        <label class="fld"><span>Clock offset (min) <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(auto)</span></span><input id="tOffset" class="mono" type="number" value="0" step="1"></label>\n      </div>\n      <div class="btn-row">\n        <button class="act" onclick="sendTimeCalc()">When to send (A)</button>\n        <button class="act" onclick="compareAllUnits()">Compare travel times (B)</button>\n      </div>\n    </div>\n\n    <div class="card">\n      <div class="eyebrow" style="margin-bottom:8px;">Noble train — 4 nobles, back-to-back</div>\n      <p style="margin:0 0 12px;font-size:14px;color:var(--ink-soft);">To capture a village you land several nobles within a second or two of each other, behind a clearing nuke. Enter when the FIRST noble should land and the gap between them; get the send-time for each. Uses the From/To coords and speeds above.</p>\n      <div class="grid g4">\n        <label class="fld"><span>First noble lands (server) <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">HH:MM:SS</span></span><input id="ntArrive" class="mono" placeholder="20:00:00"></label>\n        <label class="fld"><span>Nobles <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(usually 4)</span></span><input id="ntCount" class="mono" type="number" value="4" min="1" max="20"></label>\n        <label class="fld"><span>Gap between (sec) <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">0.2–1</span></span><input id="ntGap" class="mono" type="number" value="0.5" step="0.1" min="0.1"></label>\n        <label class="fld"><span>Noble speed override <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(blank = use game)</span></span><input id="ntNobleSpd" class="mono" type="number" step="0.1" placeholder="35"></label>\n      </div>\n      <div class="btn-row"><button class="act" onclick="nobleTrain()">Build the train</button></div>\n    </div>\n\n    <div id="timingOut"></div>\n  </section>\n\n  <!-- ============ 04 BUILD GUIDE ============ -->\n  <section class="panel" id="panel-build">\n    <div class="panel-head">\n      <div class="eyebrow">From Foundation to Fortress</div>\n      <h2>Build Guide</h2>\n      <p>Pick offense or defense, then <strong>Read this village</strong> — the guide grabs the current village\'s real building levels, works out the stage, flags the single most important next build, computes the ordered next moves (buildings and troop production), and tracks growth since your last visit. Current village only — open the guide on each village\'s page for that village.</p>\n    </div>\n\n    <div class="card">\n      <label class="fld"><span>Village role</span>\n        <select id="bRole">\n          <option value="defense">Defensive village</option>\n          <option value="offense">Offensive village</option>\n        </select>\n      </label>\n      <div class="btn-row" style="margin-top:14px;">\n        <button class="act" data-act="readvillage">Read this village</button>\n        <button class="ghost" onclick="showBuildPlan()">Show generic guide</button>\n      </div>\n      <div class="hint">Building levels read best from the Headquarters screen. If they can\'t be read here, open this village\'s HQ and press Read again.</div>\n    </div>\n    <div id="buildOut"></div>\n  </section>\n\n  <!-- ============ 06 WORLD DATA ============ -->\n  <section class="panel" id="panel-data">\n    <div class="panel-head">\n      <div class="eyebrow">The King\'s Ledger</div>\n      <h2>World Data</h2>\n      <p>Load your world\'s <strong>public</strong> village and player lists so Attacker Intel can put a <strong>name</strong> to an incoming attack — who owns the origin village, their points, rank, and every village they hold. This is public data every player can download; loading it never touches your account.</p>\n    </div>\n\n    <div class="card" style="background:linear-gradient(180deg,#e9e0cb,#ddd0b2);">\n      <div class="eyebrow" style="margin-bottom:8px;">Where to get the files</div>\n      <div id="dataLinks" class="note" style="margin-top:0;border-color:var(--good);background:rgba(63,107,63,.08);">Detecting your world…</div>\n      <div class="step"><div class="num">1</div><div class="body"><div class="h">Open each link, select all, copy</div><div class="why">They open as plain text. Ctrl+A to select everything, Ctrl+C to copy. These are large — that\'s normal.</div></div></div>\n      <div class="step"><div class="num">2</div><div class="body"><div class="h">Paste into the matching box below</div><div class="why">village.txt → the villages box, player.txt → the players box, ally.txt (optional) → the allies box. Then press Load.</div></div></div>\n      <div class="step"><div class="num">3</div><div class="body"><div class="h">Go to Attacker Intel and analyse</div><div class="why">Now when you analyse an incoming, it names the owner of the origin village and lists all their villages.</div></div></div>\n    </div>\n\n    <div class="card">\n      <label class="fld">\n        <span>village.txt <span style="text-transform:none;letter-spacing:0;font-family:\'Spectral\';font-style:italic;font-weight:400;">— format: id;name;x;y;player_id;points;rank</span></span>\n        <textarea id="dVillages" rows="5" placeholder="1;Barbarian+village;500;500;0;26;9999\n2;Capital;503;497;42;9800;12"></textarea>\n      </label>\n      <label class="fld" style="margin-top:12px;">\n        <span>player.txt <span style="text-transform:none;letter-spacing:0;font-family:\'Spectral\';font-style:italic;font-weight:400;">— format: id;name;ally;villages;points;rank</span></span>\n        <textarea id="dPlayers" rows="4" placeholder="42;EnemyKing;5;12;98000;7"></textarea>\n      </label>\n      <label class="fld" style="margin-top:12px;">\n        <span>ally.txt <span style="text-transform:none;letter-spacing:0;font-family:\'Spectral\';font-style:italic;font-weight:400;">— optional, for tribe names: id;name;tag;members;villages;points;rank</span></span>\n        <textarea id="dAllies" rows="3" placeholder="5;The+Kingdom;TK;40;520;3200000;1"></textarea>\n      </label>\n      <div class="btn-row"><button class="act" onclick="loadWorldData()">Load into the ledger</button></div>\n      <div id="dataOut"></div>\n    </div>\n  </section>\n\n  <!-- ============ 07 SETTINGS ============ -->\n  <section class="panel" id="panel-settings">\n    <div class="panel-head">\n      <div class="eyebrow">Preferences</div>\n      <h2>Settings</h2>\n      <p>Set your defaults once and they apply everywhere, saved across restarts. Change the fill hotkey, set your world\'s speeds so every tab is pre-filled, and tune a few conveniences.</p>\n    </div>\n\n    <div class="card">\n      <div class="eyebrow" style="margin-bottom:10px;">Fill hotkey</div>\n      <label class="fld"><span>Key to fill the next farm target <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">— single letter; avoid game shortcuts</span></span>\n        <input id="setHotkey" class="mono" maxlength="1" placeholder="Q" style="max-width:70px;text-align:center;text-transform:uppercase;">\n      </label>\n      <div class="hint">Press this key (panel open, on the Farm tab, not typing in a box) to fill the next queued target. Still fill-only — you press Attack yourself.</div>\n    </div>\n\n    <div class="card">\n      <div class="eyebrow" style="margin-bottom:10px;">Default world speeds</div>\n      <p style="margin:0 0 12px;font-size:14px;color:var(--ink-soft);">These pre-fill the World/Unit speed boxes on every tab. The tool auto-detects them from the game when it can — set them here as a fallback, or to override.</p>\n      <div class="grid g2">\n        <label class="fld"><span>World speed</span><input id="setWorld" class="mono" type="number" step="0.05" min="0.1" placeholder="1.25"></label>\n        <label class="fld"><span>Unit speed</span><input id="setUnitSpd" class="mono" type="number" step="0.05" min="0.1" placeholder="0.8"></label>\n      </div>\n    </div>\n\n    <div class="card">\n      <div class="eyebrow" style="margin-bottom:10px;">Conveniences</div>\n      <label style="display:flex;align-items:center;gap:9px;font-size:14px;color:var(--ink-soft);margin-bottom:10px;">\n        <input type="checkbox" id="setAutoRaid" style="width:auto;"> Start a return timer automatically when I fill a target\n      </label>\n      <label style="display:flex;align-items:center;gap:9px;font-size:14px;color:var(--ink-soft);margin-bottom:10px;">\n        <input type="checkbox" id="setOpenLast" style="width:auto;"> Reopen the last tab I used when the panel opens\n      </label>\n      <label style="display:flex;align-items:center;gap:9px;font-size:14px;color:var(--ink-soft);">\n        <input type="checkbox" id="setWrap" style="width:auto;"> My world wraps at the map edges (rare — only enable if you know it does)\n      </label>\n      <label class="fld" style="margin-top:10px;max-width:200px;"><span>Map size <span style="text-transform:none;letter-spacing:0;font-style:italic;font-weight:400;">(for wrap; usually 1000)</span></span><input id="setMapSize" class="mono" type="number" step="1" min="100" placeholder="1000"></label>\n    </div>\n\n    <div class="card">\n      <div class="eyebrow" style="margin-bottom:10px;">Backup &amp; restore</div>\n      <p style="margin:0 0 12px;font-size:14px;color:var(--ink-soft);">Export everything (settings, farm queue, attack forms, world data) as text you can save or share. Import replaces your current setup with a pasted backup.</p>\n      <div class="btn-row"><button class="ghost" data-act="export-file">Download backup file</button><label class="ghost" style="cursor:pointer;display:inline-flex;align-items:center;" for="cfgFile">Import from file</label><input type="file" id="cfgFile" accept=".json,application/json" style="display:none;"></div>\n      <details style="margin-top:10px;"><summary style="cursor:pointer;font-size:13px;color:var(--ink-soft);">Or use copy/paste text (for small backups)</summary>\n        <div class="btn-row" style="margin-top:8px;"><button class="ghost" data-act="export-config">Export to text box</button><button class="ghost" data-act="import-config">Import from text box</button></div>\n        <textarea id="cfgIO" rows="4" placeholder="Exported backup appears here — or paste one to import" style="margin-top:8px;font-family:monospace;font-size:11px;"></textarea>\n      </details>\n      <div id="cfgIOOut"></div>\n    </div>\n\n    <div class="card">\n      <div class="btn-row"><button class="act" data-act="save-settings">Save settings</button><button class="ghost" data-act="reset-settings">Reset to defaults</button></div>\n      <div id="settingsOut"></div>\n    </div>\n  </section>\n\n  <footer>\n    A planning table for Tribal Wars. Every figure comes from data you enter or from the game\'s public exports.\n    <div class="safe">THE TOOL FILLS AND AIMS · YOU PRESS ENTER, YOU COMMAND · USE RESPONSIBLY</div>\n  </footer>\n</div>';

  // ---- host + shadow root ----
  var host = document.createElement('div');
  host.id = 'wr-host';
  document.body.appendChild(host);
  var root = host.attachShadow({mode:'open'});

  var st = document.createElement('style');
  st.textContent = ORIG_CSS + '\n' + CHROME_CSS;
  root.appendChild(st);

  var launch = document.createElement('button');
  launch.className = 'wr-launch';
  launch.title = 'Click to open · drag to move';
  launch.innerHTML = '<span class="s">\u2694</span> War Room';
  root.appendChild(launch);

  var overlay = document.createElement('div');
  overlay.className = 'wr-overlay';
  root.appendChild(overlay);

  var panel = document.createElement('div');
  panel.className = 'wr-panel';
  panel.innerHTML =
    '<div class="wr-titlebar">'
    + '<span class="sig">\u2694</span> War Room'
    + '<span class="spacer"></span>'
    + '<button data-act="grab" title="Read your current village coordinates from the game">Grab my coords</button>'
    + '<button data-act="close">Close \u2715</button>'
    + '</div>'
    + '<div class="wr-scroll">' + BODY_HTML + '</div>';
  root.appendChild(panel);

  // resize handles (4 edges + 4 corners)
  ['n','s','e','w','ne','nw','se','sw'].forEach(function(dir){
    var h=document.createElement('div');
    h.className='wr-rz wr-rz-'+dir;
    h.setAttribute('data-rz', dir);
    panel.appendChild(h);
  });

  // ---- shadow-aware element lookup ----
  function getById(id){ return root.getElementById ? root.getElementById(id) : root.querySelector('#'+id); }

  function openPanel(){ if(panel._restoreBox) panel._restoreBox(); panel.classList.add('open'); overlay.classList.add('open'); try{ if(typeof renderRaids==='function') renderRaids(); }catch(e){} }
  function closePanel(){
    panel.classList.remove('open'); overlay.classList.remove('open');
    // stop the live raid ticker while closed — no point updating an invisible board.
    // it restarts on open via renderRaids(). raid data itself is persisted, so nothing is lost.
    if(typeof _raidTick!=='undefined' && _raidTick){ clearInterval(_raidTick); _raidTick=null; }
  }

  // ---- draggable launcher button (drag to reposition; plain click still opens) ----
  var LAUNCH_POS_KEY='wr_launch_pos';
  (function(){
    var down=false, moved=false, sx=0, sy=0, ox=0, oy=0;
    var DRAG_THRESHOLD=4; // px of movement before it counts as a drag, not a click

    function applyPos(left, top){
      // clamp so it can never be dragged fully off-screen
      var w=launch.offsetWidth||120, h=launch.offsetHeight||40;
      left=Math.max(0, Math.min(left, window.innerWidth  - w));
      top =Math.max(0, Math.min(top,  window.innerHeight - h));
      launch.style.left=left+'px';
      launch.style.top =top+'px';
      launch.style.right='auto';
      launch.style.bottom='auto';
    }

    launch.addEventListener('mousedown', function(e){
      if(e.button!==0) return;
      down=true; moved=false;
      var r=launch.getBoundingClientRect();
      // switch from right/bottom anchoring to left/top so we can move freely
      ox=r.left; oy=r.top; sx=e.clientX; sy=e.clientY;
      launch.style.left=r.left+'px'; launch.style.top=r.top+'px';
      launch.style.right='auto'; launch.style.bottom='auto';
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){
      if(!down) return;
      var dx=e.clientX-sx, dy=e.clientY-sy;
      if(!moved && (Math.abs(dx)>DRAG_THRESHOLD || Math.abs(dy)>DRAG_THRESHOLD)) moved=true;
      if(moved) applyPos(ox+dx, oy+dy);
    });
    window.addEventListener('mouseup', function(e){
      if(!down) return;
      down=false;
      if(moved){
        // save the new position so it stays where you put it across reloads
        var r=launch.getBoundingClientRect();
        try { storeSet(LAUNCH_POS_KEY, JSON.stringify({left:Math.round(r.left), top:Math.round(r.top)})); } catch(err){}
      } else {
        // no real drag → treat as a click → open the panel
        openPanel();
      }
    });

    // keep it on-screen if the window is resized smaller
    window.addEventListener('resize', function(){
      if(launch.style.left){
        var r=launch.getBoundingClientRect();
        applyPos(r.left, r.top);
      }
    });

    // expose a restore helper used by the late init block (after storeGet is defined)
    launch._restorePos=function(){
      try {
        var raw=storeGet(LAUNCH_POS_KEY);
        if(!raw) return;
        var p=JSON.parse(raw);
        if(p && typeof p.left==='number' && typeof p.top==='number') applyPos(p.left, p.top);
      } catch(err){}
    };
  })();

  overlay.addEventListener('click', closePanel);
  panel.querySelector('[data-act="close"]').addEventListener('click', closePanel);

  // drag
  (function(){
    var bar = panel.querySelector('.wr-titlebar'), down=false, sx=0, sy=0, ox=0, oy=0;
    bar.addEventListener('mousedown', function(e){
      if(e.target.tagName==='BUTTON') return;
      down=true; var r=panel.getBoundingClientRect();
      panel.style.transform='none'; panel.style.left=r.left+'px'; panel.style.top=r.top+'px';
      sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top; e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){ if(!down) return;
      panel.style.left=(ox+e.clientX-sx)+'px'; panel.style.top=(oy+e.clientY-sy)+'px'; });
    window.addEventListener('mouseup', function(){ if(down){ down=false; savePanelBox(); } });
  })();

  // ---- resize the panel by dragging any edge or corner ----
  var PANEL_BOX_KEY='wr_panel_box';
  function savePanelBox(){
    try {
      var r=panel.getBoundingClientRect();
      storeSet(PANEL_BOX_KEY, JSON.stringify({left:Math.round(r.left),top:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)}));
    } catch(e){}
  }
  (function(){
    var MINW=340, MINH=220;
    var active=null, sx=0, sy=0, startL=0, startT=0, startW=0, startH=0;

    panel.querySelectorAll('[data-rz]').forEach(function(handle){
      handle.addEventListener('mousedown', function(e){
        active=handle.getAttribute('data-rz');
        var r=panel.getBoundingClientRect();
        // switch to concrete left/top/width/height (drop the centering transform)
        panel.style.transform='none';
        panel.style.left=r.left+'px'; panel.style.top=r.top+'px';
        panel.style.width=r.width+'px'; panel.style.height=r.height+'px';
        panel.style.maxHeight='none';
        sx=e.clientX; sy=e.clientY;
        startL=r.left; startT=r.top; startW=r.width; startH=r.height;
        e.preventDefault(); e.stopPropagation();
      });
    });

    window.addEventListener('mousemove', function(e){
      if(!active) return;
      var dx=e.clientX-sx, dy=e.clientY-sy;
      var L=startL, T=startT, W=startW, H=startH;

      if(active.indexOf('e')>=0){ W=startW+dx; }
      if(active.indexOf('s')>=0){ H=startH+dy; }
      if(active.indexOf('w')>=0){ W=startW-dx; L=startL+dx; }
      if(active.indexOf('n')>=0){ H=startH-dy; T=startT+dy; }

      // clamp to minimums (and keep the left/top edge from overshooting when shrinking)
      if(W<MINW){ if(active.indexOf('w')>=0) L=startL+(startW-MINW); W=MINW; }
      if(H<MINH){ if(active.indexOf('n')>=0) T=startT+(startH-MINH); H=MINH; }
      // keep within viewport
      if(L<0){ W+=L; L=0; }
      if(T<0){ H+=T; T=0; }
      if(L+W>window.innerWidth)  W=window.innerWidth - L;
      if(T+H>window.innerHeight) H=window.innerHeight - T;

      panel.style.left=L+'px'; panel.style.top=T+'px';
      panel.style.width=W+'px'; panel.style.height=H+'px';
    });
    window.addEventListener('mouseup', function(){ if(active){ active=null; savePanelBox(); } });

    // restore saved size/position when the panel opens
    panel._restoreBox=function(){
      try {
        var raw=storeGet(PANEL_BOX_KEY); if(!raw) return;
        var b=JSON.parse(raw); if(!b) return;
        panel.style.transform='none'; panel.style.maxHeight='none';
        if(typeof b.left==='number') panel.style.left=Math.max(0,Math.min(b.left, window.innerWidth-200))+'px';
        if(typeof b.top==='number')  panel.style.top =Math.max(0,Math.min(b.top,  window.innerHeight-100))+'px';
        if(typeof b.w==='number')    panel.style.width =Math.max(MINW, Math.min(b.w, window.innerWidth))+'px';
        if(typeof b.h==='number')    panel.style.height=Math.max(MINH, Math.min(b.h, window.innerHeight))+'px';
      } catch(e){}
    };
  })();

  // grab coords
  function readVillageCoords(){
    // 1) game_data — works when the userscript shares the page context
    try { if (window.game_data && game_data.village && game_data.village.coord) return game_data.village.coord; } catch(e){}
    // 2) unsafeWindow — some managers sandbox the script; game_data lives on the real window
    try { if (typeof unsafeWindow!=='undefined' && unsafeWindow.game_data && unsafeWindow.game_data.village && unsafeWindow.game_data.village.coord) return unsafeWindow.game_data.village.coord; } catch(e){}
    // 3) the coordinate link in the top bar / overview, e.g. href="...&x=474&y=608" or text "474|608"
    try {
      var link = document.querySelector('a[href*="screen=info_village"], #menu_row2 a[href*="&x="], a[href*="&x="][href*="&y="]');
      if(link){
        var hx = link.href.match(/[?&]x=(\d{1,3})/), hy = link.href.match(/[?&]y=(\d{1,3})/);
        if(hx && hy) return hx[1]+'|'+hy[1];
        var lt = (link.textContent||'').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
        if(lt) return lt[1]+'|'+lt[2];
      }
    } catch(e){}
    // 4) the village-name header often reads "Village (474|608)"
    try {
      var head = document.querySelector('#menu_row2, .village-name, h2, .maincell');
      if(head){ var hm = head.textContent.match(/(\d{1,3})\s*\|\s*(\d{1,3})/); if(hm) return hm[1]+'|'+hm[2]; }
    } catch(e){}
    // 5) last resort: first parenthesised pair anywhere on the page
    var m = document.body.innerText.match(/\((\d{1,3})\|(\d{1,3})\)/);
    return m ? (m[1]+'|'+m[2]) : null;
  }
  panel.querySelector('[data-act="grab"]').addEventListener('click', function(){
    var c = readVillageCoords();
    if(!c){ alert('Could not read your village coordinates from this page. Open your village overview or rally point and try again \u2014 or just type them in.'); return; }
    var fSrc=getById('fSrc'), tOrigin=getById('tOrigin');
    if(fSrc) fSrc.value=c; if(tOrigin) tOrigin.value=c;
    for(var gi=1; gi<=(typeof ATTACK_FORMS!=='undefined'?ATTACK_FORMS:8); gi++){
      var aEl=getById('a'+gi+'_src'); if(aEl) aEl.value=c;
    }
    var gb=panel.querySelector('[data-act="grab"]'), old=gb.textContent;
    gb.textContent='Got '+c; setTimeout(function(){ gb.textContent=old; }, 1800);
  });

  // ---- world/account detection (works on ANY world) ----
  function getGameData(){
    try { if(window.game_data) return window.game_data; } catch(e){}
    try { if(typeof unsafeWindow!=='undefined' && unsafeWindow.game_data) return unsafeWindow.game_data; } catch(e){}
    return null;
  }
  // world speed & unit speed from game config if the page exposes it, else null
  function getWorldSpeeds(){
    var gd=getGameData();
    var speed=null, unitSpeed=null;
    try {
      // TW exposes config in a few shapes depending on world/version
      var cfg = (gd && gd.config) || null;
      if(cfg){
        if(cfg.speed!=null) speed=+cfg.speed;
        if(cfg.unit_speed!=null) unitSpeed=+cfg.unit_speed;
      }
      var w = window.TribalWars && window.TribalWars.getGameData ? window.TribalWars.getGameData() : null;
      if(w && w.config){ if(speed==null && w.config.speed!=null) speed=+w.config.speed; if(unitSpeed==null && w.config.unit_speed!=null) unitSpeed=+w.config.unit_speed; }
    } catch(e){}
    return { speed:speed, unitSpeed:unitSpeed };
  }

  // build the "My Village" link for whatever world/village we're actually on
  function buildLaunchLinks(){
    var box=getById('wrLaunch'); if(!box) return;
    var gd=getGameData();
    var links='';
    // link to the current village overview on THIS host, if we can identify it
    try {
      var host=location.host; // whatever world/domain the player is actually on
      var vid = gd && gd.village ? gd.village.id : null;
      if(host && vid){
        links+='<a href="'+location.protocol+'//'+host+'/game.php?village='+vid+'&screen=overview" target="_blank" rel="noopener">My Village <span class="arw">↗</span></a>';
      }
      // link to the world's map export page (public data) — useful, world-agnostic
      if(host){
        links+='<a href="'+location.protocol+'//'+host+'/map/village.txt" target="_blank" rel="noopener">Map data <span class="arw">↗</span></a>';
      }
    } catch(e){}
    box.innerHTML=links;
  }

  // auto-fill world/unit speed fields from the detected world (leaves user free to override)
  function applyWorldSpeeds(){
    var s=getWorldSpeeds();
    // user's saved defaults override auto-detect when they've set them
    var wSpeed = (WR_SETTINGS.worldSpeed!=null) ? WR_SETTINGS.worldSpeed : s.speed;
    var uSpeed = (WR_SETTINGS.unitSpeed!=null) ? WR_SETTINGS.unitSpeed : s.unitSpeed;
    if(wSpeed==null && uSpeed==null) return;
    var worldFields=['fWorld','iWorld','tWorld','a1_world','a2_world','a3_world','a4_world','a5_world','a6_world','a7_world','a8_world'];
    var unitFields =['fUnitSpd','iUnitSpd','tUnitSpd','a1_unitspd','a2_unitspd','a3_unitspd','a4_unitspd','a5_unitspd','a6_unitspd','a7_unitspd','a8_unitspd'];
    if(wSpeed!=null) worldFields.forEach(function(id){ var el=getById(id); if(el) el.value=wSpeed; });
    if(uSpeed!=null) unitFields.forEach(function(id){ var el=getById(id); if(el) el.value=uSpeed; });
  }

  // ---- server time (world-agnostic): read the live clock from TW's top bar ----
  // Returns a Date representing the current SERVER time, or null if unreadable.
  function getServerTime(){
    // 1) TW's Timing module, if present
    try {
      var T = window.Timing || (typeof unsafeWindow!=='undefined' ? unsafeWindow.Timing : null);
      if(T && typeof T.getCurrentServerTime==='function'){
        var ms=T.getCurrentServerTime();
        if(ms) return new Date(ms);
      }
    } catch(e){}
    // 2) the #serverTime / #serverDate elements in the header
    try {
      var st=document.getElementById('serverTime');
      var sd=document.getElementById('serverDate');
      if(st){
        var tm=(st.textContent||'').match(/(\d{1,2}):(\d{2}):(\d{2})/);
        if(tm){
          var d=new Date();
          // try to parse the date too (formats vary: dd/mm/yyyy, dd.mm.yyyy, etc.)
          if(sd){
            var dm=(sd.textContent||'').match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
            if(dm){
              var yr=+dm[3]; if(yr<100) yr+=2000;
              // assume dd/mm/yyyy (TW default outside US)
              d=new Date(yr, (+dm[2])-1, +dm[1]);
            }
          }
          d.setHours(+tm[1], +tm[2], +tm[3], 0);
          return d;
        }
      }
    } catch(e){}
    return null;
  }

  // difference (minutes) between server time and this device's local clock.
  // positive = server is ahead of local. null if server time unreadable.
  function getServerOffsetMinutes(){
    var srv=getServerTime();
    if(!srv) return null;
    return Math.round((srv.getTime() - Date.now())/60000);
  }

  // format a Date as HH:MM:SS
  function hmsClock(d){ var p=function(n){return String(n).padStart(2,'0');}; return p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }

  // ---- environment capability check ----
  // Runs once on startup. Detects what the tool can actually see on this world/setup,
  // so features can degrade gracefully with a clear explanation instead of silent failure.
  function checkEnvironment(){
    var gd=getGameData();
    var caps={
      gameData: !!gd,
      village: !!(gd && gd.village),
      coords: !!readVillageCoords(),
      serverClock: !!getServerTime(),
      speeds: (function(){ var s=getWorldSpeeds(); return s.speed!=null || s.unitSpeed!=null; })(),
      sandboxed: false
    };
    // detect a likely sandbox: window.game_data missing but the page clearly is TW
    // (has the tw markers) — means the script manager is isolating page globals.
    try {
      if(!window.game_data && document.querySelector('#serverTime, #menu_row, .maincell, [id^="game"]')) caps.sandboxed=true;
    } catch(e){}
    return caps;
  }

  // build a human-readable banner about environment problems, or null if all is well
  function environmentBanner(caps){
    if(caps.gameData && caps.village) return null; // healthy
    var msg;
    if(caps.sandboxed){
      msg='<strong>The tool can\'t read the game\'s data on this setup.</strong> Your script manager is likely sandboxing the page (isolating game_data). Try: in Tampermonkey, make sure the script\'s <span class="mono">@grant</span> is set so it can reach the page — or switch to running it with <span class="mono">@grant none</span>. Manual features (typing coords, timing math) still work; auto-read features (village stats, incomings) need page access.';
    } else if(!caps.gameData){
      msg='<strong>Game data not detected on this page.</strong> Open any normal in-game screen (Overview, HQ, rally point) — the tool reads the game from there. If you\'re on a login or map-only page, auto-read features won\'t have anything to read yet.';
    } else {
      msg='<strong>Partial game data.</strong> Some village details aren\'t exposed on this screen. Auto-read features may be limited here; open the Headquarters or Overview screen for the fullest read.';
    }
    return msg;
  }

  // ======== APP LOGIC ========
  const GAME = {"units":{"spear":{"label":"Spear Fighter","wood":50,"clay":30,"iron":10,"pop":1,"attack":10,"def_general":15,"def_cavalry":45,"def_archer":20,"speed":18,"haul":25},"sword":{"label":"Swordsman","wood":30,"clay":30,"iron":70,"pop":1,"attack":25,"def_general":50,"def_cavalry":15,"def_archer":40,"speed":22,"haul":15},"axe":{"label":"Axeman","wood":60,"clay":30,"iron":40,"pop":1,"attack":40,"def_general":10,"def_cavalry":5,"def_archer":10,"speed":18,"haul":10},"archer":{"label":"Archer","wood":100,"clay":30,"iron":60,"pop":1,"attack":15,"def_general":50,"def_cavalry":40,"def_archer":5,"speed":18,"haul":10},"scout":{"label":"Scout","wood":50,"clay":50,"iron":20,"pop":2,"attack":0,"def_general":2,"def_cavalry":1,"def_archer":2,"speed":9,"haul":0},"light_cavalry":{"label":"Light Cavalry","wood":125,"clay":100,"iron":250,"pop":4,"attack":130,"def_general":30,"def_cavalry":40,"def_archer":30,"speed":10,"haul":80},"mounted_archer":{"label":"Mounted Archer","wood":250,"clay":100,"iron":150,"pop":5,"attack":120,"def_general":40,"def_cavalry":30,"def_archer":50,"speed":10,"haul":50},"heavy_cavalry":{"label":"Heavy Cavalry","wood":200,"clay":150,"iron":600,"pop":6,"attack":150,"def_general":200,"def_cavalry":80,"def_archer":180,"speed":11,"haul":50},"ram":{"label":"Ram","wood":300,"clay":200,"iron":200,"pop":5,"attack":2,"def_general":20,"def_cavalry":50,"def_archer":20,"speed":30,"haul":0},"catapult":{"label":"Catapult","wood":320,"clay":400,"iron":100,"pop":8,"attack":100,"def_general":100,"def_cavalry":50,"def_archer":100,"speed":30,"haul":0},"paladin":{"label":"Paladin","wood":20,"clay":20,"iron":40,"pop":10,"attack":150,"def_general":250,"def_cavalry":400,"def_archer":150,"speed":10,"haul":100},"noble":{"label":"Nobleman","wood":40000,"clay":50000,"iron":50000,"pop":100,"attack":30,"def_general":100,"def_cavalry":50,"def_archer":100,"speed":35,"haul":0}},"unit_order":["spear","sword","axe","archer","scout","light_cavalry","mounted_archer","heavy_cavalry","ram","catapult","noble"],"building_prereqs":{"headquarters":{},"barracks":{"headquarters":3},"smithy":{"headquarters":5,"barracks":1},"stable":{"headquarters":10,"barracks":5,"smithy":5},"workshop":{"headquarters":10,"smithy":10},"academy":{"headquarters":20,"smithy":20,"market":10},"market":{"headquarters":3,"warehouse":2},"wall":{"barracks":1},"warehouse":{},"farm":{},"timber_camp":{},"clay_pit":{},"iron_mine":{},"rally_point":{},"hiding_place":{},"statue":{},"watchtower":{"smithy":2}},"building_max":{"headquarters":30,"barracks":25,"smithy":20,"stable":20,"workshop":15,"academy":1,"market":25,"wall":20,"warehouse":30,"farm":30,"timber_camp":30,"clay_pit":30,"iron_mine":30,"rally_point":1,"hiding_place":10,"statue":1,"watchtower":30},"building_order":["headquarters","barracks","smithy","stable","workshop","academy","market","wall","warehouse","farm","timber_camp","clay_pit","iron_mine","rally_point","hiding_place","statue","watchtower"],"building_labels":{"headquarters":"Headquarters","barracks":"Barracks","smithy":"Smithy","stable":"Stable","workshop":"Workshop","academy":"Academy","market":"Market","wall":"Wall","warehouse":"Warehouse","farm":"Farm","timber_camp":"Timber Camp","clay_pit":"Clay Pit","iron_mine":"Iron Mine","rally_point":"Rally Point","hiding_place":"Hiding Place","statue":"Statue","watchtower":"Watchtower"},"noble_req":{"min_headquarters":20,"min_smithy":20,"min_market":10,"min_academy":1,"farm_space_needed":100,"coin_cost":{"wood":28000,"clay":30000,"iron":25000},"noble_cost":{"wood":40000,"clay":50000,"iron":50000}}};
  const UNITS = GAME.units;
  const UNIT_ORDER = GAME.unit_order;

  // your internal unit key -> Tribal Wars rally-point unit code
  const TW_UNIT_CODE = {
    spear:'spear', sword:'sword', axe:'axe', archer:'archer',
    scout:'spy', light_cavalry:'light', mounted_archer:'marcher',
    heavy_cavalry:'heavy', ram:'ram', catapult:'catapult', noble:'snob'
  };

  /* -------- core formulas -------- */
  function distance(x1,y1,x2,y2){
    var dx=Math.abs(x2-x1), dy=Math.abs(y2-y1);
    // Optional world wrap: on some TW worlds the map wraps at the edges, so the true
    // distance across a border can be shorter than the straight-line one. Off by default
    // (most worlds don't wrap); enabled with a map size in Settings.
    try {
      if(typeof WR_SETTINGS!=='undefined' && WR_SETTINGS.wrap && WR_SETTINGS.mapSize>0){
        var sz=WR_SETTINGS.mapSize;
        dx=Math.min(dx, sz-dx);
        dy=Math.min(dy, sz-dy);
      }
    } catch(e){}
    return Math.sqrt(dx*dx + dy*dy);
  }
  function travelMinutes(dist,unitKey,worldSpeed=1,unitSpeed=1){
    if(worldSpeed<=0||unitSpeed<=0) throw new Error("speeds must be positive");
    return UNITS[unitKey].speed * dist / (worldSpeed*unitSpeed);
  }
  function fmtDur(totalMin){
    let s=Math.max(0,Math.round(totalMin*60));
    const h=Math.floor(s/3600); s-=h*3600;
    const m=Math.floor(s/60); s-=m*60;
    const p=n=>String(n).padStart(2,'0');
    return `${p(h)}:${p(m)}:${p(s)}`;
  }
  function addMinutes(date,min){return new Date(date.getTime()+min*60000);}
  function hms(date){const p=n=>String(n).padStart(2,'0');return `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;}

  /* -------- parse arrival with offset -------- */
  function parseArrival(str, offsetMinutes=0, base=new Date(), mode='future'){
    const m=String(str).match(/\b(\d{1,2}):([0-5]?\d):([0-5]?\d)\b/);
    if(!m) return null;
    const h=+m[1],mi=+m[2],se=+m[3];
    if(h>23||mi>59||se>59) return null;
    const serverNow = new Date(base.getTime() + offsetMinutes*60000);
    const d = new Date(serverNow);
    d.setHours(h,mi,se,0);
    if(mode==='nearest'){
      // pick the occurrence (yesterday/today/tomorrow) closest to now — for reading an
      // incoming attack's arrival, which is near the present. Fixes the midnight case where
      // 23:55 typed at 00:02 means "5 min ago", not "23.9h from now".
      var cand=[new Date(d), new Date(d), new Date(d)];
      cand[0].setDate(cand[0].getDate()-1);
      cand[2].setDate(cand[2].getDate()+1);
      var best=cand[0], bestDiff=Math.abs(cand[0]-serverNow);
      for(var i=1;i<cand.length;i++){ var df=Math.abs(cand[i]-serverNow); if(df<bestDiff){ best=cand[i]; bestDiff=df; } }
      return best;
    }
    // default 'future': the next time this clock time occurs at or after now — for planning a
    // send toward a desired arrival. Only rolls a full day when the time is already past.
    if(d < serverNow) d.setDate(d.getDate()+1);
    return d;
  }

  // ---------- Form fill helpers ----------
    function setVal(el,v){
    const proto=Object.getPrototypeOf(el);
    const desc=Object.getOwnPropertyDescriptor(proto,'value');
    if(desc&&desc.set) desc.set.call(el,v); else el.value=v;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  /* =====================================================================
     01 — FARM RUN (one box per unit, fill any mix)
     ===================================================================== */

  // read every farm unit box → [{unit, code, count}, ...] for boxes with count > 0
  function readFarmUnits(){
    const list=[];
    UNIT_ORDER.forEach(function(u){
      const el=getById('fUnit_'+u); if(!el) return;
      const n=parseInt(el.value)||0;
      if(n>0) list.push({unit:u, code:TW_UNIT_CODE[u], count:n});
    });
    return list;
  }
  function clearFarmUnits(){
    // confirm only if there's something to lose
    var hasTroops=UNIT_ORDER.some(function(u){ var el=getById('fUnit_'+u); return el && (el.value||'').trim()!==''; });
    if(hasTroops && !confirm('Clear all troop counts in the Farm tab? This cannot be undone.')) return;
    UNIT_ORDER.forEach(function(u){ const el=getById('fUnit_'+u); if(el) el.value=''; });
    const out=getById('farmOut'); if(out) out.innerHTML='';
    persistFarmQueue();
  }

  /* -------- Farm target queue -------- */
  const FARM_MAX_TARGETS = 500;
  // the queue is just the set of target input rows in #fTargetQueue, read live from the DOM

  function farmQueueRows(){
    const host=getById('fTargetQueue'); if(!host) return [];
    return Array.prototype.slice.call(host.querySelectorAll('input.fq-target'));
  }
  function updateFarmQueueCount(){
    const c=getById('fQueueCount'); if(!c) return;
    const n=farmQueueRows().length;
    c.textContent=n+' / '+FARM_MAX_TARGETS+' targets';
  }

  // Auto-persist the whole farm run (troops + live target list) to disk. Called on
  // EVERY change so a page navigation (e.g. pressing Enter to send) can never wipe
  // the queue — it rebuilds from disk on the next load. Guard prevents saving
  // before the queue has been built during initial load.
  var farmReady=false;
  function persistFarmQueue(){
    if(!farmReady) return;
    var data={ units:{}, targets:[] };
    UNIT_ORDER.forEach(function(u){
      var el=getById('fUnit_'+u);
      if(el && el.value!=='') data.units[u]=el.value;
    });
    farmQueueRows().forEach(function(inp){
      var v=(inp.value||'').trim();
      if(v!=='') data.targets.push(v);
    });
    try { storeSet(farmKey(), JSON.stringify(data)); } catch(e){}
  }

  // debounced version for keystroke events — avoids a disk write on every character.
  // Button actions (fill, delete, sort) still call persistFarmQueue() directly for
  // an immediate save, since those are deliberate and infrequent.
  var _persistTimer=null;
  function persistFarmQueueDebounced(){
    if(_persistTimer) clearTimeout(_persistTimer);
    _persistTimer=setTimeout(function(){ _persistTimer=null; persistFarmQueue(); }, 350);
  }
  // flush any pending debounced save immediately — used on page unload so the last
  // keystroke isn't lost if you close the tab or click a link within the debounce window.
  function flushPendingPersist(){
    if(_persistTimer){ clearTimeout(_persistTimer); _persistTimer=null; persistFarmQueue(); }
  }

  // add one empty target row (optionally pre-filled), up to the max
  function addFarmTarget(value){
    const host=getById('fTargetQueue'); if(!host) return;
    if(farmQueueRows().length >= FARM_MAX_TARGETS) return;

    const row=document.createElement('div');
    row.className='fq-row';
    row.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:8px;';
    row.innerHTML=
      '<input class="mono fq-target" placeholder="474|608" style="flex:1;" value="'+(value?esc(value):'')+'">'+
      '<button class="act fq-fill" style="padding:9px 14px;">Fill</button>'+
      '<button class="act fq-focus" style="padding:9px 14px;background:var(--crit);border-color:#3a1a1a;">Fill &amp; focus</button>'+
      '<button class="ghost fq-del" title="Remove this target" style="padding:9px 12px;">✕</button>';
    host.appendChild(row);

    row.querySelector('.fq-fill').addEventListener('click', function(){ fillFarmTarget(row, false); });
    row.querySelector('.fq-focus').addEventListener('click', function(){ fillFarmTarget(row, true); });
    row.querySelector('.fq-del').addEventListener('click', function(){ row.remove(); ensureFarmQueueNotEmpty(); updateFarmQueueCount(); persistFarmQueue(); });
    // save on every keystroke in a target box so edits survive navigation too
    row.querySelector('.fq-target').addEventListener('input', persistFarmQueueDebounced);

    updateFarmQueueCount();
    persistFarmQueue();
  }
  // never leave the queue completely empty — keep one blank row to type into
  function ensureFarmQueueNotEmpty(){
    if(farmQueueRows().length===0) addFarmTarget('');
  }

  // paste many coords at once → build the whole queue (any separators: spaces, commas, newlines)
  function bulkAddTargets(){
    var box=getById('fBulk');
    var raw=box?box.value:'';
    var pairs=[...raw.matchAll(/(\d{1,3})\s*\|\s*(\d{1,3})/g)].map(function(m){ return m[1]+'|'+m[2]; });
    var out=getById('farmOut');
    if(!pairs.length){ if(out) out.innerHTML='<div class="err">No X|Y coordinates found in the paste. Format like 475|605 — spaces, commas, or new lines between them all work.</div>'; return; }
    // de-duplicate, preserve order
    var seen={}, uniq=[];
    pairs.forEach(function(p){ if(!seen[p]){ seen[p]=1; uniq.push(p); } });
    // if there's already a meaningful queue, confirm before replacing it
    var existingCount=farmQueueRows().filter(function(i){ return (i.value||'').trim()!==''; }).length;
    if(existingCount>=3 && !confirm('Replace the current queue of '+existingCount+' targets with '+uniq.length+' pasted ones?')) return;
    // clear existing rows, then add all (up to the cap)
    var host=getById('fTargetQueue'); if(host) host.innerHTML='';
    var added=0;
    uniq.forEach(function(p){ if(added<FARM_MAX_TARGETS){ addFarmTarget(p); added++; } });
    ensureFarmQueueNotEmpty();
    updateFarmQueueCount();
    persistFarmQueue();
    if(box) box.value='';
    if(out) out.innerHTML='<div class="ok">Queued '+added+' target'+(added===1?'':'s')+
      (uniq.length>FARM_MAX_TARGETS?(' (capped at '+FARM_MAX_TARGETS+'; '+(uniq.length-FARM_MAX_TARGETS)+' left out)'):'')+
      (pairs.length>uniq.length?(' · '+(pairs.length-uniq.length)+' duplicate'+((pairs.length-uniq.length)===1?'':'s')+' removed'):'')+
      '. Fill them one at a time — you press Attack each time.</div>';
  }

  /* -------- find nearby barbarian villages from loaded world data --------
     Barbs = villages with player_id 0. Sorts by distance from your source village.
     Requires World Data (tab 06) to be loaded. */
  var _barbList=[]; // last computed list, for the add-to-queue actions
  function findNearbyBarbs(){
    var out=getById('barbFinderOut');
    if(!WORLD_VILLAGES || !WORLD_VILLAGES.length){
      out.innerHTML='<div class="err">No world data loaded. Go to the <strong>World Data</strong> tab (06) and load your world\'s village list first — that\'s where the barb locations come from.</div>';
      return;
    }
    var srcM=val('fSrc').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!srcM){ out.innerHTML='<div class="err">Enter your village coords (X|Y) at the top first — barbs are ranked by distance from there. Press "Grab my coords" in the title bar.</div>'; return; }
    var sx=+srcM[1], sy=+srcM[2];

    // barbarians only (player_id 0), with distance, sorted nearest-first
    var barbs=WORLD_VILLAGES.filter(function(v){ return v.player_id===0; })
      .map(function(v){ return {x:v.x, y:v.y, points:v.points||0, d:distance(sx,sy,v.x,v.y)}; })
      .filter(function(v){ return v.d>0; })
      .sort(function(a,b){ return a.d-b.d; });

    if(!barbs.length){ out.innerHTML='<div class="note">No barbarian villages found in the loaded data. Either the world has none nearby, or the data is partial.</div>'; return; }

    // show the closest 40 (with add-N buttons)
    _barbList=barbs;
    var show=barbs.slice(0,40);
    var html='<div class="card"><div class="eyebrow">'+barbs.length.toLocaleString()+' barbarian villages · nearest to '+sx+'|'+sy+'</div>'+
      '<div class="btn-row" style="margin-bottom:10px;">'+
        '<button class="act" data-barb-add="10">Add closest 10 to queue</button>'+
        '<button class="act" data-barb-add="25">Add closest 25</button>'+
        '<button class="ghost" data-barb-add="all">Add all shown ('+show.length+')</button>'+
      '</div>'+
      '<div class="tbl-wrap"><table><thead><tr><th class="mono">Coords</th><th class="mono">Distance</th><th class="mono">Points</th></tr></thead><tbody>';
    show.forEach(function(v){
      html+='<tr><td class="mono">'+v.x+'|'+v.y+'</td><td class="mono">'+v.d.toFixed(1)+' fields</td><td class="mono">'+v.points.toLocaleString()+'</td></tr>';
    });
    html+='</tbody></table></div>'+
      '<div class="note">Closest first — shorter travel means faster loot returns. Add a batch to your queue, then fill and send each yourself. Barbs regrow resources over time, so re-farming the same ones is normal.</div></div>';
    out.innerHTML=html;

    // wire the add buttons (they exist now that html is set)
    out.querySelectorAll('[data-barb-add]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var how=btn.getAttribute('data-barb-add');
        var n = how==='all' ? show.length : parseInt(how);
        addBarbsToQueue(barbs.slice(0, n));
      });
    });
  }

  function addBarbsToQueue(list){
    var out=getById('farmOut');
    // append to existing queue (don't wipe what's there), respecting the cap
    var existing=farmQueueRows().map(function(i){ return (i.value||'').trim(); }).filter(Boolean);
    var seen={}; existing.forEach(function(c){ seen[c]=1; });
    var added=0, skipped=0;
    list.forEach(function(v){
      var c=v.x+'|'+v.y;
      if(seen[c]){ skipped++; return; }
      if(farmQueueRows().length>=FARM_MAX_TARGETS){ skipped++; return; }
      seen[c]=1; addFarmTarget(c); added++;
    });
    ensureFarmQueueNotEmpty();
    updateFarmQueueCount();
    persistFarmQueue();
    if(out) out.innerHTML='<div class="ok">Added '+added+' barbarian target'+(added===1?'':'s')+' to the queue'+
      (skipped>0?(' ('+skipped+' skipped — already queued or cap reached)'):'')+
      '. Fill and send each yourself.</div>';
  }

  // reorder the queue nearest-first from your source village
  function sortQueueByDistance(){
    var out=getById('farmOut');
    var srcM=val('fSrc').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!srcM){ if(out) out.innerHTML='<div class="err">Enter your village coords (X|Y) at the top first, so distances can be measured. Press "Grab my coords" in the title bar.</div>'; return; }
    var sx=+srcM[1], sy=+srcM[2];
    var coords=farmQueueRows().map(function(inp){ return (inp.value||'').trim(); })
                              .filter(function(v){ return /\d{1,3}\s*\|\s*\d{1,3}/.test(v); });
    if(coords.length<2){ if(out) out.innerHTML='<div class="err">Need at least two filled targets in the queue to sort.</div>'; return; }
    coords.sort(function(a,b){
      var am=a.match(/(\d{1,3})\s*\|\s*(\d{1,3})/), bm=b.match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
      return distance(sx,sy,+am[1],+am[2]) - distance(sx,sy,+bm[1],+bm[2]);
    });
    var host=getById('fTargetQueue'); if(host) host.innerHTML='';
    coords.forEach(function(p){ addFarmTarget(p); });
    ensureFarmQueueNotEmpty();
    updateFarmQueueCount();
    persistFarmQueue();
    var nearest=coords[0], farthest=coords[coords.length-1];
    var nm=nearest.match(/(\d{1,3})\s*\|\s*(\d{1,3})/), fm=farthest.match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(out) out.innerHTML='<div class="ok">Sorted '+coords.length+' targets nearest-first from '+sx+'|'+sy+
      '. Closest: <span class="mono">'+nearest+'</span> ('+distance(sx,sy,+nm[1],+nm[2]).toFixed(1)+' fields) · Furthest: <span class="mono">'+farthest+'</span> ('+distance(sx,sy,+fm[1],+fm[2]).toFixed(1)+' fields).</div>';
  }

  // fill the rally point for ONE target row, then clear it from the queue and advance
  function fillFarmTarget(row, alsoFocus){
    const out=getById('farmOut');
    const targetStr=(row.querySelector('.fq-target').value||'').trim();
    const units=readFarmUnits();
    if(!units.length){ out.innerHTML=mixErr('no_units'); return; }
    const r=fillMixInto(units, targetStr);
    if(r.err){ out.innerHTML=mixErr(r.err); return; }

    let msg=`<div class="ok">Filled: target <span class="mono">${r.target}</span> — ${r.mix}.</div>`;

    if(alsoFocus){
      const doc=document;
      let attackBtn=doc.getElementById('target_attack') ||
                    doc.querySelector('input[name="attack"]') ||
                    doc.querySelector('button[name="attack"]');
      if(!attackBtn){
        const allInputs=doc.querySelectorAll('input[type="submit"], input[type="button"], button');
        for(const el of allInputs){
          const text=(el.value||el.name||el.textContent||'').toLowerCase();
          if(text.includes('attack')||text.includes('atac')||text.includes('ataque')||text.includes('angriff')||text.includes('aanval')){ attackBtn=el; break; }
        }
      }
      if(attackBtn){ attackBtn.focus(); attackBtn.scrollIntoView({block:'center',behavior:'smooth'});
        msg=`<div class="ok">Filled and Attack focused — press <strong>Enter</strong> to send. Target <span class="mono">${r.target}</span> — ${r.mix}.</div>`;
      }
    }

    // log this raid to the return-timer board (assumes you send right after filling).
    // computes arrival + home-again from the source→target distance and slowest unit.
    logFarmRaid(targetStr, units);

    // spend this target: remove its row, keep at least one blank row, advance the queue.
    // persist NOW — before you press Enter to send (which navigates the page) — so the
    // remaining queue is on disk and rebuilds when the page reloads.
    row.remove();
    ensureFarmQueueNotEmpty();
    updateFarmQueueCount();
    persistFarmQueue();

    const left=farmQueueRows().filter(function(i){ return (i.value||'').trim()!==''; }).length;
    out.innerHTML=msg+`<div class="note">Target spent and cleared. ${left>0?('<strong>'+left+'</strong> target'+(left===1?'':'s')+' still queued — press Attack in the game, then Fill the next.'):'Queue empty. Add more targets to keep going.'} A return timer was started (see the board below) — cancel it if you didn't actually send.</div>`;
  }

  /* -------- return-timer board --------
     Each fill logs a raid with computed arrival + home-again times. Persisted to disk,
     survives reloads, and live-updates every second. You can cancel any raid (if you
     filled but didn't send) and clear ones that have already returned. */
  var FARM_RAIDS_KEY='wr_farm_raids';
  var _raids=[]; // {id, target, mix, sx,sy,tx,ty, sentMs, arriveMs, homeMs}
  var _raidTick=null;

  function loadRaids(){
    try { var raw=storeGet(FARM_RAIDS_KEY); if(raw){ _raids=JSON.parse(raw)||[]; } } catch(e){ _raids=[]; }
  }
  function saveRaids(){ try { storeSet(FARM_RAIDS_KEY, JSON.stringify(_raids)); } catch(e){} }

  function logFarmRaid(targetStr, units){
    if(!WR_SETTINGS.autoRaid) return; // user turned off auto return-timers
    var srcM=val('fSrc').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    var tgtM=String(targetStr).match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!srcM || !tgtM) return;
    var sx=+srcM[1], sy=+srcM[2], tx=+tgtM[1], ty=+tgtM[2];
    var ws=+val('fWorld')||1.25, us=+val('fUnitSpd')||0.8;
    // slowest unit paces the raid
    var slow=null;
    units.forEach(function(x){ if(slow===null || UNITS[x.unit].speed>UNITS[slow].speed) slow=x.unit; });
    if(!slow) return;
    var d=distance(sx,sy,tx,ty);
    var owMin=travelMinutes(d,slow,ws,us);
    var now=Date.now();
    _raids.push({
      id:'r'+now+'_'+Math.floor(Math.random()*1000),
      target:tx+'|'+ty, mix:units.map(function(x){ return x.count+' '+UNITS[x.unit].label; }).join(', '),
      sx:sx, sy:sy, tx:tx, ty:ty,
      sentMs:now, arriveMs:now+owMin*60000, homeMs:now+owMin*2*60000
    });
    // keep the list from growing forever — cap at 100 most recent
    if(_raids.length>100) _raids=_raids.slice(-100);
    saveRaids();
    renderRaids();
  }

  function cancelRaid(id){ _raids=_raids.filter(function(r){ return r.id!==id; }); saveRaids(); renderRaids(); }
  function clearReturnedRaids(){ var now=Date.now(); _raids=_raids.filter(function(r){ return r.homeMs>now; }); saveRaids(); renderRaids(); }

  function fmtCountdown(ms){
    if(ms<=0) return '—';
    var s=Math.round(ms/1000), h=Math.floor(s/3600); s-=h*3600; var m=Math.floor(s/60); s-=m*60;
    var p=function(n){return String(n).padStart(2,'0');};
    return (h>0?(p(h)+':'):'')+p(m)+':'+p(s);
  }

  function renderRaids(){
    var host=getById('raidBoard'); if(!host) return;
    var now=Date.now();
    // sort: in-flight first (by soonest home), then returned
    var active=_raids.filter(function(r){ return r.homeMs>now; }).sort(function(a,b){ return a.homeMs-b.homeMs; });
    var returned=_raids.filter(function(r){ return r.homeMs<=now; });

    if(!_raids.length){ host.innerHTML='<div class="hint">No raids tracked yet. Fill a target above (or press Q) and a return timer starts here.</div>'; return; }

    var html='';
    if(active.length){
      html+='<div class="tbl-wrap"><table><thead><tr><th class="mono">Target</th><th class="mono">Lands in</th><th class="mono">Home in</th><th></th></tr></thead><tbody>';
      active.forEach(function(r){
        var landIn=r.arriveMs-now, homeIn=r.homeMs-now;
        var landed=landIn<=0;
        html+='<tr>'+
          '<td class="mono">'+r.target+'</td>'+
          '<td class="mono">'+(landed?'<span style="color:var(--good);">landed</span>':fmtCountdown(landIn))+'</td>'+
          '<td class="mono" style="font-weight:700;">'+fmtCountdown(homeIn)+'</td>'+
          '<td><button class="ghost" data-raid-cancel="'+r.id+'" style="padding:4px 10px;font-size:11px;">cancel</button></td>'+
          '</tr>';
      });
      html+='</tbody></table></div>';
    }
    if(returned.length){
      html+='<div class="note" style="border-color:var(--good);background:rgba(63,107,63,.08);margin-top:10px;"><strong>'+returned.length+' raid'+(returned.length===1?'':'s')+' home</strong> — troops back and ready to send again. <button class="ghost" data-raid-clear="1" style="padding:4px 10px;font-size:11px;margin-left:8px;">clear returned</button></div>';
    }
    host.innerHTML=html;

    host.querySelectorAll('[data-raid-cancel]').forEach(function(btn){ btn.addEventListener('click', function(){ cancelRaid(btn.getAttribute('data-raid-cancel')); }); });
    var cl=host.querySelector('[data-raid-clear]'); if(cl) cl.addEventListener('click', clearReturnedRaids);

    // ensure the live ticker is running while there are active raids
    if(active.length && !_raidTick){
      _raidTick=setInterval(function(){
        if(_raids.filter(function(r){ return r.homeMs>Date.now(); }).length===0){ clearInterval(_raidTick); _raidTick=null; }
        renderRaids();
      }, 1000);
    }
  }

  function planSingle(){
    const out=getById('farmOut');
    const srcM=val('fSrc').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!srcM){out.innerHTML=`<div class="err">Enter your village coordinates as X|Y (e.g. 500|500).</div>`;return;}
    // time the FIRST queued target
    const firstRow=farmQueueRows().find(function(i){ return (i.value||'').trim()!==''; });
    const tgtM=firstRow ? firstRow.value.match(/(\d{1,3})\s*\|\s*(\d{1,3})/) : null;
    if(!tgtM){out.innerHTML=`<div class="err">Add at least one target (X|Y) to the queue.</div>`;return;}
    const units=readFarmUnits();
    if(!units.length){out.innerHTML=`<div class="err">Type a count into at least one unit box.</div>`;return;}
    const sx=+srcM[1],sy=+srcM[2],tx=+tgtM[1],ty=+tgtM[2];
    const ws=+val('fWorld'),us=+val('fUnitSpd');
    const offset = +val('fOffset') || 0;
    const d=distance(sx,sy,tx,ty);
    const slow=slowestOf(units);
    const ow=travelMinutes(d,slow,ws,us);
    const sendNow=getById('fSendNow').checked;
    const now=new Date();
    const serverNow = new Date(now.getTime() + offset*60000);
    const arr=sendNow?addMinutes(serverNow,ow):null, ret=sendNow?addMinutes(serverNow,ow*2):null;
    const totalHaul=units.reduce((s,x)=>s+UNITS[x.unit].haul*x.count,0);
    const mix=units.map(x=>`${x.count} ${UNITS[x.unit].label}`).join(', ');
    const qn=farmQueueRows().filter(function(i){ return (i.value||'').trim()!==''; }).length;
    out.innerHTML=`<div class="card"><div class="stat-row">
        <div class="stat"><div class="v mono">${tx}|${ty}</div><div class="l">first target</div></div>
        <div class="stat"><div class="v mono">${d.toFixed(2)}</div><div class="l">fields</div></div>
        <div class="stat"><div class="v">${UNITS[slow].label}</div><div class="l">slowest — sets pace</div></div>
        <div class="stat"><div class="v mono">${fmtDur(ow)}</div><div class="l">one-way</div></div>
        ${arr?`<div class="stat"><div class="v mono">${hms(arr)}</div><div class="l">arrival (server)</div></div>`:''}
        ${ret?`<div class="stat"><div class="v mono">${hms(ret)}</div><div class="l">back (server)</div></div>`:''}
      </div>
      <div style="margin-top:12px;font-size:14px;color:var(--ink-soft);">Sending: <strong style="color:var(--ink);">${mix}</strong>${totalHaul>0?` · carries up to ${totalHaul}`:''} · <strong>${qn}</strong> target${qn===1?'':'s'} queued</div>
      </div>
      <div class="note">Timing shown for the first target, paced by the slowest unit (${UNITS[slow].label}). Distance/time differ per target — this is a guide for the run. Use each target's <strong>Fill</strong> button to load and advance.</div>`;
  }

  /* =====================================================================
     02 — ATTACK (8 independent forms, one box per unit each, fill-only)
     ===================================================================== */
  const ATTACK_FORMS = 8;

  // read one form's unit boxes → [{unit, code, count}, ...] for boxes with count > 0
  function readAttackUnits(n){
    const list=[];
    UNIT_ORDER.forEach(function(u){
      const el=getById('a'+n+'_unit_'+u); if(!el) return;
      const cnt=parseInt(el.value)||0;
      if(cnt>0) list.push({unit:u, code:TW_UNIT_CODE[u], count:cnt});
    });
    return list;
  }

  function clearAttackUnits(n){
    UNIT_ORDER.forEach(function(u){ const el=getById('a'+n+'_unit_'+u); if(el) el.value=''; });
    const out=getById('attackOut'+n); if(out) out.innerHTML='';
  }

  /* -------- persistent save/load for attack forms --------
     Uses Greasemonkey storage (survives browser restarts). Falls back to
     localStorage if GM_* isn't available for some reason. */
  function storeSet(key, value){
    // Prefer GM storage (no ~5MB cap). Fall back to localStorage, which CAN hit quota
    // on large world data — surface the error so callers can warn the user instead of
    // silently losing the write.
    try { if(typeof GM_setValue==='function'){ GM_setValue(key, value); return; } } catch(e){}
    try { localStorage.setItem(key, value); }
    catch(e){
      try { if(typeof _loadErrors!=='undefined' && _loadErrors.indexOf('storage full')<0) _loadErrors.push('storage full'); } catch(_){}
      throw e;
    }
  }
  function storeGet(key){
    try { if(typeof GM_getValue==='function'){ var v=GM_getValue(key, null); if(v!=null) return v; } } catch(e){}
    try { return localStorage.getItem(key); } catch(e){ return null; }
  }
  function attackKey(n){ return 'wr_attack_form_'+n; }
  function farmKey(){ return 'wr_farm_run'; }

  // ---- settings (persisted, loaded once at startup) ----
  var WR_SETTINGS_KEY='wr_settings';
  var WR_SETTINGS_DEFAULTS={ hotkey:'q', worldSpeed:null, unitSpeed:null, autoRaid:true, openLast:false, wrap:false, mapSize:1000 };
  var WR_SETTINGS=Object.assign({}, WR_SETTINGS_DEFAULTS);
  // collects any storage-load errors at startup so we can warn the user (via the env banner)
  // instead of silently swallowing corruption and resetting to defaults.
  var _loadErrors=[];

  function loadSettings(){
    try { var raw=storeGet(WR_SETTINGS_KEY); if(raw){ var o=JSON.parse(raw); WR_SETTINGS=Object.assign({}, WR_SETTINGS_DEFAULTS, o); } }
    catch(e){ WR_SETTINGS=Object.assign({}, WR_SETTINGS_DEFAULTS); _loadErrors.push('settings'); }
  }
  function saveSettings(){ try { storeSet(WR_SETTINGS_KEY, JSON.stringify(WR_SETTINGS)); } catch(e){} }

  // save farm troops + the whole target list to disk
  function saveFarmRun(){
    var data={ units:{}, targets:[] };
    UNIT_ORDER.forEach(function(u){
      var el=getById('fUnit_'+u);
      if(el && el.value!=='') data.units[u]=el.value;
    });
    farmQueueRows().forEach(function(inp){
      var v=(inp.value||'').trim();
      if(v!=='') data.targets.push(v);
    });
    var out=getById('farmOut');
    try { storeSet(farmKey(), JSON.stringify(data)); }
    catch(e){ if(out) out.innerHTML='<div class="err">Couldn\'t save — browser storage may be full. Try clearing old data or exporting a backup and removing world data.</div>'; return; }
    if(out) out.innerHTML='<div class="ok">Saved this farm run — troops and '+data.targets.length+' target'+(data.targets.length===1?'':'s')+'. Reloads automatically next time you open War Room.</div>';
  }

  // restore the farm run from disk (called once when the panel is built)
  function loadFarmRun(){
    var raw=storeGet(farmKey());
    if(!raw) return false;
    var data; try { data=JSON.parse(raw); } catch(e){ _loadErrors.push('farm queue'); return false; }
    if(!data) return false;
    if(data.units){
      UNIT_ORDER.forEach(function(u){
        var el=getById('fUnit_'+u);
        if(el && data.units[u]!=null) el.value=data.units[u];
      });
    }
    // rebuild the target queue from saved list
    var host=getById('fTargetQueue');
    if(host){ host.innerHTML=''; }
    if(data.targets && data.targets.length){
      data.targets.forEach(function(t){ addFarmTarget(t); });
    }
    return true;
  }

  // save one form's source, target, and all unit counts to disk
  function saveAttackForm(n){
    var data={ src: val('a'+n+'_src'), target: val('a'+n+'_target'), units:{} };
    UNIT_ORDER.forEach(function(u){
      var el=getById('a'+n+'_unit_'+u);
      if(el && el.value!=='') data.units[u]=el.value;
    });
    var out=getById('attackOut'+n);
    try { storeSet(attackKey(n), JSON.stringify(data)); }
    catch(e){ if(out) out.innerHTML='<div class="err">Couldn\'t save — browser storage may be full.</div>'; return; }
    if(out) out.innerHTML='<div class="ok">Saved this form. It will reload automatically next time you open War Room.</div>';
  }

  // restore one form from disk (called for every form when the panel is built)
  function loadAttackForm(n){
    var raw=storeGet(attackKey(n));
    if(!raw) return;
    var data; try { data=JSON.parse(raw); } catch(e){ return; }
    if(!data) return;
    if(data.src!=null){ var s=getById('a'+n+'_src'); if(s) s.value=data.src; }
    if(data.target!=null){ var t=getById('a'+n+'_target'); if(t) t.value=data.target; }
    if(data.units){
      UNIT_ORDER.forEach(function(u){
        var el=getById('a'+n+'_unit_'+u);
        if(el && data.units[u]!=null) el.value=data.units[u];
      });
    }
  }

  // slowest unit in the chosen mix determines the travel time of the whole command
  function slowestOf(units){
    let slow=null;
    units.forEach(function(x){
      if(slow===null || UNITS[x.unit].speed > UNITS[slow].speed) slow=x.unit;
    });
    return slow;
  }

  function planAttack(n){
    const out=getById('attackOut'+n);
    const srcM=val('a'+n+'_src').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    const tgtM=val('a'+n+'_target').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!srcM){out.innerHTML=`<div class="err">Enter your village coordinates as X|Y (e.g. 500|500).</div>`;return;}
    if(!tgtM){out.innerHTML=`<div class="err">Enter the target coordinates as X|Y (e.g. 474|608).</div>`;return;}
    const units=readAttackUnits(n);
    if(!units.length){out.innerHTML=`<div class="err">Type a count into at least one unit box.</div>`;return;}
    const sx=+srcM[1],sy=+srcM[2],tx=+tgtM[1],ty=+tgtM[2];
    const ws=+val('a'+n+'_world'),us=+val('a'+n+'_unitspd');
    const offset = +val('a'+n+'_offset') || 0;
    const d=distance(sx,sy,tx,ty);
    const slow=slowestOf(units);
    const ow=travelMinutes(d,slow,ws,us);
    const now=new Date();
    const serverNow = new Date(now.getTime() + offset*60000);
    const arr=addMinutes(serverNow,ow), ret=addMinutes(serverNow,ow*2);
    const totalPop=units.reduce((s,x)=>s+UNITS[x.unit].pop*x.count,0);
    const totalHaul=units.reduce((s,x)=>s+UNITS[x.unit].haul*x.count,0);
    const mix=units.map(x=>`${x.count} ${UNITS[x.unit].label}`).join(', ');
    out.innerHTML=`<div class="card"><div class="stat-row">
        <div class="stat"><div class="v mono">${tx}|${ty}</div><div class="l">target</div></div>
        <div class="stat"><div class="v mono">${d.toFixed(2)}</div><div class="l">fields</div></div>
        <div class="stat"><div class="v">${UNITS[slow].label}</div><div class="l">slowest — sets pace</div></div>
        <div class="stat"><div class="v mono">${fmtDur(ow)}</div><div class="l">one-way</div></div>
        <div class="stat"><div class="v mono">${hms(arr)}</div><div class="l">arrival if sent now</div></div>
        <div class="stat"><div class="v mono">${hms(ret)}</div><div class="l">back (server)</div></div>
      </div>
      <div style="margin-top:12px;font-size:14px;color:var(--ink-soft);">Sending: <strong style="color:var(--ink);">${mix}</strong> · ${totalPop} pop${totalHaul>0?` · carries up to ${totalHaul}`:''}</div>
      </div>
      <div class="note">Timing only, paced by the slowest unit (${UNITS[slow].label}). Use <strong>Fill rally point</strong> or <strong>Fill &amp; focus Attack</strong> to load the command.</div>`;
  }

  // fill ALL given unit boxes + the target, in one go. Shared by Farm and Attack tabs.
  // units = [{unit, code, count}], targetStr = "X|Y".
  function fillMixInto(units, targetStr){
    const doc=document;
    if(!units.length) return {err:'no_units'};

    const tgtM=String(targetStr).match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!tgtM) return {err:'no_target'};
    const tx=tgtM[1], ty=tgtM[2];

    // resolve every unit input first — if any is missing we're not on the right screen
    const resolved=[];
    for(const x of units){
      const el=doc.getElementById('unit_input_'+x.code) || doc.querySelector('input[name="'+x.code+'"]');
      if(!el) return {err:'no_fields'};
      resolved.push({el, count:x.count, unit:x.unit});
    }

    // target — combined box first (name="input"), then hidden inputx/inputy fallback
    const combo=doc.querySelector('#place_target input[name="input"]') ||
                doc.querySelector('input.target-input-field') ||
                doc.querySelector('input[name="input"]');
    const xEl=doc.getElementById('inputx') || doc.querySelector('input[name="x"]');
    const yEl=doc.getElementById('inputy') || doc.querySelector('input[name="y"]');
    const coordRadio=doc.querySelector('input[name="target_type"][value="coord"]');
    if(coordRadio && !coordRadio.checked){ coordRadio.checked=true; setVal(coordRadio,'coord'); }

    let filledTarget=false;
    if(combo){ setVal(combo, tx+'|'+ty); combo.dispatchEvent(new Event('blur',{bubbles:true})); filledTarget=true; }
    if(xEl && yEl){ setVal(xEl,tx); setVal(yEl,ty); filledTarget=true; }
    if(!filledTarget) return {err:'no_fields'};

    resolved.forEach(r=>setVal(r.el, String(r.count)));

    const mix=units.map(x=>`${x.count} ${UNITS[x.unit].label}`).join(', ');
    return {target:tx+'|'+ty, mix};
  }

  function mixErr(code){
    if(code==='no_units')  return `<div class="err">Type a count into at least one unit box first.</div>`;
    if(code==='no_target') return `<div class="err">Enter the target coordinates as X|Y (e.g. 474|608).</div>`;
    return `<div class="err">Couldn't find the attack form fields. Open the rally point (Place) screen first, then try again.</div>`;
  }

  function fillAttackRally(n){
    const out=getById('attackOut'+n);
    const r=fillMixInto(readAttackUnits(n), val('a'+n+'_target'));
    if(r.err){ out.innerHTML=mixErr(r.err); return; }
    out.innerHTML=`<div class="ok">Filled: target <span class="mono">${r.target}</span> — ${r.mix}.</div>
      <div class="note">The attack form is loaded with your whole mix. <strong>Press the Attack button in the game yourself</strong> — or use <strong>Fill &amp; focus Attack</strong> to jump the cursor onto it.</div>`;
  }

  function focusAttackRally(n){
    const out=getById('attackOut'+n);
    const r=fillMixInto(readAttackUnits(n), val('a'+n+'_target'));
    if(r.err){ out.innerHTML=mixErr(r.err); return; }
    const doc=document;
    let attackBtn=doc.getElementById('target_attack') ||
                  doc.querySelector('input[name="attack"]') ||
                  doc.querySelector('button[name="attack"]');
    if(!attackBtn){
      out.innerHTML=`<div class="ok">Filled: target <span class="mono">${r.target}</span> — ${r.mix}.</div>
        <div class="note">Couldn't find the Attack button to focus it — press Attack yourself in the game.</div>`;
      return;
    }
    attackBtn.focus();
    attackBtn.scrollIntoView({block:'center', behavior:'smooth'});
    out.innerHTML=`<div class="ok">Form filled and the Attack button is focused — press <strong>Enter</strong> to send. Target <span class="mono">${r.target}</span> — ${r.mix}.</div>
      <div class="note">The tool fills the rally point and moves the cursor onto Attack. <strong>You send it</strong> with one keypress. If a confirmation dialog appears, confirm it yourself.</div>`;
  }

  /* =====================================================================
     03 — ATTACKER INTEL
     ===================================================================== */
  const TOL_BASE=0.75; // base tolerance (min/field) for matching implied speed to a unit
  let WORLD_VILLAGES=[];
  let WORLD_PLAYERS={};
  let WORLD_ALLIES={};

  function analyzeStack(ox,oy,tx,ty,arrivalDate,ws,us,serverNow){
    const d=distance(ox,oy,tx,ty);
    const travel=(arrivalDate-serverNow)/60000;
    if(travel<=0||d===0){
      return {d,travel:Math.max(travel,0),impossible:true};
    }
    const implied=(travel/d)*(ws*us);
    // Scale tolerance by the speed multipliers: on fast worlds the same clock imprecision
    // spans more base-speed units, so a fixed 0.75 can miss the right unit. Widen it with
    // (ws*us), clamped so it never gets absurdly loose.
    const TOL=Math.min(2.0, TOL_BASE*Math.max(1, ws*us));
    const anchors=UNIT_ORDER.filter(u=>Math.abs(UNITS[u].speed-implied)<=TOL);
    let extra=[],ruled=[];
    if(anchors.length){
      const aSpeed=UNITS[anchors[0]].speed;
      extra=UNIT_ORDER.filter(u=>UNITS[u].speed<aSpeed-TOL);
      ruled=UNIT_ORDER.filter(u=>UNITS[u].speed>aSpeed+TOL);
    }
    const nobleConf=anchors.includes('noble');
    const siegeConf=anchors.includes('ram')||anchors.includes('catapult');
    let prio;
    if(nobleConf) prio='CRITICAL';
    else if(siegeConf) prio='HIGH';
    else if(travel<=60) prio='HIGH';
    else if(anchors.length) prio='MEDIUM';
    else prio='LOW';
    return {d,travel,implied,anchors,extra,ruled,nobleConf,siegeConf,prio};
  }
  function lbl(keys){return keys.map(k=>UNITS[k].label).join(', ')||'—';}

  function renderIntel(ox,oy,tx,ty,arrivalStr,ws,us,offset){
    const out=getById('intelOut');
    const now = new Date();
    const serverNow = new Date(now.getTime() + offset*60000);
    const arrivalDate=parseArrival(arrivalStr, offset, now, 'nearest');
    if(arrivalDate===null){out.innerHTML=`<div class="err">Couldn't read the arrival time. Use HH:MM:SS (e.g. 18:35:12).</div>`;return;}
    const r=analyzeStack(ox,oy,tx,ty,arrivalDate,ws,us,serverNow);
    if(r.impossible){out.innerHTML=`<div class="err">Arrival isn't after now — check the time and that your clock matches the server.</div>`;return;}

    let enemyBlock='';
    const owner=WORLD_VILLAGES.find(v=>v.x===ox&&v.y===oy);
    if(owner){
      const pid=owner.player_id;
      const p=WORLD_PLAYERS[pid];
      const theirVillages=WORLD_VILLAGES.filter(v=>v.player_id===pid);
      // tribe/ally: WORLD_PLAYERS stores an ally ID. If ally data is loaded we can name it;
      // otherwise show the ID (0 = no tribe). Cross-reference WORLD_ALLIES if present.
      var allyId = p ? (p.ally||0) : 0;
      var allyTxt;
      if(allyId===0) allyTxt='No tribe';
      else if(typeof WORLD_ALLIES!=='undefined' && WORLD_ALLIES[allyId]) allyTxt=esc(WORLD_ALLIES[allyId].tag||WORLD_ALLIES[allyId].name||('Ally #'+allyId));
      else allyTxt='Tribe #'+allyId;
      enemyBlock=`<div class="card">
        <div class="eyebrow">Identified from public ledger</div>
        <div class="stat-row">
          <div class="stat"><div class="v">${p?esc(p.name):'Unknown'}</div><div class="l">attacker</div></div>
          <div class="stat"><div class="v">${allyTxt}</div><div class="l">tribe</div></div>
          <div class="stat"><div class="v">${p?(+p.points).toLocaleString():'—'}</div><div class="l">total points</div></div>
          <div class="stat"><div class="v">${theirVillages.length}</div><div class="l">villages owned</div></div>
          <div class="stat"><div class="v">${p&&+p.rank?('#'+p.rank):'—'}</div><div class="l">rank</div></div>
        </div>
        <div style="margin-top:12px;font-size:13px;color:var(--ink-soft);">Origin village: <span class="mono">${owner.x}|${owner.y}</span> — ${esc(owner.name)} (${(+owner.points).toLocaleString()} pts)</div>
        ${theirVillages.length>1?`<details style="margin-top:8px;"><summary style="cursor:pointer;font-family:'Cinzel';font-size:12px;color:var(--wax);">Show all ${theirVillages.length} of their villages</summary>
          <div class="tbl-wrap" style="margin-top:8px;"><table><thead><tr><th class="mono">Coords</th><th>Name</th><th class="mono">Points</th></tr></thead><tbody>
          ${theirVillages.sort((a,b)=>b.points-a.points).map(v=>`<tr><td class="mono">${v.x}|${v.y}</td><td>${esc(v.name)}</td><td class="mono">${(+v.points).toLocaleString()}</td></tr>`).join('')}
          </tbody></table></div></details>`:''}
      </div>`;
    } else if(WORLD_VILLAGES.length){
      enemyBlock=`<div class="note">Origin <span class="mono">${ox}|${oy}</span> wasn't found in the loaded map data — it may be a barbarian village, or the data is from a different world.</div>`;
    }

    const badge=`<span class="badge b-${r.prio}">${r.prio}</span>`;
    let flags=[];
    if(r.nobleConf) flags.push('⚑ NOBLE speed — this attack can capture your village if it lands on a cleared village');
    if(r.siegeConf) flags.push('⚔ SIEGE speed — rams and/or catapults are possible (wall/building damage)');

    // verdict + recommended action per threat level
    var verdict, action, vColor;
    if(r.prio==='CRITICAL'){ verdict='CRITICAL — possible village-taker'; vColor='var(--crit)';
      action='Stack this village NOW with defence, or if it will fall, pull your troops and valuables. Snipe the noble train if you can time it (see Attack Timing).'; }
    else if(r.prio==='HIGH'){ verdict='HIGH — siege or fast heavy hit'; vColor='var(--wax)';
      action='Get defence in before arrival. Rams mean your wall will drop — reinforce accordingly. Scout the origin to confirm size.'; }
    else if(r.prio==='MEDIUM'){ verdict='MEDIUM — infantry/mixed'; vColor='var(--warn)';
      action='Likely a clearing or farming hit. Have some defence present; scout if the attacker is a real threat.'; }
    else { verdict='LOW — fast cavalry only'; vColor='var(--good)';
      action='Fast units only — probably a fake, scout, or light farm hit. No siege or noble at this speed. Don\'t overcommit.'; }

    // per-unit arrival: for each unit that COULD anchor or be hidden, when it would land
    var now2=new Date();
    var srvNow2=new Date(now2.getTime()+offset*60000);
    var arrRows=UNIT_ORDER.map(function(u){
      var t=travelMinutes(r.d,u,ws,us);
      var lands=new Date(srvNow2.getTime()+t*60000);
      var status;
      if(r.anchors.indexOf(u)>=0) status='<span style="color:var(--wax);font-weight:700;">ANCHOR</span>';
      else if(r.extra.indexOf(u)>=0) status='<span style="color:var(--ink-soft);">could be hidden</span>';
      else status='<span style="color:var(--good);">ruled out</span>';
      return {label:UNITS[u].label, t:t, lands:hms(lands), status:status, isAnchor:r.anchors.indexOf(u)>=0};
    });

    out.innerHTML=`${enemyBlock}
      <div class="card" style="border-color:${vColor};border-width:2px;">
        <div style="font-family:'Cinzel';font-weight:700;font-size:18px;color:${vColor};letter-spacing:.03em;margin-bottom:4px;">${verdict} <span class="badge b-${r.prio}" style="vertical-align:middle;">${r.prio}</span></div>
        <div style="font-size:14.5px;color:var(--ink-soft);line-height:1.55;"><strong style="color:var(--ink);">Recommended:</strong> ${action}</div>
        ${flags.length?`<div class="note" style="border-color:var(--crit);background:rgba(107,31,31,.08);margin-top:12px;">${flags.join('<br>')}</div>`:''}
      </div>

      <div class="card">
        <div class="eyebrow">The reading</div>
        <div class="stat-row">
          <div class="stat"><div class="v mono">${ox}|${oy} → ${tx}|${ty}</div><div class="l">route</div></div>
          <div class="stat"><div class="v mono">${r.d.toFixed(2)}</div><div class="l">fields apart</div></div>
          <div class="stat"><div class="v mono">${fmtDur(r.travel)}</div><div class="l">time in flight</div></div>
          <div class="stat"><div class="v mono">${r.implied.toFixed(2)}</div><div class="l">min / field</div></div>
        </div>
        <div class="tbl-wrap"><table><tbody>
          <tr><th style="width:230px">Slowest possible unit — the anchor</th><td><strong>${lbl(r.anchors)}</strong></td></tr>
          <tr><th>Could be riding along, hidden</th><td>${lbl(r.extra)}</td></tr>
          <tr><th>Ruled out — too slow to arrive this fast</th><td>${lbl(r.ruled)}</td></tr>
        </tbody></table></div>
      </div>

      <div class="card">
        <div class="eyebrow">If it were each unit — when it lands</div>
        <div class="tbl-wrap"><table><thead><tr><th>Unit</th><th class="mono">Travel</th><th class="mono">Would land (server)</th><th>Verdict</th></tr></thead><tbody>
          ${arrRows.map(function(x){return `<tr${x.isAnchor?' style="background:rgba(124,31,26,.10);"':''}><td>${x.label}</td><td class="mono">${fmtDur(x.t)}</td><td class="mono">${x.lands}</td><td>${x.status}</td></tr>`;}).join('')}
        </tbody></table></div>
        <div class="note"><strong>You cannot see their exact troops — no tool can.</strong> This is the hard limit the timing reveals: the slowest thing that could anchor this attack. Scout the origin village in-game to confirm what is actually coming.</div>
      </div>`;
  }
  function analyzeIntel(){
    const o=val('iOrigin').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    const t=val('iTarget').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!o){getById('intelOut').innerHTML=`<div class="err">Enter the attacker's <strong>origin</strong> coordinates as X|Y (from the incoming attack).</div>`;return;}
    if(!t){getById('intelOut').innerHTML=`<div class="err">Enter <strong>your</strong> coordinates as X|Y (the target). Press "Grab my coords" in the title bar to auto-fill.</div>`;return;}
    if(!val('iArrive').match(/\d{1,2}:\d{1,2}:\d{1,2}/)){getById('intelOut').innerHTML=`<div class="err">Enter the <strong>arrival time</strong> as HH:MM:SS (server time) from the incoming attack.</div>`;return;}
    const offset = +val('iOffset') || 0;
    renderIntel(+o[1],+o[2],+t[1],+t[2],val('iArrive'),+val('iWorld'),+val('iUnitSpd'),offset);
  }
  function analyzeIntelPaste(){
    const text=val('iPaste');
    if(!text.trim()){getById('intelOut').innerHTML=`<div class="err">Paste the incoming attack row into the box first.</div>`;return;}
    const coords=[...text.matchAll(/(\d{1,3})\s*\|\s*(\d{1,3})/g)];
    const time=text.match(/\b\d{1,2}:[0-5]?\d:[0-5]?\d\b/);
    if(coords.length<2||!time){getById('intelOut').innerHTML=`<div class="err">Couldn't find two coordinate pairs and a time in that paste. It needs the <strong>origin</strong> coords, <strong>your</strong> coords, and an <strong>arrival time</strong> (HH:MM:SS). Try typing the three values instead.</div>`;return;}
    const offset = +val('iOffset') || 0;
    // also reflect the parsed values into the fields so the user sees what was read
    var oEl=getById('iOrigin'), tEl=getById('iTarget'), aEl=getById('iArrive');
    if(oEl) oEl.value=coords[0][1]+'|'+coords[0][2];
    if(tEl) tEl.value=coords[1][1]+'|'+coords[1][2];
    if(aEl) aEl.value=time[0];
    renderIntel(+coords[0][1],+coords[0][2],+coords[1][1],+coords[1][2],time[0],+val('iWorld'),+val('iUnitSpd'),offset);
  }

  /* -------- auto-read incoming attacks from the page --------
     Reads the incomings table (present on the Incomings overview screen). For each
     incoming: origin coords, arrival time → runs analyzeStack for a threat level.
     If not on that screen, reads the incoming count from game_data and directs the
     user to the right screen — same honest pattern as the build-guide reader. */
  function autoReadIncomings(){
    var out=getById('intelAutoOut');
    var ws=+val('iWorld')||1.25, us=+val('iUnitSpd')||0.8, offset=+val('iOffset')||0;
    var now=new Date(), srvNow=new Date(now.getTime()+offset*60000);

    // find rows that look like incoming-command rows: contain a coord and an HH:MM:SS time
    // TW incomings table: each row has an origin link (…&x=..&y=.. or "(x|y)") and arrival time.
    var found=[];
    try {
      // scope to the incomings table(s) first; only fall back to a broad scan if none exist.
      // scanning every <tr> on a complex TW page is slow and matches unrelated rows.
      var scopeSel='#incomings_table, #commands_incomings, table.vis, #commands_outgoings';
      var scopes=document.querySelectorAll(scopeSel);
      var rows;
      if(scopes.length){
        rows=[];
        scopes.forEach(function(tbl){ tbl.querySelectorAll('tr').forEach(function(tr){ rows.push(tr); }); });
      } else {
        rows=document.querySelectorAll('tr'); // last resort
      }
      rows.forEach(function(tr){
        var txt=tr.textContent||'';
        // must have a time
        var tm=txt.match(/\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/);
        if(!tm) return;
        // origin coords: prefer a link href with x/y, else a (x|y) in text
        var ox=null, oy=null;
        var link=tr.querySelector('a[href*="&x="][href*="&y="], a[href*="screen=info_village"]');
        if(link){
          var hx=link.href.match(/[?&]x=(\d{1,3})/), hy=link.href.match(/[?&]y=(\d{1,3})/);
          if(hx&&hy){ ox=+hx[1]; oy=+hy[1]; }
          if(ox==null){ var lt=(link.textContent||'').match(/(\d{1,3})\s*\|\s*(\d{1,3})/); if(lt){ ox=+lt[1]; oy=+lt[2]; } }
        }
        if(ox==null){ var cm=txt.match(/(\d{1,3})\s*\|\s*(\d{1,3})/); if(cm){ ox=+cm[1]; oy=+cm[2]; } }
        if(ox==null) return;
        // target: try to find a second coord pair (your village) in the row; else use iTarget field
        var allc=[...txt.matchAll(/(\d{1,3})\s*\|\s*(\d{1,3})/g)];
        var tx=null, ty=null;
        if(allc.length>=2){ tx=+allc[1][1]; ty=+allc[1][2]; }
        else { var tf=(val('iTarget')||'').match(/(\d{1,3})\s*\|\s*(\d{1,3})/); if(tf){ tx=+tf[1]; ty=+tf[2]; } }
        if(tx==null) return;
        // skip if origin==target (that's the row's own village label, not an attack line)
        if(ox===tx && oy===ty && allc.length<2) return;
        found.push({ox:ox,oy:oy,tx:tx,ty:ty,time:tm[0]});
      });
    } catch(e){}

    // de-dup identical rows
    var seen={}, uniq=[];
    found.forEach(function(a){ var k=a.ox+'|'+a.oy+'>'+a.tx+'|'+a.ty+'@'+a.time; if(!seen[k]){ seen[k]=1; uniq.push(a); } });

    if(!uniq.length){
      // try to read a count from game_data
      var cnt=null;
      try { var gd=getGameData(); if(gd && gd.player && gd.player.incomings!=null) cnt=+gd.player.incomings; } catch(e){}
      if(cnt && cnt>0){
        out.innerHTML='<div class="note" style="border-color:var(--wax);background:rgba(124,31,26,.06);"><strong>'+cnt+' incoming attack'+(cnt===1?'':'s')+' detected</strong>, but the details aren\'t on this screen. Open <strong>Overview → Incomings</strong> and press this button again to read them all with threat levels.</div>';
      } else {
        out.innerHTML='<div class="note">No incoming attacks found on this page. If you have incomings, open <strong>Overview → Incomings</strong> and press this button there — that screen lists them in full. (If you have none, you\'re safe right now.)</div>';
      }
      return;
    }

    // analyse each, sort by arrival (soonest first)
    var analysed=uniq.map(function(a){
      var arr=parseArrival(a.time, offset, now, 'nearest');
      var r=arr?analyzeStack(a.ox,a.oy,a.tx,a.ty,arr,ws,us,srvNow):null;
      return {a:a, arr:arr, r:r};
    }).filter(function(x){ return x.arr && x.r && !x.r.impossible; });

    analysed.sort(function(p,q){ return p.arr-q.arr; });

    if(!analysed.length){
      out.innerHTML='<div class="note">Found incoming rows but couldn\'t compute timing (clock/offset mismatch). Check the offset field, or analyse one manually below.</div>';
      return;
    }

    // count by threat
    var counts={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};
    analysed.forEach(function(x){ counts[x.r.prio]++; });
    var summary=[];
    if(counts.CRITICAL) summary.push('<span class="badge b-CRITICAL">'+counts.CRITICAL+' noble-speed</span>');
    if(counts.HIGH) summary.push('<span class="badge b-HIGH">'+counts.HIGH+' high</span>');
    if(counts.MEDIUM) summary.push('<span class="badge b-MEDIUM">'+counts.MEDIUM+' medium</span>');
    if(counts.LOW) summary.push('<span class="badge b-LOW">'+counts.LOW+' low</span>');

    var html='<div class="card"><div class="eyebrow">'+analysed.length+' incoming attack'+(analysed.length===1?'':'s')+' · soonest first</div>'+
      '<div style="margin-bottom:10px;">'+summary.join(' ')+'</div>'+
      '<div class="tbl-wrap"><table><thead><tr><th class="mono">From</th><th class="mono">Lands</th><th class="mono">In</th><th>Anchor (slowest)</th><th>Threat</th></tr></thead><tbody>';
    analysed.forEach(function(x){
      var mins=Math.max(0,(x.arr-srvNow)/60000);
      html+='<tr'+(x.r.prio==='CRITICAL'?' style="background:rgba(107,31,31,.10);"':'')+'>'+
        '<td class="mono">'+x.a.ox+'|'+x.a.oy+'</td>'+
        '<td class="mono">'+x.a.time+'</td>'+
        '<td class="mono">'+fmtDur(mins)+'</td>'+
        '<td>'+lbl(x.r.anchors)+(x.r.nobleConf?' ⚑':'')+(x.r.siegeConf?' ⚔':'')+'</td>'+
        '<td><span class="badge b-'+x.r.prio+'">'+x.r.prio+'</span></td>'+
        '</tr>';
    });
    html+='</tbody></table></div>'+
      '<div class="note">Soonest and most dangerous at the top. ⚑ = noble speed (can take the village), ⚔ = siege speed. Click a row\'s coords into the manual analyser below for the full per-unit breakdown. <strong>Scout to confirm</strong> — timing shows the slowest possible unit, not their actual army.</div></div>';
    out.innerHTML=html;
  }

  /* =====================================================================
     03 — ATTACK TIMING
     ===================================================================== */
  function timingCoords(){
    const o=val('tOrigin').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    const t=val('tTarget').match(/(\d{1,3})\s*\|\s*(\d{1,3})/);
    if(!o){getById('timingOut').innerHTML=`<div class="err">Enter <strong>your</strong> village coords as X|Y. Press "Grab my coords" in the title bar to auto-fill.</div>`;return null;}
    if(!t){getById('timingOut').innerHTML=`<div class="err">Enter the <strong>target</strong> coords as X|Y (where you're attacking).</div>`;return null;}
    return {ox:+o[1],oy:+o[2],tx:+t[1],ty:+t[2],ws:+val('tWorld'),us:+val('tUnitSpd'),offset: +val('tOffset')||0};
  }
  function compareAllUnits(){
    const c=timingCoords(); if(!c) return;
    const {ox,oy,tx,ty,ws,us,offset}=c;
    const d=distance(ox,oy,tx,ty);
    const now=new Date();
    const srvNow=new Date(now.getTime()+offset*60000);
    const rows=UNIT_ORDER.map(u=>({u,label:UNITS[u].label,min:travelMinutes(d,u,ws,us),lands:new Date(srvNow.getTime()+travelMinutes(d,u,ws,us)*60000)}))
                         .sort((a,b)=>a.min-b.min);
    let html=`<div class="card"><div class="eyebrow">Travel times · ${ox}|${oy} → ${tx}|${ty}</div><div class="stat-row">
        <div class="stat"><div class="v mono">${d.toFixed(2)}</div><div class="l">fields between</div></div>
        <div class="stat"><div class="v mono">${hms(srvNow)}</div><div class="l">server time now</div></div>
      </div></div>
      <div class="tbl-wrap"><table><thead><tr><th>Unit</th><th class="mono">Travel time</th><th class="mono">Lands if sent now (server)</th></tr></thead><tbody>`;
    rows.forEach(r=>{html+=`<tr><td>${r.label}</td><td class="mono">${fmtDur(r.min)}</td><td class="mono">${hms(r.lands)}</td></tr>`;});
    html+=`</tbody></table></div><div class="note">Distances are equal for all units — only speed differs. "Lands if sent now" assumes you click send this second.</div>`;
    getById('timingOut').innerHTML=html;
  }
  function sendTimeCalc(){
    const c=timingCoords(); if(!c) return;
    const {ox,oy,tx,ty,ws,us,offset}=c;
    const now = new Date();
    const srvNow=new Date(now.getTime()+offset*60000);
    const arr = parseArrival(val('tArrive'), offset, now);
    const out=getById('timingOut');
    if(!arr){out.innerHTML=`<div class="err">Enter a <strong>desired arrival</strong> time as HH:MM:SS (server time) — the moment you want the attack to land.</div>`;return;}
    const d=distance(ox,oy,tx,ty);
    const rows=UNIT_ORDER.map(u=>{
      const min=travelMinutes(d,u,ws,us);
      const send = new Date(arr.getTime() - min*60000);
      const late = send < srvNow; // send time already passed
      return {label:UNITS[u].label,min,send,late};
    }).sort((a,b)=>a.min-b.min);
    let html=`<div class="card"><div class="eyebrow">Send schedule · land at ${hms(arr)} server</div>
      <p style="margin:0;font-size:14px;">To land at <span class="mono" style="color:var(--wax);font-weight:700;">${hms(arr)}</span> (server) over <span class="mono">${d.toFixed(2)}</span> fields. Server time now is <span class="mono">${hms(srvNow)}</span>. Send each unit at its clock time below:</p></div>
      <div class="tbl-wrap"><table><thead><tr><th>Unit</th><th class="mono">Send at (server)</th><th class="mono">Travel</th><th>Status</th></tr></thead><tbody>`;
    rows.forEach(r=>{html+=`<tr${r.late?' style="opacity:.55;"':''}><td>${r.label}</td><td class="mono" style="font-weight:700;">${hms(r.send)}</td><td class="mono">${fmtDur(r.min)}</td><td>${r.late?'<span style="color:var(--wax);">too late — send time passed</span>':'<span style="color:var(--good);">still possible</span>'}</td></tr>`;});
    html+=`</tbody></table></div><div class="note">All times are <strong>server time</strong>. Units marked "too late" would have needed to leave already to hit that arrival. If your device clock differs from the server, the offset field above corrects it (auto-detected when possible).</div>`;
    var nb=nightBonusWarning(arr);
    if(nb) html+='<div class="note" style="border-color:var(--wax);background:rgba(124,31,26,.06);">🌙 '+nb+'</div>';
    out.innerHTML=html;
  }

  // Noble train: compute send-times for N nobles landing `gap` seconds apart, first at ntArrive.
  // Uses the From/To coords + world speed from the timing tab; noble speed from game or override.
  function nobleTrain(){
    const c=timingCoords(); if(!c) return;
    const {ox,oy,tx,ty,ws,us,offset}=c;
    const out=getById('timingOut');
    const now=new Date(), srvNow=new Date(now.getTime()+offset*60000);
    const firstArr=parseArrival(val('ntArrive'), offset, now);
    if(!firstArr){ out.innerHTML='<div class="err">Enter when the <strong>first noble</strong> should land as HH:MM:SS (server time).</div>'; return; }
    var count=Math.max(1, Math.min(20, parseInt(val('ntCount'))||4));
    var gapSec=parseFloat(val('ntGap')); if(isNaN(gapSec)||gapSec<=0) gapSec=0.5;
    // noble travel: use override speed, else the game's noble speed (35 base) scaled by world/unit speed
    var nobleBase = parseFloat(val('ntNobleSpd'));
    if(isNaN(nobleBase)) nobleBase = (UNITS.noble?UNITS.noble.speed:35);
    var d=distance(ox,oy,tx,ty);
    var travelMin = nobleBase*d/(ws*us); // minutes
    var travelMs = travelMin*60000;

    var rows=[];
    for(var i=0;i<count;i++){
      var landMs = firstArr.getTime() + i*gapSec*1000; // each noble lands gap sec after the previous
      var sendMs = landMs - travelMs;
      rows.push({ n:i+1, land:new Date(landMs), send:new Date(sendMs), late:(sendMs < srvNow.getTime()) });
    }
    var anyLate=rows.some(function(r){ return r.late; });

    var html='<div class="card"><div class="eyebrow">Noble train · '+count+' nobles · first lands '+hms(firstArr)+' server</div>'+
      '<p style="margin:0 0 6px;font-size:14px;">Over <span class="mono">'+d.toFixed(2)+'</span> fields, each noble travels <span class="mono">'+fmtDur(travelMin)+'</span>. Send each at its clock time so they land '+gapSec+'s apart. Server time now: <span class="mono">'+hms(srvNow)+'</span>.</p></div>'+
      '<div class="tbl-wrap"><table><thead><tr><th>Noble</th><th class="mono">Send at (server)</th><th class="mono">Lands (server)</th><th>Status</th></tr></thead><tbody>';
    rows.forEach(function(r){
      html+='<tr'+(r.late?' style="opacity:.55;"':'')+'><td>#'+r.n+'</td>'+
        '<td class="mono" style="font-weight:700;">'+hmsMs(r.send)+'</td>'+
        '<td class="mono">'+hmsMs(r.land)+'</td>'+
        '<td>'+(r.late?'<span style="color:var(--wax);">too late</span>':'<span style="color:var(--good);">ok</span>')+'</td></tr>';
    });
    html+='</tbody></table></div>'+
      '<div class="note"><strong>Send the nobles behind a clearing nuke</strong> — a noble landing on a defended village dies. Times show tenths of a second because trains are that tight; you\'ll be clicking fast. '+(anyLate?'<span style="color:var(--wax);">Some sends are already too late — pick a later landing time.</span>':'All sends are still ahead — good.')+' Scout the target first to confirm it\'ll be cleared.</div>';
    var nbt=nightBonusWarning(firstArr);
    if(nbt) html+='<div class="note" style="border-color:var(--wax);background:rgba(124,31,26,.06);">🌙 '+nbt+'</div>';
    html+='<div class="hint">Tip: browsers and OS timers have ~15ms jitter, and human clicks aren\'t exact. Aim to click a hair EARLY rather than late — a noble landing 0.1s early still works; 0.1s late can miss the train. For real precision, many players use the in-game rally-point clock and click on the second.</div>';
    out.innerHTML=html;
  }

  // HH:MM:SS.d — includes tenths of a second, for tight train timing
  function hmsMs(d){
    var p=function(n){return String(n).padStart(2,'0');};
    var tenth=Math.floor(d.getMilliseconds()/100);
    return p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds())+'.'+tenth;
  }

  // Night bonus: many TW worlds give defenders a large bonus for attacks landing at night
  // (commonly 00:00–08:00 server time). Returns a warning string if the arrival is in that
  // window, or '' otherwise. Worlds vary — this is a heads-up, not a guarantee.
  function nightBonusWarning(arrivalDate){
    if(!arrivalDate) return '';
    var h=arrivalDate.getHours();
    if(h>=0 && h<8){
      return 'This lands at '+String(h).padStart(2,'0')+':00–08:00 server time — if your world has a <strong>night bonus</strong>, defenders get a big boost then and your attack hits much weaker. Consider landing outside the night window. (Not all worlds have night bonus — check yours.)';
    }
    return '';
  }
  const BUILD_PLANS={
    defense:{
      fresh:[
        ["Headquarters","→ 5","Unlocks the buildings you need next; keeps early build times short."],
        ["Timber / Clay / Iron","→ 8–10 each, balanced","Everything downstream is paid for in resources. Never let one lag."],
        ["Barracks","→ 5","Start spear production the moment it's up. Spears are your first defense."],
        ["Warehouse & Farm","keep ahead","Farm at 80% population, always. A capped farm stalls your queue."],
        ["Wall","→ 5","Even a low wall multiplies every defender. Cheap insurance."],
      ],
      developing:[
        ["Headquarters","→ 15","Faster building lets everything else climb quickly."],
        ["Smithy","Spear → Sword","Research spear then sword. You need both — spear stops cavalry, sword stops infantry."],
        ["Wall","→ 20","The strongest defensive building in the game. Rush it. Rebuild after every hit."],
        ["Barracks","→ 25 (max)","Continuous spear/sword production. Never an idle queue."],
        ["Market","→ 10","Balance resources; trade surplus into your bottleneck."],
        ["Stable","→ 10, once economy is stable","Adds Scouts, then Heavy Cavalry for fast support."],
      ],
      established:[
        ["Wall 20 · Barracks 25","hold the line","Your permanent floor. Keep both maxed and the queue full."],
        ["Target army","10k Spear / 10k Sword (rear) or 8k Spear / 2k HCav (front)","Rear stacks for efficiency; front builds for triple rebuild speed."],
        ["Farm / Warehouse","→ 30","Feed the army and bank a full day's production."],
        ["Support pool","~3,200 HCav in rear villages","Fast reinforcement for allies under attack."],
        ["Never","Axes, Workshop, wall left down","These waste a defensive village. Discipline wins wars."],
      ],
    },
    offense:{
      fresh:[
        ["Headquarters","→ 5","Unlocks the chain; short build times early."],
        ["Resources","push hard","Offense is expensive — you can't out-recruit a weak economy."],
        ["Barracks","→ 5","Farm with early spears while the real army is still coming."],
        ["Farm & Warehouse","keep ahead","Farm at 80% population. Bank resources for the LC leap."],
      ],
      developing:[
        ["Headquarters","→ 15","Speed for the buildings and the recruitment to come."],
        ["Smithy","Axe → Light Cav → Ram, → 20","Smithy 20 is a hard prerequisite for the Academy later."],
        ["Stable","→ 20 (max)","Light Cavalry is the engine — best attacker, fastest, best farmer."],
        ["Workshop","→ Rams","Needs HQ 10 + Smithy 10. Rams break walls before combat."],
        ["Wall","→ 5 only","You are not defending here. Don't overinvest."],
      ],
      established:[
        ["The nuke","~6,000 Axe / 3,000 LC / 250–300 Ram","Fastest army to build — more nukes, more often. LC cuts swords better than axes."],
        ["Rams","250–300 every nuke","The wall multiplies their whole stack. No rams = dead nuke. No exceptions."],
        ["Academy","HQ 20 + Smithy 20 + Market 10","Then mint coins: 1st noble = 1 coin, 2nd = +2, 3rd = +3."],
        ["Nobles","4 per target, behind the clearing nuke","A noble on an uncleared village is 100 pop and 140k thrown away. Scout first."],
        ["Never","Spear/Sword here, idle army, half-nukes","They steal farm space or waste the village. Spend the nuke or farm with it."],
      ],
    },
  };
  /* -------- read current village building levels + resources --------
     Levels come from BuildingMain.buildings (HQ screen) or game_data.village.buildings.
     Returns null if neither is available on this screen. */
  function readVillageState(){
    var gd=null;
    try { gd = window.game_data || (typeof unsafeWindow!=='undefined' ? unsafeWindow.game_data : null); } catch(e){}
    if(!gd || !gd.village) return null;

    var v=gd.village;
    var buildings=null;

    // preferred: BuildingMain.buildings (levels as numbers), on the main/HQ screen
    try {
      var bm = window.BuildingMain || (typeof unsafeWindow!=='undefined' ? unsafeWindow.BuildingMain : null);
      if(bm && bm.buildings) buildings=bm.buildings;
    } catch(e){}
    // fallback: game_data.village.buildings (levels as strings)
    if(!buildings && v.buildings) buildings=v.buildings;
    if(!buildings){ return { noBuildings:true, id:v.id, name:v.name, x:v.x, y:v.y, points:+v.points||0,
                            pop:v.pop!=null?+v.pop:null, popMax:v.pop_max!=null?+v.pop_max:null }; }

    function lvl(key){ var b=buildings[key]; if(b==null) return 0; return parseInt(b.level!=null?b.level:b)||0; }

    // read HOME troop counts (units currently standing in this village).
    // This is tricky: game_data.units is INCONSISTENT — on many worlds it's an array of
    // unit type-names, NOT a {spear:340} counts object. So we validate it holds numbers
    // before trusting it, then fall back to parsing the counts TW renders in the page.
    var units=null, unitsAvailable=false;

    var UNIT_CODES=['spear','sword','axe','archer','spy','light','marcher','heavy','ram','catapult','snob','knight'];
    // map TW internal code -> our key
    var CODE2KEY={spear:'spear',sword:'sword',axe:'axe',archer:'archer',spy:'scout',light:'light_cavalry',marcher:'mounted_archer',heavy:'heavy_cavalry',ram:'ram',catapult:'catapult',snob:'noble',knight:'paladin'};

    function blankUnits(){ return {spear:0,sword:0,axe:0,archer:0,scout:0,light_cavalry:0,mounted_archer:0,heavy_cavalry:0,ram:0,catapult:0,noble:0,paladin:0}; }

    // --- source 1: game_data.units, but ONLY if it's a code->number map ---
    try {
      var gu = gd.units;
      if(gu && typeof gu==='object' && !Array.isArray(gu)){
        // check at least one known code maps to a number
        var hasNumbers=UNIT_CODES.some(function(c){ return typeof gu[c]==='number' || (gu[c]!=null && !isNaN(parseInt(gu[c])) && String(gu[c]).trim()!==''); });
        if(hasNumbers){
          units=blankUnits(); unitsAvailable=true;
          UNIT_CODES.forEach(function(c){ var n=parseInt(gu[c]); if(!isNaN(n)) units[CODE2KEY[c]]=n; });
        }
      }
    } catch(e){}

    // --- source 2: parse the counts TW renders on the page (rally point / overview) ---
    // TW commonly renders per-unit counts in elements whose id contains the unit code,
    // e.g. #units_home rows, or spans like ".unit-item-spear", or the rally point "own" row.
    if(!unitsAvailable){
      try {
        var parsed=blankUnits(); var gotAny=false;
        UNIT_CODES.forEach(function(c){
          // try several selector patterns TW uses across screens/worlds
          var el = document.querySelector('#units_home #'+c) ||
                   document.querySelector('.units-entry-all.unit-item-'+c) ||
                   document.querySelector('#units_entry_all_'+c) ||
                   document.querySelector('a.unit_link[data-unit="'+c+'"]') ||
                   document.querySelector('td.unit-item-'+c);
          if(el){
            var m=(el.textContent||'').replace(/[.,\s]/g,'').match(/\d+/);
            if(m){ parsed[CODE2KEY[c]]=parseInt(m[0])||0; gotAny=true; }
          }
        });
        // also try the rally point "own troops" row: inputs have a sibling count like "(340)"
        if(!gotAny){
          UNIT_CODES.forEach(function(c){
            var inp=document.getElementById('unit_input_'+c);
            if(inp){
              // the available count is often in a link/span next to the input, e.g. "(340)"
              var holder=inp.closest('td')||inp.parentNode;
              var txt=holder?holder.textContent:'';
              var m=txt.match(/\((\d[\d.,]*)\)/);
              if(m){ parsed[CODE2KEY[c]]=parseInt(m[1].replace(/[.,]/g,''))||0; gotAny=true; }
            }
          });
        }
        if(gotAny){ units=parsed; unitsAvailable=true; }
      } catch(e){}
    }

    return {
      id:v.id, name:v.name, x:v.x, y:v.y, points:+v.points||0,
      pop: v.pop!=null?+v.pop:null, popMax: v.pop_max!=null?+v.pop_max:null,
      wood: v.wood!=null?Math.floor(v.wood):null, clay: v.clay!=null?Math.floor(v.clay):null, iron: v.iron!=null?Math.floor(v.iron):null,
      storageMax: v.storage_max!=null?+v.storage_max:null,
      woodProd: v.wood_prod!=null?+v.wood_prod:null, clayProd: v.clay_prod!=null?+v.clay_prod:null, ironProd: v.iron_prod!=null?+v.iron_prod:null,
      unitsAvailable: unitsAvailable, units: units,
      b: {
        headquarters:lvl('main'), barracks:lvl('barracks'), smithy:lvl('smith'),
        stable:lvl('stable'), workshop:lvl('garage'), academy:lvl('snob'),
        market:lvl('market'), wall:lvl('wall'), warehouse:lvl('storage'),
        farm:lvl('farm'), timber_camp:lvl('wood'), clay_pit:lvl('stone'),
        iron_mine:lvl('iron'), rally_point:lvl('place'), hiding_place:lvl('hide'),
        statue:lvl('statue'), watchtower:lvl('watchtower')
      }
    };
  }

  // decide fresh / developing / established from HQ level AND total points.
  // Points reflect ALL buildings summed, so they catch a village that rushed HQ but
  // neglected everything else (high HQ, low points = still really 'developing').
  function detectStage(b, points){
    var hq=b.headquarters||0;
    points=points||0;
    // primary read from HQ
    var byHq = hq<=6 ? 'fresh' : (hq<=15 ? 'developing' : 'established');
    // points sanity: a genuinely established village is usually 6k+ points; developing 1.5k-6k
    var byPts = points<1500 ? 'fresh' : (points<6000 ? 'developing' : 'established');
    // take the LOWER of the two — a high HQ with low points isn't really established
    var order={fresh:0, developing:1, established:2}, names=['fresh','developing','established'];
    return names[Math.min(order[byHq], order[byPts])];
  }

  // village health check: flags imbalance from points vs building levels
  function villageHealth(b, points, stage){
    var flags=[];
    var hq=b.headquarters||0;
    var resAvg=Math.round(((b.timber_camp||0)+(b.clay_pit||0)+(b.iron_mine||0))/3);

    // rushed HQ: HQ far ahead of overall development (points)
    if(hq>=18 && points<5000) flags.push({t:'warn', m:'Your HQ is high ('+hq+') but total points are low ('+points.toLocaleString()+') — you rushed Headquarters and left the rest behind. Catch up resources, farm and warehouse before pushing HQ further.'});
    // economy lagging HQ
    if(hq>=10 && resAvg<hq-4) flags.push({t:'warn', m:'Your resource pits (avg level '+resAvg+') are lagging your HQ ('+hq+'). A village lives or dies on resource income — bring the three pits up to within a few levels of your HQ.'});
    // warehouse too small to afford big upgrades
    if(hq>=12 && (b.warehouse||0)<hq-6) flags.push({t:'warn', m:'Warehouse (level '+(b.warehouse||0)+') is small for your HQ — you may not be able to bank enough for the next big upgrade. Raise it.'});
    // farm nearly capping
    // (can't see live pop headroom reliably here; handled elsewhere)
    // wall neglected (matters for every village)
    if(hq>=8 && (b.wall||0)<3) flags.push({t:'crit', m:'Your Wall is very low (level '+(b.wall||0)+'). Even an offensive village wants a basic wall, and a defensive one needs it maxed — a wall multiplies every defender. Build it.'});
    // good shape
    if(!flags.length) flags.push({t:'ok', m:'This village looks well-balanced for its stage — points ('+points.toLocaleString()+') and building levels are developing together. Keep going per the plan below.'});
    return flags;
  }

  var BL = GAME.building_labels;

  /* -------- next-step engine --------
     Given role + read building levels, return an ordered list of concrete next moves
     with reasons, following the TW build logic. Each item: {label, target, why, priority}. */
  function nextSteps(role, b){
    var steps=[];
    function add(key, target, why, priority){
      var cur=b[key]||0;
      if(cur>=target) return;
      steps.push({ name:BL[key]||key, from:cur, to:target, why:why, priority:priority||false });
    }

    // shared economic backbone (both roles need resources + storage + farm)
    var resAvg=Math.round(((b.timber_camp||0)+(b.clay_pit||0)+(b.iron_mine||0))/3);

    if(role==='defense'){
      add('headquarters', 5, 'Unlocks the early chain and keeps build times short.', b.headquarters<3);
      add('barracks', 5, 'Start spear production immediately — spears are your first line.', b.headquarters>=3 && b.barracks<1);
      add('timber_camp', Math.max(resAvg+2,8), 'Feed the queue; keep the three pits climbing evenly.');
      add('clay_pit', Math.max(resAvg+2,8), 'Feed the queue; keep the three pits climbing evenly.');
      add('iron_mine', Math.max(resAvg+2,8), 'Feed the queue; keep the three pits climbing evenly.');
      add('warehouse', Math.max((b.headquarters||0),8), 'Bank enough to afford the next wall/barracks jump.');
      add('farm', Math.max((b.headquarters||0),8), 'Never cap population — a full farm freezes recruitment.');
      add('wall', 20, 'The single strongest defensive building. Rush it; rebuild after every hit.', b.wall<5);
      add('smithy', 20, 'Research spear then sword — spear stops cavalry, sword stops infantry.', b.headquarters>=5 && b.smithy<1);
      add('barracks', 25, 'Continuous spear/sword output. Never an idle queue.');
      add('market', 10, 'Balance resources; trade surplus into your bottleneck.');
      add('stable', 10, 'Once economy is stable, add Scouts then Heavy Cavalry for fast support.');
      add('headquarters', 20, 'Faster building lets everything else climb.');
      add('warehouse', 30, 'Hold a full day of production.');
      add('farm', 30, 'Feed the full defensive army.');
    } else {
      add('headquarters', 5, 'Unlocks the chain; short build times early.', b.headquarters<3);
      add('barracks', 5, 'Farm with early spears while the real army is still coming.', b.headquarters>=3 && b.barracks<1);
      add('timber_camp', Math.max(resAvg+2,8), 'Offense is expensive — economy first. Keep pits even.');
      add('clay_pit', Math.max(resAvg+2,8), 'Offense is expensive — economy first. Keep pits even.');
      add('iron_mine', Math.max(resAvg+2,8), 'Offense is expensive — economy first. Keep pits even.');
      add('warehouse', Math.max((b.headquarters||0),8), 'Bank resources for the Light Cavalry leap.');
      add('farm', Math.max((b.headquarters||0),8), 'Keep population headroom for a big army.');
      add('smithy', 20, 'Axe → Light Cav → Ram. Smithy 20 is required for the Academy later.', b.smithy<10);
      add('stable', 20, 'Light Cavalry is the engine — best attacker, fastest, best farmer.', b.headquarters>=10 && b.smithy>=5);
      add('workshop', 5, 'Rams break walls before combat. Needs HQ 10 + Smithy 10.', b.headquarters>=10 && b.smithy>=10 && b.workshop<1);
      add('headquarters', 20, 'Speed for the buildings and recruitment to come, and required for the Academy.');
      add('market', 10, 'Required for the Academy; also balances resources.');
      add('academy', 1, 'Then mint coins and build nobles. Needs HQ 20 + Smithy 20 + Market 10.', b.headquarters>=20 && b.smithy>=20 && b.market>=10);
      add('wall', 5, 'You are not defending here — don\'t overinvest past 5.');
    }
    return steps;
  }

  // troop-production advice from the read state
  // Detailed, staged troop guide. Returns [{h:'section header', items:['...']}] tailored
  // to the village's actual buildings and development stage. `units` = home troop counts
  // (or null if unreadable on this screen).
  function troopAdvice(role, b, units, unitsAvailable, stage){
    var hq=b.headquarters||0;
    if(!stage) stage = hq<=6 ? 'fresh' : (hq<=15 ? 'developing' : 'established');
    var sections=[];

    // target counts per role+stage, for gap analysis against what you actually have
    var TARGETS={
      defense:{ fresh:{spear:500,sword:150}, developing:{spear:3000,sword:2000}, established:{spear:10000,sword:10000,heavy_cavalry:0} },
      offense:{ fresh:{spear:200}, developing:{axe:3000,light_cavalry:1500,ram:150}, established:{axe:6000,light_cavalry:3000,ram:275} }
    };
    var UL={spear:'Spear',sword:'Sword',axe:'Axe',archer:'Archer',scout:'Scout',light_cavalry:'Light Cavalry',mounted_archer:'Mounted Archer',heavy_cavalry:'Heavy Cavalry',ram:'Ram',catapult:'Catapult',noble:'Nobleman'};

    // --- YOUR TROOPS vs TARGET (only if we could read counts) ---
    if(unitsAvailable && units){
      var tgt=TARGETS[role][stage]||{};
      var lines=[];
      // show what you have of the units that matter for this role
      var relevant = role==='defense' ? ['spear','sword','heavy_cavalry','scout'] : ['axe','light_cavalry','ram','scout','noble'];
      relevant.forEach(function(u){
        var have=units[u]||0;
        var want=tgt[u]||0;
        if(want>0){
          var gap=want-have;
          if(gap>0) lines.push(UL[u]+': you have '+have.toLocaleString()+' — build '+gap.toLocaleString()+' more to reach the '+want.toLocaleString()+' target for this stage.');
          else lines.push(UL[u]+': you have '+have.toLocaleString()+' — target of '+want.toLocaleString()+' MET. ✓');
        } else if(have>0){
          lines.push(UL[u]+': you have '+have.toLocaleString()+(role==='defense'&&(u==='axe'||u==='light_cavalry')?' — these are offensive units in a defensive village; consider moving them out.':''));
        }
      });
      if(!lines.length) lines.push('No relevant troops standing in this village yet — start recruiting per the targets below.');
      lines.push('Note: this counts only troops currently HOME in this village. Units out farming or attacking are not included, so your true totals may be higher.');
      sections.push({h:'Your troops vs target ('+stage+' stage)', items:lines});
    } else {
      sections.push({h:'Your troops', items:['Couldn\'t read troop counts on this screen. Open the rally point or Overview and Read again to see your counts compared to the targets. The targets below still apply.']});
    }

    if(role==='defense'){
      // --- what to build/enable next ---
      var setup=[];
      if(b.barracks<1) setup.push('Build the Barracks first (needs HQ 3). Until it exists you have no defence at all.');
      else setup.push('Barracks is level '+b.barracks+'. Raise it toward 25 over time — higher level = faster recruitment, which matters more than it looks when rebuilding after a hit.');
      if(b.smithy<1) setup.push('Build the Smithy (needs HQ 5 + Barracks 1) — you can\'t improve or unlock units without it.');
      else {
        setup.push('Smithy is level '+b.smithy+'. Research order for defence: Spear first, then Sword. Level each unit\'s research as resources allow — researched levels make your existing troops stronger, not just new ones.');
      }
      if(b.wall<20) setup.push('Push the Wall to 20 in parallel. It is not a troop, but it multiplies every defender you own — a maxed wall can be worth thousands of extra units. Rebuild it after every attack.');
      sections.push({h:'Set up (buildings & research)', items:setup});

      // --- the two core units, what they do ---
      sections.push({h:'The two units that matter', items:[
        'Spear Fighter — your anti-cavalry wall. Cheap, low population, stops Light Cavalry and mounted attacks cold. This is the bulk of your army.',
        'Swordsman — your anti-infantry wall. Beats Axemen and other infantry. Slower and pricier than spears but essential against offensive infantry nukes.',
        'You need BOTH, roughly balanced. An all-spear village folds to an axe nuke; an all-sword village folds to cavalry. The mix is the point.'
      ]});

      // --- target numbers scaled to stage ---
      var targets;
      if(stage==='fresh'){
        targets=[
          'Right now (fresh village): recruit Spears continuously — aim for your first 500 Spears as fast as the Barracks allows.',
          'Add Swords once the Smithy is up and Sword is researched — start a 3:1 spear:sword ratio (e.g. 300 spear / 100 sword).',
          'Don\'t touch cavalry or anything else yet. Spears + a rising wall keep a small village alive.'
        ];
      } else if(stage==='developing'){
        targets=[
          'Developing village: build toward roughly 3,000 Spear / 2,000 Sword as a first real defensive core.',
          'Keep the Barracks queue full at all times — an idle queue is wasted defence.',
          'Ratio guide: front-line villages (near the enemy) lean more Spear for cheap fast rebuilds; rear villages can afford a fuller Spear+Sword stack.'
        ];
      } else {
        targets=[
          'Established village: target around 10,000 Spear / 10,000 Sword for a full defensive village (rear), or ~8,000 Spear / 2,000 Heavy Cavalry if it is a front-line support village that must rebuild fast.',
          'Feed it: Farm and Warehouse toward 30 so population and resources can sustain the army.',
          'Once the core is up, build a pool of Heavy Cavalry in rear villages (~3,000) as fast reinforcement you can send to allies under attack.'
        ];
      }
      sections.push({h:'How many to build ('+stage+' stage)', items:targets});

      // --- stable / optional ---
      if(b.stable>=1){
        sections.push({h:'Stable ('+b.stable+') — support options', items:[
          'Scouts: build a handful for vision — knowing what is incoming is half of defending.',
          'Heavy Cavalry: excellent defensive stats and fast. Use it as mobile reinforcement, not as your main wall — it is expensive per unit.'
        ]});
      }
      // --- what NOT to do ---
      sections.push({h:'Do not', items:[
        'Do not build Axes, Light Cavalry (as attackers), Rams or Catapults here — they waste the population a defensive village needs for Spear/Sword.',
        'Do not leave the wall damaged. Rebuilding the wall comes before recruiting more troops.',
        'Do not let the Farm cap — a full farm freezes recruitment and your defence stops growing.'
      ]});

    } else {
      // OFFENSE
      var setupO=[];
      if(b.barracks<1) setupO.push('Build the Barracks (needs HQ 3). Early on it recruits Spears just for farming while your real army comes together.');
      else setupO.push('Barracks is level '+b.barracks+'. It produces your Axemen — the infantry half of a nuke.');
      if(b.smithy<10) setupO.push('Raise the Smithy toward 20 (needs HQ levels alongside). It is a hard requirement for the Academy later, and it unlocks/upgrades your attack units.');
      else setupO.push('Smithy is level '+b.smithy+'. Research order for offence: Axe → Light Cavalry → Ram. Level Axe and LC research high — it directly raises your nuke\'s hitting power.');
      if(b.stable<1) setupO.push('Build the Stable (needs HQ 10 + Barracks 5 + Smithy 5) as soon as you can — Light Cavalry is the single most important offensive unit and it lives here.');
      else setupO.push('Stable is level '+b.stable+'. Raise it toward 20 (max) for fast Light Cavalry production.');
      if(b.workshop<1) setupO.push('Build the Workshop (needs HQ 10 + Smithy 10) for Rams — without rams your nuke breaks on the enemy wall.');
      sections.push({h:'Set up (buildings & research)', items:setupO});

      sections.push({h:'The nuke — what goes in it', items:[
        'Axeman — cheap, high attack infantry. The bulk-damage core of your nuke.',
        'Light Cavalry — best attacker in the game per resource: high attack, fastest offensive unit, and it hauls loot so it farms while it travels. Prioritise these.',
        'Ram — does no killing but smashes the enemy wall so your Axe/LC land at full strength. A nuke with no rams gets eaten by the wall.',
        'A "nuke" is one full army sent as a single stacked attack — you build many nukes and throw them one at a time.'
      ]});

      var targetsO;
      if(stage==='fresh'){
        targetsO=[
          'Fresh village: recruit a few hundred Spears just to farm nearby barbs and fund the economy — do NOT try to build a nuke yet.',
          'Pour resources into the economy (pits, warehouse, farm) and into getting the Stable up. Offence is expensive; a weak economy can\'t sustain it.',
          'First real goal is the Stable + Smithy, not troop numbers.'
        ];
      } else if(stage==='developing'){
        targetsO=[
          'Developing village: start assembling your first nuke toward ~3,000 Axe / 1,500 Light Cavalry / 150 Ram.',
          'Keep Barracks and Stable queues full. Light Cavalry farming pays for its own production if you keep it raiding.',
          'Research Axe and LC as high as the Smithy allows before you finish the nuke — an under-researched nuke hits far softer.'
        ];
      } else {
        targetsO=[
          'Established village: a full nuke is roughly 6,000 Axe / 3,000 Light Cavalry / 250-300 Rams. Build that, then start on the next one — more nukes sent more often beats one perfect army.',
          'Rams: 250-300 in EVERY nuke, no exceptions — the enemy wall multiplies their whole defensive stack, so unbroken walls kill nukes.',
          'Light Cavalry cuts through Swordsmen better than Axes do, so lean on LC against well-defended targets.'
        ];
      }
      sections.push({h:'How many to build ('+stage+' stage)', items:targetsO});

      // academy / nobles
      if(b.academy>=1 || (b.headquarters>=20 && b.smithy>=20 && b.market>=10)){
        sections.push({h:'Academy & Nobles', items:[
          (b.academy>=1?'Academy is up. ':'You meet the Academy requirements (HQ 20 + Smithy 20 + Market 10) — build it. ')+'Mint coins, then build Noblemen.',
          'Send 4 Nobles per target, travelling BEHIND a clearing nuke — never send a noble at an uncleared village. A noble on a defended village is 100 population and ~140k resources thrown away.',
          'Always scout a target before nobling it, so you know it is actually cleared.'
        ]});
      }
      sections.push({h:'Do not', items:[
        'Do not build Spears or Swords here — defensive units steal the population your nuke needs.',
        'Do not send a nuke without rams, and do not send half a nuke — a partial army just feeds the enemy. Spend the full nuke or keep farming with it until it is full.',
        'Do not let the army sit idle. If it is not attacking, it should be farming.'
      ]});
    }
    return sections;
  }

  /* -------- growth tracking (per village, saved to disk) -------- */
  function villageSnapKey(id){ return 'wr_village_snap_'+id; }
  function growthReport(state){
    var key=villageSnapKey(state.id);
    var prevRaw=storeGet(key);
    var prev=null;
    if(prevRaw){ try { prev=JSON.parse(prevRaw); } catch(e){} }

    // build the new snapshot
    var snap={ t:Date.now(), points:state.points, b:state.b };
    try { storeSet(key, JSON.stringify(snap)); } catch(e){}

    if(!prev) return '<div class="note">First reading saved for this village. Next time you read it here, you\'ll see what changed.</div>';

    var when = prev.t ? new Date(prev.t) : null;
    var changes=[];
    if(prev.b && state.b){
      GAME.building_order.forEach(function(k){
        var a=prev.b[k]||0, c=state.b[k]||0;
        if(c!==a) changes.push((BL[k]||k)+' '+a+'→'+c);
      });
    }
    var dPts = state.points-(prev.points||0);

    var head = when ? ('Since last read '+when.toLocaleString()+':') : 'Since last read:';
    if(!changes.length && dPts===0){
      return '<div class="note"><strong>'+head+'</strong> no changes.</div>';
    }
    return '<div class="note"><strong>'+head+'</strong> '+
           (changes.length?changes.join(' · '):'no building changes')+
           (dPts!==0?(' · '+(dPts>0?'+':'')+dPts.toLocaleString()+' points'):'')+'</div>';
  }

  // MAIN: read the village and render tailored suggestions + growth
  function readVillageBuild(){
    var out=getById('buildOut');
    var role=val('bRole');
    var state=readVillageState();

    if(!state){
      out.innerHTML='<div class="err">Couldn\'t read this village — game data isn\'t available here.</div>'+
        '<div class="note">Open any normal in-game screen (Overview, HQ, rally point) and press Read again. If it never works even on those screens, your script manager may be sandboxing the page — see the warning banner at the top of the panel for how to fix that.</div>';
      return;
    }
    if(state.noBuildings){
      out.innerHTML='<div class="err">Read '+esc(state.name||('village '+state.id))+', but building levels aren\'t loaded on this screen.</div>'+
        '<div class="note">Open this village\'s <strong>Headquarters</strong> screen and press <strong>Read this village</strong> again — levels are only exposed there.</div>';
      return;
    }

    var b=state.b;
    var stage=detectStage(b, state.points);
    var stageLabel={fresh:'Fresh start',developing:'Developing',established:'Established'}[stage];
    var roleLabel=role==='defense'?'Defensive':'Offensive';
    var health=villageHealth(b, state.points, stage);
    var steps=nextSteps(role, b);
    var next=steps.length?steps[0]:null;

    // top priority = first flagged step, else first step
    var priority=steps.find(function(s){ return s.priority; }) || next;

    var levelsRow=GAME.building_order.filter(function(k){ return (b[k]||0)>0; })
      .map(function(k){ return '<span class="mono" style="display:inline-block;margin:2px 10px 2px 0;"><span style="color:var(--ink-soft);">'+esc(BL[k])+'</span> '+b[k]+'</span>'; }).join('');

    // compact home-troops row (units currently in the village)
    var troopsRow='';
    if(state.unitsAvailable && state.units){
      var TL={spear:'Spear',sword:'Sword',axe:'Axe',archer:'Archer',scout:'Scout',light_cavalry:'LC',mounted_archer:'MA',heavy_cavalry:'HC',ram:'Ram',catapult:'Cat',noble:'Noble'};
      var parts=Object.keys(TL).filter(function(u){ return (state.units[u]||0)>0; })
        .map(function(u){ return '<span class="mono" style="display:inline-block;margin:2px 10px 2px 0;"><span style="color:var(--ink-soft);">'+TL[u]+'</span> '+(state.units[u]).toLocaleString()+'</span>'; });
      troopsRow = parts.length
        ? '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--parchment-line);font-size:13px;color:var(--ink-soft);"><span style="font-family:\'Cinzel\';font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--wax);">Home troops</span><br>'+parts.join('')+'</div>'
        : '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--parchment-line);font-size:13px;color:var(--ink-soft);font-style:italic;">No troops currently standing in this village.</div>';
    }

    var html='<div class="card">'+
      '<div class="eyebrow">'+roleLabel+' · '+stageLabel+' · '+esc(state.name||('Village '+state.id))+' '+state.x+'|'+state.y+'</div>'+
      '<div class="stat-row">'+
        '<div class="stat"><div class="v mono">'+state.points.toLocaleString()+'</div><div class="l">points</div></div>'+
        (state.pop!=null?('<div class="stat"><div class="v mono">'+state.pop+(state.popMax!=null?('/'+state.popMax):'')+'</div><div class="l">population</div></div>'):'')+
        '<div class="stat"><div class="v">'+esc(BL.headquarters)+' '+b.headquarters+'</div><div class="l">HQ level</div></div>'+
      '</div>'+
      (priority?('<div class="note" style="border-color:var(--crit);background:rgba(107,31,31,.08)"><strong>Do next:</strong> '+esc(priority.name)+' → level '+priority.to+'. '+esc(priority.why)+'</div>'):'')+
      '<div style="margin-top:6px;font-size:13px;color:var(--ink-soft);">'+levelsRow+'</div>'+
      troopsRow+
    '</div>';

    // village health — points vs building balance
    html+='<div class="card"><div class="eyebrow">Village health · '+state.points.toLocaleString()+' points</div>';
    health.forEach(function(fl){
      var col = fl.t==='crit' ? 'var(--crit)' : (fl.t==='warn' ? 'var(--wax)' : 'var(--good)');
      var bg  = fl.t==='crit' ? 'rgba(107,31,31,.08)' : (fl.t==='warn' ? 'rgba(124,31,26,.06)' : 'rgba(63,107,63,.08)');
      html+='<div class="note" style="border-color:'+col+';background:'+bg+';margin-top:8px;">'+esc(fl.m)+'</div>';
    });
    html+='</div>';

    // resource status (current amounts, storage fill, waste/low warnings)
    if(state.wood!=null && state.clay!=null && state.iron!=null){
      var cap=state.storageMax;
      function resCell(label, amt, prod){
        var pct = (cap && cap>0) ? Math.round(amt/cap*100) : null;
        var barColor = pct==null ? 'var(--ink-soft)' : (pct>=95?'var(--crit)':(pct>=80?'var(--wax)':'var(--good)'));
        return '<div class="stat" style="min-width:120px;">'+
          '<div class="v mono">'+amt.toLocaleString()+(cap?('<span style="font-size:12px;color:var(--ink-soft);"> / '+cap.toLocaleString()+'</span>'):'')+'</div>'+
          '<div class="l">'+label+(pct!=null?(' · <span style="color:'+barColor+';">'+pct+'%</span>'):'')+(prod!=null?(' · +'+prod+'/h'):'')+'</div>'+
          '</div>';
      }
      html+='<div class="card"><div class="eyebrow">Resources'+(cap?(' · warehouse '+cap.toLocaleString()):'')+'</div>'+
        '<div class="stat-row">'+
          resCell('Wood', state.wood, state.woodProd)+
          resCell('Clay', state.clay, state.clayProd)+
          resCell('Iron', state.iron, state.ironProd)+
        '</div>';
      // waste / low warnings
      if(cap && cap>0){
        var near=[]; var low=[];
        [['Wood',state.wood],['Clay',state.clay],['Iron',state.iron]].forEach(function(r){
          var p=r[1]/cap;
          if(p>=0.95) near.push(r[0]);
          else if(r[1]<cap*0.05) low.push(r[0]);
        });
        if(near.length) html+='<div class="note" style="border-color:var(--crit);background:rgba(107,31,31,.08);margin-top:10px;"><strong>Warehouse nearly full ('+near.join(', ')+').</strong> You are wasting production — spend on an upgrade or troops now, or overflow is lost.</div>';
        if(low.length) html+='<div class="note" style="margin-top:10px;">Low on '+low.join(', ')+' — may bottleneck your next build. Farm or trade to top up.</div>';
      }
      html+='<div class="hint" style="margin-top:8px;">Exact upgrade costs aren\'t shown — the game doesn\'t expose them to scripts, and faking them would mislead. This shows what you have so you can judge against the in-game cost.</div>';
      html+='</div>';
    }

    // ordered next moves
    if(steps.length){
      html+='<div class="card"><div class="eyebrow">Next moves, in order</div>';
      steps.slice(0,8).forEach(function(s,i){
        html+='<div class="step"><div class="num">'+(i+1)+'</div><div class="body">'+
              '<div class="h">'+esc(s.name)+'<span class="lvl">'+s.from+' → '+s.to+'</span></div>'+
              '<div class="why">'+esc(s.why)+'</div></div></div>';
      });
      html+='</div>';
    } else {
      html+='<div class="card"><div class="ok">This village has hit the guide\'s targets for a '+roleLabel.toLowerCase()+' build. Keep queues full and the wall (defense) maxed.</div></div>';
    }

    // troop production
    var troops=troopAdvice(role, b, state.units, state.unitsAvailable, stage);
    if(troops.length){
      html+='<div class="card"><div class="eyebrow">Troop guide — '+(role==='defense'?'defensive':'offensive')+' village</div>';
      troops.forEach(function(sec){
        html+='<div style="margin-top:14px;"><div style="font-family:\'Cinzel\',serif;font-weight:700;font-size:14.5px;color:var(--ink);letter-spacing:.02em;margin-bottom:6px;">'+esc(sec.h)+'</div>'+
              '<ul style="margin:0;padding-left:18px;">'+
              sec.items.map(function(t){ return '<li style="margin-bottom:6px;font-size:14px;color:var(--ink-soft);line-height:1.5;">'+esc(t)+'</li>'; }).join('')+
              '</ul></div>';
      });
      html+='</div>';
    }

    // growth since last visit
    html+=growthReport(state);

    html+='<div class="note"><strong>You build.</strong> Read from the current village only — open the guide on each village\'s page for that village. The tool advises; you click.</div>';

    out.innerHTML=html;
  }

  function showBuildPlan(){
    const role=val('bRole');
    const roleLabel=role==='defense'?'Defensive village':'Offensive village';
    const stages=[['fresh','Fresh start'],['developing','Developing'],['established','Established']];
    let html='';
    stages.forEach(function(st){
      const plan=BUILD_PLANS[role][st[0]];
      html+=`<div class="card"><div class="eyebrow">${roleLabel} · ${st[1]}</div>`;
      plan.forEach((s,i)=>{
        html+=`<div class="step">
          <div class="num">${i+1}</div>
          <div class="body"><div class="h">${esc(s[0])}<span class="lvl">${esc(s[1])}</span></div>
          <div class="why">${esc(s[2])}</div></div></div>`;
      });
      html+=`</div>`;
    });
    html+=`<div class="note"><strong>Generic guide</strong> — the full path for a ${roleLabel.toLowerCase()}. For advice tailored to this village's real levels, use <strong>Read this village</strong>.</div>`;
    getById('buildOut').innerHTML=html;
  }

  /* =====================================================================
     05 — WORLD DATA
     ===================================================================== */
  function urlDecode(s){try{return decodeURIComponent(s.replace(/\+/g,' '));}catch(e){return s;}}
  function loadWorldData(){
    const out=getById('dataOut');
    const pTxt=val('dPlayers'), vTxt=val('dVillages');
    WORLD_PLAYERS={}; WORLD_VILLAGES=[]; WORLD_ALLIES={};

    // detect if the paste is actually HTML (wrong page copied) rather than raw data
    function looksLikeHtml(s){ return /<\s*(html|body|div|table|!doctype|script)/i.test(s.slice(0,500)); }
    // TW map files are delimiter-separated — semicolons on most worlds, commas on some.
    // Auto-detect per file from the first data line (names are URL-encoded, so a comma
    // never appears inside a name — safe to split on).
    function detectDelim(txt){
      var first=txt.split('\n').filter(function(l){return l.trim()!=='';})[0]||'';
      var semis=(first.match(/;/g)||[]).length;
      var commas=(first.match(/,/g)||[]).length;
      return commas>semis ? ',' : ';';
    }
    var vDelim=detectDelim(vTxt), pDelim=detectDelim(pTxt);
    function splitLine(line, delim){ return line.split(delim); }

    var vDiag='';
    if(vTxt.trim()===''){
      vDiag='the villages box is empty';
    } else if(looksLikeHtml(vTxt)){
      vDiag='that looks like a web page (HTML), not the raw village.txt. The link may have redirected — open '+location.host+'/map/village.txt directly and make sure it shows plain lines of numbers separated by semicolons';
    }

    // players first (optional; naming still works with villages alone if player.txt is present)
    pTxt.split('\n').forEach(function(line){
      var r=splitLine(line, pDelim); if(r.length<2) return;
      var id=parseInt(r[0]); if(isNaN(id)) return;
      WORLD_PLAYERS[id]={name:urlDecode((r[1]||'').trim()),ally:+r[2]||0,villages:+r[3]||0,points:+r[4]||0,rank:+r[5]||0};
    });

    // allies (optional; gives Intel the tribe TAG instead of just an ID)
    // ally.txt format: id;name;tag;members;villages;points;rank
    var aTxt=val('dAllies');
    if(aTxt && aTxt.trim()){
      var aDelim=detectDelim(aTxt);
      aTxt.split('\n').forEach(function(line){
        var r=splitLine(line, aDelim); if(r.length<3) return;
        var id=parseInt(r[0]); if(isNaN(id)) return;
        WORLD_ALLIES[id]={name:urlDecode((r[1]||'').trim()), tag:urlDecode((r[2]||'').trim()), members:+r[3]||0, villages:+r[4]||0, points:+r[5]||0, rank:+r[6]||0};
      });
    }

    var vLines=0, vBad=0;
    vTxt.split('\n').forEach(function(line){
      if(line.trim()==='') return;
      vLines++;
      var r=splitLine(line, vDelim);
      if(r.length<4){ vBad++; return; }
      var id=parseInt(r[0]), x=parseInt(r[2]), y=parseInt(r[3]);
      if([id,x,y].some(isNaN)){ vBad++; return; }
      WORLD_VILLAGES.push({id:id,name:urlDecode((r[1]||'').trim()),x:x,y:y,player_id:parseInt(r[4])||0,points:+r[5]||0,rank:+r[6]||0});
    });

    const np=Object.keys(WORLD_PLAYERS).length, nv=WORLD_VILLAGES.length;

    if(!nv){
      var why;
      if(vDiag) why=vDiag+'.';
      else if(vLines===0) why='no lines were found in the villages box.';
      else {
        // show what the first non-empty line actually looked like, to diagnose the delimiter
        var firstLine=vTxt.split('\n').filter(function(l){return l.trim()!=='';})[0]||'';
        var seps=(firstLine.match(/[;,]/g)||[]).length;
        if(seps===0) why='the lines have no semicolons or commas — this may not be a TW map export. Your first line looked like: "'+esc(firstLine.slice(0,80))+'".';
        else why='the columns didn\'t line up (found '+vLines+' lines, '+vBad+' unparseable, delimiter "'+vDelim+'"). Expected id'+vDelim+'name'+vDelim+'x'+vDelim+'y'+vDelim+'player_id'+vDelim+'points'+vDelim+'rank. Your first line: "'+esc(firstLine.slice(0,80))+'".';
      }
      out.innerHTML=`<div class="err">No villages parsed — `+why+`</div>`+
        `<div class="note">Open <a class="inline" href="`+location.protocol+`//`+location.host+`/map/village.txt" target="_blank" rel="noopener">`+location.host+`/map/village.txt</a> — it should show plain text lines like <span class="mono">1;Barbarian+village;500;500;0;26;9999</span>. Select all, copy, and paste into the <strong>villages</strong> box (the top one).</div>`;
      return;
    }

    // persist so it survives reloads (like the rest of the tool)
    try { storeSet('wr_world_villages', JSON.stringify(WORLD_VILLAGES)); storeSet('wr_world_players', JSON.stringify(WORLD_PLAYERS)); storeSet('wr_world_allies', JSON.stringify(WORLD_ALLIES)); } catch(e){}

    var barbs=WORLD_VILLAGES.filter(function(v){return v.player_id===0;}).length;
    var owned=nv-barbs;
    out.innerHTML=`<div class="card"><div class="eyebrow">Ledger loaded</div>
      <div class="stat-row">
        <div class="stat"><div class="v mono">${nv.toLocaleString()}</div><div class="l">villages</div></div>
        <div class="stat"><div class="v mono">${owned.toLocaleString()}</div><div class="l">player-owned</div></div>
        <div class="stat"><div class="v mono">${barbs.toLocaleString()}</div><div class="l">barbarian</div></div>
        <div class="stat"><div class="v mono">${np.toLocaleString()}</div><div class="l">players</div></div>
      </div>
      ${np===0?'<div class="note">Villages loaded, but no players — paste <strong>player.txt</strong> in the lower box too, so Intel can show attacker names (not just village owners by ID).</div>':''}
      <div class="note" style="border-color:var(--good);background:rgba(63,107,63,.08);">Saved. <strong>Attacker Intel</strong> can now name the owner of any incoming attack's origin village and list all their villages. This stays loaded across reloads.</div>
      </div>`;
  }

  // restore saved world data on load so Intel naming works without re-pasting
  function restoreWorldData(){
    try {
      var v=storeGet('wr_world_villages'), p=storeGet('wr_world_players'), a=storeGet('wr_world_allies');
      if(v) WORLD_VILLAGES=JSON.parse(v);
      if(p) WORLD_PLAYERS=JSON.parse(p);
      if(a) WORLD_ALLIES=JSON.parse(a);
    } catch(e){ _loadErrors.push('world data'); }
  }

  /* =====================================================================
     plumbing
     ===================================================================== */
  function val(id){return getById(id).value;}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  var HANDLERS = {
    planSingle, clearFarmUnits,
    planAttack, fillAttackRally, focusAttackRally, clearAttackUnits,
    analyzeIntel, analyzeIntelPaste,
    compareAllUnits, sendTimeCalc, nobleTrain,
    showBuildPlan, loadWorldData
  };
  root.querySelectorAll('[onclick]').forEach(function(el){
    var code = el.getAttribute('onclick');
    el.removeAttribute('onclick');
    var m = code.match(/^([a-zA-Z]+)\(\)/);
    if(m && HANDLERS[m[1]]){
      el.addEventListener('click', HANDLERS[m[1]]);
    }
  });

  // load persisted settings early so everything below sees the user's real preferences
  loadSettings();

  // tab switching
  (function(){
    var tabs=root.querySelector('#tabs'); if(!tabs) return;
    function activateTab(name){
      root.querySelectorAll('#tabs button').forEach(function(b){ b.classList.remove('active'); });
      root.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
      var btn=root.querySelector('#tabs button[data-tab="'+name+'"]');
      var pane=root.querySelector('#panel-'+name);
      if(btn) btn.classList.add('active');
      if(pane) pane.classList.add('active');
    }
    tabs.addEventListener('click', function(e){
      var btn=e.target.closest('button'); if(!btn) return;
      activateTab(btn.dataset.tab);
      try { storeSet('wr_last_tab', btn.dataset.tab); } catch(err){}
    });
    // restore last tab on load if the user opted in
    if(WR_SETTINGS.openLast){
      try { var last=storeGet('wr_last_tab'); if(last && root.querySelector('#panel-'+last)) activateTab(last); } catch(err){}
    }
  })();

  // build FARM per-unit input boxes. All units available; haulers listed first
  // (they carry loot), zero-haul units after, so the farm layout leads with the
  // ones you'd actually farm with.
  (function(){
    var grid=getById('fUnitGrid'); if(!grid) return;
    var haulers=UNIT_ORDER.filter(function(u){ return UNITS[u].haul>0; });
    var rest=UNIT_ORDER.filter(function(u){ return UNITS[u].haul<=0; });
    haulers.concat(rest).forEach(function(u){
      var wrap=document.createElement('label'); wrap.className='fld';
      var span=document.createElement('span');
      var h=UNITS[u].haul;
      span.textContent=UNITS[u].label+(h>0?(' · haul '+h):'');
      var inp=document.createElement('input');
      inp.id='fUnit_'+u; inp.className='mono'; inp.type='number'; inp.min='0'; inp.step='1';
      inp.placeholder='0';
      inp.addEventListener('input', persistFarmQueueDebounced); // save troop changes (debounced) so they survive navigation
      wrap.appendChild(span); wrap.appendChild(inp);
      grid.appendChild(wrap);
    });
  })();

  // wire the Farm target queue + Save button, then restore any saved farm run
  (function(){
    var farmPanel=root.querySelector('#panel-farm'); if(!farmPanel) return;

    var addBtn=farmPanel.querySelector('[data-act="addtarget"]');
    if(addBtn) addBtn.addEventListener('click', function(){ addFarmTarget(''); });

    var bulkBtn=farmPanel.querySelector('[data-act="bulkadd"]');
    if(bulkBtn) bulkBtn.addEventListener('click', bulkAddTargets);
    var sortBtn=farmPanel.querySelector('[data-act="sortdist"]');
    if(sortBtn) sortBtn.addEventListener('click', sortQueueByDistance);
    var barbBtn=farmPanel.querySelector('[data-act="findbarbs"]');
    if(barbBtn) barbBtn.addEventListener('click', findNearbyBarbs);

    var saveBtn=farmPanel.querySelector('[data-act="savefarm"]');
    if(saveBtn) saveBtn.addEventListener('click', saveFarmRun);

    // restore saved troops + targets; if nothing saved, start with one empty target row.
    // farmReady stays false during rebuild so persistFarmQueue() is a no-op until the
    // queue is fully restored — then we flip it on and the auto-save begins.
    var restored=loadFarmRun();
    if(!restored) addFarmTarget('');
    ensureFarmQueueNotEmpty();
    updateFarmQueueCount();
    farmReady=true;

    // restore and render the return-timer board (survives reloads, live-updates)
    loadRaids();
    renderRaids();
  })();

  // wire the Build Guide "Read this village" button
  (function(){
    var bp=root.querySelector('#panel-build'); if(!bp) return;
    var rb=bp.querySelector('[data-act="readvillage"]');
    if(rb) rb.addEventListener('click', readVillageBuild);
  })();


  // build the 8 ATTACK forms. Each is a full self-contained card: source, target,
  // one box per unit, speeds, and its own buttons wired to that form's number.
  (function(){
    var host=getById('attackForms'); if(!host) return;
    var LABEL_CSS="display:block;font-family:'Cinzel',serif;font-size:12.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:8px;";

    for(var i=1;i<=ATTACK_FORMS;i++){
      (function(n){
        var card=document.createElement('div');
        card.className='card';
        card.style.marginBottom='18px';

        // unit boxes markup
        var unitBoxes='';
        UNIT_ORDER.forEach(function(u){
          var h=UNITS[u].haul;
          var lab=esc(UNITS[u].label)+(h>0?(' · haul '+h):'');
          unitBoxes+='<label class="fld"><span>'+lab+'</span>'+
                     '<input id="a'+n+'_unit_'+u+'" class="mono" type="number" min="0" step="1" placeholder="0"></label>';
        });

        card.innerHTML=
          '<div style="font-family:\'Cinzel\',serif;font-weight:700;font-size:15px;letter-spacing:.04em;text-transform:uppercase;color:var(--wax);margin-bottom:12px;border-bottom:1px solid var(--parchment-line);padding-bottom:8px;">Attack '+n+'</div>'+
          '<div class="grid g2">'+
            '<label class="fld"><span>Your village (X|Y)</span><input id="a'+n+'_src" class="mono" placeholder="500|500" value="500|500"></label>'+
            '<label class="fld"><span>Target village (X|Y)</span><input id="a'+n+'_target" class="mono" placeholder="474|608"></label>'+
          '</div>'+
          '<div style="margin-top:16px;"><span style="'+LABEL_CSS+'">Troops to send</span>'+
            '<div class="grid g4">'+unitBoxes+'</div>'+
          '</div>'+
          '<div class="grid g3" style="margin-top:16px;">'+
            '<label class="fld"><span>World speed</span><input id="a'+n+'_world" class="mono" type="number" value="1.25" step="0.05" min="0.1"></label>'+
            '<label class="fld"><span>Unit speed</span><input id="a'+n+'_unitspd" class="mono" type="number" value="0.8" step="0.05" min="0.1"></label>'+
            '<label class="fld"><span>Server offset (min)</span><input id="a'+n+'_offset" class="mono" type="number" value="0" step="1"></label>'+
          '</div>'+
          '<div class="btn-row">'+
            '<button class="act" data-act="fill">Fill rally point</button>'+
            '<button class="act" data-act="focus" style="background:var(--crit); border-color:#3a1a1a;">Fill &amp; focus Attack</button>'+
            '<button class="act" data-act="plan">Show timing</button>'+
            '<button class="ghost" data-act="save">Save units</button>'+
            '<button class="ghost" data-act="clear">Clear troops</button>'+
          '</div>'+
          '<div id="attackOut'+n+'"></div>';

        host.appendChild(card);

        card.querySelector('[data-act="fill"]').addEventListener('click', function(){ fillAttackRally(n); });
        card.querySelector('[data-act="focus"]').addEventListener('click', function(){ focusAttackRally(n); });
        card.querySelector('[data-act="plan"]').addEventListener('click', function(){ planAttack(n); });
        card.querySelector('[data-act="save"]').addEventListener('click', function(){ saveAttackForm(n); });
        card.querySelector('[data-act="clear"]').addEventListener('click', function(){ clearAttackUnits(n); });

        // restore whatever this form last saved (persists across browser restarts)
        loadAttackForm(n);
      })(i);
    }
  })();

  // Keystroke guard: stop keys typed inside the panel from reaching Tribal Wars'
  // global hotkey listener (single letters like b/a/s jump to buildings — that's
  // why typing a troop count was closing the panel and sending you to the smithy).
  (function(){
    function guard(e){
      var t=e.target;
      if(t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.tagName==='SELECT')){
        e.stopPropagation();
      }
    }
    ['keydown','keypress','keyup'].forEach(function(evt){
      panel.addEventListener(evt, guard, true);
    });
  })();

  // Next-target hotkey: press Q (panel open, not typing in a field) to fill the next
  // queued farm target into the rally point. FILL ONLY — you still press Attack yourself
  // after each one. This just saves the mouse trip between sends.
  (function(){
    window.addEventListener('keydown', function(e){
      if(!panel.classList.contains('open')) return;
      var tag=(e.target && e.target.tagName)||'';
      if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
      if(e.key!==WR_SETTINGS.hotkey && e.key!==WR_SETTINGS.hotkey.toUpperCase()) return;
      // only act if the Farm tab is the active panel
      var farmPane=root.querySelector('#panel-farm');
      if(!farmPane || !farmPane.classList.contains('active')) return;
      e.preventDefault();
      var rows=farmQueueRows();
      for(var i=0;i<rows.length;i++){
        if((rows[i].value||'').trim()!==''){
          var row=rows[i].closest('.fq-row');
          if(row) fillFarmTarget(row, false); // false = fill only, do not focus/press Attack
          break;
        }
      }
    }, true);
  })();

  // world-agnostic init: build the current-village link and auto-fill detected
  // world/unit speeds into every form (runs after all builders above).
  buildLaunchLinks();
  applyWorldSpeeds();

  // flush any pending debounced farm-queue save when the page unloads (tab close, navigation,
  // pressing Enter to send an attack) so the last keystroke is never lost.
  window.addEventListener('beforeunload', flushPendingPersist);

  // Escape closes the panel (unless you're mid-typing in a field, where Esc may clear input).
  window.addEventListener('keydown', function(e){
    if(e.key!=='Escape') return;
    if(!panel.classList.contains('open')) return;
    var tag=(e.target && e.target.tagName)||'';
    // if focus is in one of our inputs, let the first Esc blur it; a second Esc closes.
    if((tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') && panel.contains(e.target)){
      e.target.blur(); return;
    }
    closePanel();
  }, true);

  // ---- settings form: populate, save, reset ----
  (function(){
    function fillSettingsForm(){
      var hk=getById('setHotkey'); if(hk) hk.value=(WR_SETTINGS.hotkey||'q').toUpperCase();
      var ws=getById('setWorld'); if(ws) ws.value=(WR_SETTINGS.worldSpeed!=null?WR_SETTINGS.worldSpeed:'');
      var us=getById('setUnitSpd'); if(us) us.value=(WR_SETTINGS.unitSpeed!=null?WR_SETTINGS.unitSpeed:'');
      var ar=getById('setAutoRaid'); if(ar) ar.checked=!!WR_SETTINGS.autoRaid;
      var ol=getById('setOpenLast'); if(ol) ol.checked=!!WR_SETTINGS.openLast;
      var wr=getById('setWrap'); if(wr) wr.checked=!!WR_SETTINGS.wrap;
      var ms=getById('setMapSize'); if(ms) ms.value=(WR_SETTINGS.mapSize!=null?WR_SETTINGS.mapSize:1000);
    }
    fillSettingsForm();

    var saveB=root.querySelector('[data-act="save-settings"]');
    if(saveB) saveB.addEventListener('click', function(){
      var out=getById('settingsOut');
      var hk=(val('setHotkey')||'').trim().toLowerCase();
      // validate hotkey: single letter a-z
      if(hk && !/^[a-z]$/.test(hk)){ if(out) out.innerHTML='<div class="err">Hotkey must be a single letter (A–Z). Leave blank to keep the current one.</div>'; return; }
      if(hk) WR_SETTINGS.hotkey=hk;
      var wv=val('setWorld').trim(), uv=val('setUnitSpd').trim();
      WR_SETTINGS.worldSpeed = wv==='' ? null : (parseFloat(wv)||null);
      WR_SETTINGS.unitSpeed  = uv==='' ? null : (parseFloat(uv)||null);
      var ar=getById('setAutoRaid'); WR_SETTINGS.autoRaid = ar?ar.checked:true;
      var ol=getById('setOpenLast'); WR_SETTINGS.openLast = ol?ol.checked:false;
      var wr=getById('setWrap'); WR_SETTINGS.wrap = wr?wr.checked:false;
      var ms=val('setMapSize').trim(); WR_SETTINGS.mapSize = ms==='' ? 1000 : (parseInt(ms)||1000);
      saveSettings();
      applyWorldSpeeds(); // re-apply new default speeds immediately
      var qLabel=WR_SETTINGS.hotkey.toUpperCase();
      if(out) out.innerHTML='<div class="ok">Settings saved. Fill hotkey is now <span class="mono">'+qLabel+'</span>'+
        ((WR_SETTINGS.worldSpeed!=null||WR_SETTINGS.unitSpeed!=null)?', default speeds applied to all tabs':'')+'.</div>';
      // update the farm queue hint to show the new key
      try {
        var lbl=root.querySelector('#panel-farm .fld ~ div span'); // best-effort; non-fatal
      } catch(e){}
    });

    var resetB=root.querySelector('[data-act="reset-settings"]');
    if(resetB) resetB.addEventListener('click', function(){
      if(!confirm('Reset all settings to defaults? (Hotkey back to Q, speeds back to auto-detect, wrap off.)')) return;
      WR_SETTINGS=Object.assign({}, WR_SETTINGS_DEFAULTS);
      saveSettings(); fillSettingsForm(); applyWorldSpeeds();
      var out=getById('settingsOut'); if(out) out.innerHTML='<div class="ok">Settings reset to defaults (hotkey Q, speeds auto-detected).</div>';
    });

    // ---- export / import all stored config ----
    var ALL_KEYS=['wr_settings','wr_farm_run','wr_farm_raids','wr_world_villages','wr_world_players','wr_world_allies','wr_last_tab','wr_launch_pos','wr_panel_box'];
    for(var an=1;an<=8;an++) ALL_KEYS.push('wr_attack_form_'+an);

    var expB=root.querySelector('[data-act="export-config"]');
    if(expB) expB.addEventListener('click', function(){
      var bundle={ _wr:'war-room-backup', _v:1, when:new Date().toISOString(), data:{} };
      ALL_KEYS.forEach(function(k){ var v=storeGet(k); if(v!=null) bundle.data[k]=v; });
      var io=getById('cfgIO'); if(io){ io.value=JSON.stringify(bundle); io.focus(); io.select(); }
      var out=getById('cfgIOOut'); if(out) out.innerHTML='<div class="ok">Exported. Copy the text above and save it somewhere safe — or share it. Ctrl+C now (it\'s selected).</div>';
    });

    var impB=root.querySelector('[data-act="import-config"]');
    if(impB) impB.addEventListener('click', function(){
      var out=getById('cfgIOOut');
      var io=getById('cfgIO'); var raw=io?io.value.trim():'';
      if(!raw){ if(out) out.innerHTML='<div class="err">Paste a backup into the box first.</div>'; return; }
      var bundle;
      try { bundle=JSON.parse(raw); } catch(e){ if(out) out.innerHTML='<div class="err">That isn\'t valid backup text — make sure you pasted the whole thing.</div>'; return; }
      if(!bundle || bundle._wr!=='war-room-backup' || !bundle.data){ if(out) out.innerHTML='<div class="err">That doesn\'t look like a War Room backup.</div>'; return; }
      if(!confirm('Import this backup? It will REPLACE your current settings, queues, attack forms and world data. This cannot be undone.')) return;
      var n=0;
      try { Object.keys(bundle.data).forEach(function(k){ if(ALL_KEYS.indexOf(k)>=0){ storeSet(k, bundle.data[k]); n++; } }); }
      catch(e){ if(out) out.innerHTML='<div class="err">Ran out of storage partway ('+n+' items saved) — browser storage may be full.</div>'; return; }
      if(out) out.innerHTML='<div class="ok">Imported '+n+' items. Reload the page (F5) for everything to take effect.</div>';
    });

    // shared: validate + apply a parsed backup bundle. Returns a status string.
    function applyBackupBundle(bundle, out){
      if(!bundle || bundle._wr!=='war-room-backup' || !bundle.data){ if(out) out.innerHTML='<div class="err">That doesn\'t look like a War Room backup file.</div>'; return false; }
      if(!confirm('Import this backup? It will REPLACE your current settings, queues, attack forms and world data. This cannot be undone.')) return false;
      var n=0, failed=false;
      try {
        Object.keys(bundle.data).forEach(function(k){ if(ALL_KEYS.indexOf(k)>=0){ storeSet(k, bundle.data[k]); n++; } });
      } catch(e){ failed=true; }
      if(out){
        if(failed) out.innerHTML='<div class="err">Import ran out of storage space partway through ('+n+' items saved). Your browser storage may be full — clear some space and try again.</div>';
        else out.innerHTML='<div class="ok">Imported '+n+' items. Reload the page (F5) for everything to take effect.</div>';
      }
      return !failed;
    }

    // file DOWNLOAD export — avoids the textarea/clipboard bottleneck for large worlds
    var expFileB=root.querySelector('[data-act="export-file"]');
    if(expFileB) expFileB.addEventListener('click', function(){
      var out=getById('cfgIOOut');
      try {
        var bundle={ _wr:'war-room-backup', _v:1, when:new Date().toISOString(), data:{} };
        ALL_KEYS.forEach(function(k){ var v=storeGet(k); if(v!=null) bundle.data[k]=v; });
        var blob=new Blob([JSON.stringify(bundle)], {type:'application/json'});
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url; a.download='war-room-backup-'+new Date().toISOString().slice(0,10)+'.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
        if(out) out.innerHTML='<div class="ok">Backup file downloaded. Keep it safe or share it — import it anytime with "Import from file".</div>';
      } catch(e){ if(out) out.innerHTML='<div class="err">Couldn\'t create the download. Try the copy/paste text option below instead.</div>'; }
    });

    // file UPLOAD import
    var cfgFile=root.querySelector('#cfgFile');
    if(cfgFile) cfgFile.addEventListener('change', function(e){
      var out=getById('cfgIOOut');
      var file=e.target.files && e.target.files[0];
      if(!file) return;
      var reader=new FileReader();
      reader.onload=function(){
        var bundle;
        try { bundle=JSON.parse(reader.result); } catch(err){ if(out) out.innerHTML='<div class="err">That file isn\'t valid backup data.</div>'; cfgFile.value=''; return; }
        applyBackupBundle(bundle, out);
        cfgFile.value=''; // reset so the same file can be re-selected
      };
      reader.onerror=function(){ if(out) out.innerHTML='<div class="err">Couldn\'t read that file.</div>'; cfgFile.value=''; };
      reader.readAsText(file);
    });
  })();

  // restore the launcher button's saved position (drag-to-move persistence)
  if(launch._restorePos) launch._restorePos();

  // ---- Intel / Timing / World Data pro wiring ----
  (function(){
    // restore any previously-loaded world map data so Intel naming works immediately
    restoreWorldData();

    // wire the two Attacker Intel buttons (data-act, not onclick, since names differ)
    var ip=root.querySelector('#panel-intel');
    if(ip){
      var bp=ip.querySelector('[data-act="intel-paste"]'); if(bp) bp.addEventListener('click', analyzeIntelPaste);
      var bf=ip.querySelector('[data-act="intel-fields"]'); if(bf) bf.addEventListener('click', analyzeIntel);
      var ba=ip.querySelector('[data-act="intel-auto"]'); if(ba) ba.addEventListener('click', autoReadIncomings);
    }

    // auto-fill YOUR coords into Intel target + Timing origin, and the server clock offset
    var coords=readVillageCoords();
    var off=getServerOffsetMinutes();
    var srv=getServerTime();

    if(coords){
      var iT=getById('iTarget'); if(iT && !iT.value) iT.value=coords;
      var tO=getById('tOrigin'); if(tO && !tO.value) tO.value=coords;
    }
    if(off!=null){
      ['iOffset','tOffset','fOffset'].forEach(function(id){ var el=getById(id); if(el) el.value=off; });
    }

    // status bars: tell the user exactly what was auto-detected
    var sp=getWorldSpeeds();
    var spTxt = (sp.speed!=null||sp.unitSpeed!=null)
      ? ('world speed '+(sp.speed!=null?sp.speed:'?')+', unit speed '+(sp.unitSpeed!=null?sp.unitSpeed:'?')+' (auto-detected)')
      : 'world/unit speed not detected — using defaults 1.25 / 0.8, adjust if your world differs';
    var clkTxt = srv ? ('server clock '+hmsClock(srv)+(off!=null?(', your device is '+(off===0?'in sync':(Math.abs(off)+' min '+(off>0?'behind':'ahead')))):'')) : 'server clock not detected — enter arrival times carefully, check the game\'s top-bar clock';
    var coordTxt = coords ? ('your village '+coords+' auto-filled') : 'your coords not detected — press "Grab my coords" or type them';

    var iStat=getById('intelStatus');
    if(iStat) iStat.innerHTML='<strong>Auto-detected:</strong> '+coordTxt+' · '+spTxt+' · '+clkTxt+'.';
    var tStat=getById('timingStatus');
    if(tStat) tStat.innerHTML='<strong>Auto-detected:</strong> '+coordTxt+' · '+spTxt+' · '+clkTxt+'.';

    // World Data links: point at THIS world's public exports
    var dl=getById('dataLinks');
    if(dl){
      try {
        var host=location.host, proto=location.protocol;
        dl.innerHTML='Open these on your world, copy all, paste below:<br>'+
          '<a class="inline" href="'+proto+'//'+host+'/map/village.txt" target="_blank" rel="noopener">'+host+'/map/village.txt</a> &nbsp;·&nbsp; '+
          '<a class="inline" href="'+proto+'//'+host+'/map/player.txt" target="_blank" rel="noopener">'+host+'/map/player.txt</a> &nbsp;·&nbsp; '+
          '<a class="inline" href="'+proto+'//'+host+'/map/ally.txt" target="_blank" rel="noopener">'+host+'/map/ally.txt</a> <span style="font-style:italic;">(optional — tribe names)</span>'+
          (WORLD_VILLAGES.length?('<br><span style="color:var(--good);">'+WORLD_VILLAGES.length.toLocaleString()+' villages already loaded from a previous session.</span>'):'');
      } catch(e){ dl.textContent='Open your world\'s /map/village.txt, /map/player.txt and /map/ally.txt, copy all, and paste below.'; }
    }

    // environment check: if the tool can't see the game, show one clear banner at the
    // top rather than letting each feature fail with its own vague message.
    try {
      var caps=checkEnvironment();
      var banner=environmentBanner(caps);
      var scroll=panel.querySelector('.wr-scroll .wrap') || panel.querySelector('.wr-scroll');
      var tabsNav = scroll ? (scroll.querySelector('nav.tabs') || scroll.querySelector('#tabs')) : null;
      function insertBanner(html, color, bg){
        if(!scroll) return;
        var el=document.createElement('div');
        el.className='note';
        el.style.cssText='border-color:'+color+';background:'+bg+';margin:14px 0;';
        el.innerHTML=html;
        if(tabsNav && tabsNav.parentNode) tabsNav.parentNode.insertBefore(el, tabsNav);
        else scroll.insertBefore(el, scroll.firstChild);
      }
      // data-corruption notice: some saved data couldn't be read back
      if(_loadErrors.length){
        insertBanner('⚠ <strong>Some saved data couldn\'t be loaded</strong> ('+_loadErrors.join(', ')+') — it may be corrupted, and those parts were reset to empty. If you have a backup (Settings → Backup &amp; restore), you can import it. Otherwise just re-enter that data.', 'var(--crit)', 'rgba(107,31,31,.08)');
      }
      if(banner){ insertBanner('⚠ '+banner, 'var(--wax)', 'rgba(124,31,26,.08)'); }
    } catch(e){}
  })();

})();
