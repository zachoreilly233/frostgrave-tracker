// =============================================================================
// FROSTGRAVE CAMPAIGN TRACKER — Apps Script Web App
// =============================================================================
// Deploy as: Execute as Me, Anyone can access (no sign-in required)
// After deploying, paste the Web App URL into your forms' APPS_SCRIPT_URL const.
// =============================================================================

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace after creating your sheet

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;
    switch (action) {
      case 'createWarband':    result = createWarband(data);    break;
      case 'addSoldier':       result = addSoldier(data);       break;
      case 'addSpell':         result = addSpell(data);         break;
      case 'submitGame':       result = submitGame(data);       break;
      case 'getWarbands':      result = getWarbands();          break;
      case 'getWarband':       result = getWarband(data);       break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Allow simple GET requests for reading data (dashboard use)
  try {
    const action = e.parameter.action;
    let result;
    switch (action) {
      case 'getWarbands':  result = getWarbands();              break;
      case 'getWarband':   result = getWarband(e.parameter);    break;
      case 'getGames':     result = getGames();                 break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// =============================================================================
// ID GENERATION
// =============================================================================

function generateId(prefix, sheet) {
  const data = sheet.getDataRange().getValues();
  const count = Math.max(data.length, 1); // at least 1 to account for header row
  return prefix + String(count).padStart(3, '0');
}


// =============================================================================
// WARBAND CREATION
// =============================================================================

function createWarband(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const wbSheet = ss.getSheetByName('WARBANDS');

  const warband_id = generateId('WB', wbSheet);

  wbSheet.appendRow([
    warband_id,
    data.player_name,
    data.wizard_name,
    data.wizard_photo_url || '',
    data.school,
    0,                    // level
    0,                    // xp
    data.move,
    data.fight,
    data.shoot,
    data.armour,
    data.will,
    data.health,
    data.apprentice_name,
    data.apprentice_photo_url || '',
    500,                  // starting gold (standard Frostgrave)
    '',                   // base_notes
    'active'              // status
  ]);

  // Add soldiers if provided
  if (data.soldiers && data.soldiers.length > 0) {
    data.soldiers.forEach(soldier => {
      addSoldier({
        warband_id,
        soldier_name: soldier.soldier_name,
        soldier_type: soldier.soldier_type,
        photo_url: soldier.photo_url || ''
      }, ss);
    });
  }

  // Add spells if provided
  if (data.spells && data.spells.length > 0) {
    data.spells.forEach(spell => {
      addSpell({
        warband_id,
        spell_name: spell.spell_name,
        school: spell.school,
        base_casting_number: spell.base_casting_number,
        casting_number: spell.base_casting_number, // starts equal to base
        category: spell.category || ''
      }, ss);
    });
  }

  return { success: true, warband_id };
}


// =============================================================================
// SOLDIER MANAGEMENT
// =============================================================================

function addSoldier(data, ss) {
  ss = ss || SpreadsheetApp.openById(SHEET_ID);
  const solSheet = ss.getSheetByName('SOLDIERS');

  const soldier_id = generateId('SOL', solSheet);

  solSheet.appendRow([
    soldier_id,
    data.warband_id,
    data.soldier_name,
    data.soldier_type,
    'active',
    data.photo_url || ''
  ]);

  return { success: true, soldier_id };
}

function killSoldier(soldier_id, ss) {
  // Set soldier status to dead and mark their carried items as lost
  ss = ss || SpreadsheetApp.openById(SHEET_ID);
  const solSheet = ss.getSheetByName('SOLDIERS');
  const itemSheet = ss.getSheetByName('ITEMS');

  // Update soldier status
  const solData = solSheet.getDataRange().getValues();
  for (let i = 1; i < solData.length; i++) {
    if (solData[i][0] === soldier_id) {
      solSheet.getRange(i + 1, 5).setValue('dead'); // column 5 = status
      break;
    }
  }

  // Mark carried items as lost (retain carried_by as tombstone)
  const itemData = itemSheet.getDataRange().getValues();
  for (let i = 1; i < itemData.length; i++) {
    if (itemData[i][6] === soldier_id) { // column 7 = carried_by
      itemSheet.getRange(i + 1, 6).setValue('lost'); // column 6 = status
    }
  }
}

function setRecovering(soldier_id, ss) {
  ss = ss || SpreadsheetApp.openById(SHEET_ID);
  const solSheet = ss.getSheetByName('SOLDIERS');
  const solData = solSheet.getDataRange().getValues();
  for (let i = 1; i < solData.length; i++) {
    if (solData[i][0] === soldier_id) {
      solSheet.getRange(i + 1, 5).setValue('recovering');
      break;
    }
  }
}


// =============================================================================
// SPELL MANAGEMENT
// =============================================================================

function addSpell(data, ss) {
  ss = ss || SpreadsheetApp.openById(SHEET_ID);
  const spellSheet = ss.getSheetByName('SPELLS');

  const spell_id = generateId('SP', spellSheet);

  spellSheet.appendRow([
    spell_id,
    data.warband_id,
    data.spell_name,
    data.school,
    data.base_casting_number,
    data.casting_number || data.base_casting_number,
    data.category || ''
  ]);

  return { success: true, spell_id };
}


// =============================================================================
// POST-GAME SUBMISSION
// =============================================================================

function submitGame(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const gameSheet  = ss.getSheetByName('GAMES');
  const txnSheet   = ss.getSheetByName('TRANSACTIONS');
  const injSheet   = ss.getSheetByName('INJURIES');
  const wbSheet    = ss.getSheetByName('WARBANDS');
  const itemSheet  = ss.getSheetByName('ITEMS');

  const timestamp = new Date();
  const game_id = generateId('GM', gameSheet);
  const participating_ids = data.warbands.map(w => w.warband_id).join(', ');

  // Write game record
  gameSheet.appendRow([
    game_id,
    data.date,
    data.scenario,
    data.warbands.length,
    participating_ids,
    data.recorded_by,
    data.notes || ''
  ]);

  // Process each warband's results
  data.warbands.forEach(wb => {
    const { warband_id, xp_earned, gold_earned, soldiers_killed,
            soldiers_recovering, items_found, injuries } = wb;

    // XP transaction
    if (xp_earned && xp_earned > 0) {
      appendTransaction(txnSheet, warband_id, game_id, 'treasure',
        'XP from game: ' + data.scenario, 0, xp_earned, timestamp);
      updateWarbandXP(wbSheet, warband_id, xp_earned);
    }

    // Gold transaction
    if (gold_earned && gold_earned > 0) {
      appendTransaction(txnSheet, warband_id, game_id, 'treasure',
        'Gold from game: ' + data.scenario, gold_earned, 0, timestamp);
      updateWarbandGold(wbSheet, warband_id, gold_earned);
    }

    // Soldier deaths (triggers item loss automatically)
    if (soldiers_killed && soldiers_killed.length > 0) {
      soldiers_killed.forEach(soldier_id => {
        killSoldier(soldier_id, ss);
        appendTransaction(txnSheet, warband_id, game_id, 'item_lost',
          'Soldier killed: ' + soldier_id, 0, 0, timestamp);
      });
    }

    // Soldiers recovering
    if (soldiers_recovering && soldiers_recovering.length > 0) {
      soldiers_recovering.forEach(soldier_id => {
        setRecovering(soldier_id, ss);
      });
    }

    // Items found
    if (items_found && items_found.length > 0) {
      items_found.forEach(item => {
        const item_id = generateId('ITM', itemSheet);
        itemSheet.appendRow([
          item_id,
          warband_id,
          item.item_type,
          item.item_name,
          item.description || '',
          'active',
          item.carried_by || ''
        ]);
        appendTransaction(txnSheet, warband_id, game_id, 'item_found',
          'Found: ' + item.item_name, 0, 0, timestamp);
      });
    }

    // Permanent injuries
    if (injuries && injuries.length > 0) {
      injuries.forEach(injury => {
        const injury_id = generateId('INJ', injSheet);
        injSheet.appendRow([
          injury_id,
          warband_id,
          game_id,
          injury.target_type,
          injury.target_name,
          injury.injury_description
        ]);
      });
    }
  });

  return { success: true, game_id };
}


// =============================================================================
// WARBAND STAT UPDATES
// =============================================================================

function updateWarbandXP(wbSheet, warband_id, xp_delta) {
  const data = wbSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === warband_id) {
      const currentXP = data[i][6] || 0; // column 7 = xp
      wbSheet.getRange(i + 1, 7).setValue(currentXP + xp_delta);
      // Auto-level: every 100 XP = 1 level (standard Frostgrave)
      const newLevel = Math.floor((currentXP + xp_delta) / 100);
      wbSheet.getRange(i + 1, 6).setValue(newLevel); // column 6 = level
      break;
    }
  }
}

function updateWarbandGold(wbSheet, warband_id, gold_delta) {
  const data = wbSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === warband_id) {
      const currentGold = data[i][15] || 0; // column 16 = gold
      wbSheet.getRange(i + 1, 16).setValue(currentGold + gold_delta);
      break;
    }
  }
}


// =============================================================================
// TRANSACTION HELPER
// =============================================================================

function appendTransaction(txnSheet, warband_id, game_id, type,
                           description, gold_delta, xp_delta, timestamp) {
  const txn_id = generateId('TXN', txnSheet);
  txnSheet.appendRow([
    txn_id,
    warband_id,
    game_id,
    type,
    description,
    gold_delta,
    xp_delta,
    timestamp
  ]);
}


// =============================================================================
// READ FUNCTIONS (for dashboard / GET requests)
// =============================================================================

function getWarbands() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const wbSheet  = ss.getSheetByName('WARBANDS');
  const solSheet = ss.getSheetByName('SOLDIERS');
  const spSheet  = ss.getSheetByName('SPELLS');

  const wbData  = sheetToObjects(wbSheet);
  const solData = sheetToObjects(solSheet);
  const spData  = sheetToObjects(spSheet);

  // Attach soldiers and spells to each warband
  const warbands = wbData.map(wb => {
    const soldiers = solData.filter(s => s.warband_id === wb.warband_id);
    const spells   = spData.filter(s => s.warband_id === wb.warband_id);

    // Derive apprentice stats
    wb.apprentice_fight  = wb.fight  - 2;
    wb.apprentice_will   = wb.will   - 2;
    wb.apprentice_health = wb.health - 2;
    wb.apprentice_move   = wb.move;
    wb.apprentice_shoot  = wb.shoot;
    wb.apprentice_armour = wb.armour;

    return { ...wb, soldiers, spells };
  });

  return { success: true, warbands };
}

function getWarband(params) {
  const result = getWarbands();
  if (!result.success) return result;
  const warband = result.warbands.find(w => w.warband_id === params.warband_id);
  if (!warband) return { success: false, error: 'Warband not found' };
  return { success: true, warband };
}

function getGames() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const gameSheet = ss.getSheetByName('GAMES');
  const games = sheetToObjects(gameSheet);
  return { success: true, games };
}


// =============================================================================
// UTILITY: Convert sheet rows to array of objects using header row
// =============================================================================

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}
