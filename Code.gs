// =============================================================================
// FROSTGRAVE CAMPAIGN TRACKER — Apps Script Web App
// =============================================================================
// Deploy as: Execute as Me, Anyone can access (no sign-in required)
// After deploying, paste the Web App URL into your forms' APPS_SCRIPT_URL const.
// =============================================================================

const SHEET_ID = '1z0MZE6f86DDtoow0ACa7wlgxEtqxKU-XMBxeWfE8ck4'; // Replace after creating your sheet

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
      case 'updateBase':       result = updateBase(data);       break;
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
  const count = Math.max(data.length, 1);
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
    data.gold !== undefined ? data.gold : 400, // gold remaining after setup
    '',                   // base_notes
    'active'              // status
  ]);

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

  if (data.spells && data.spells.length > 0) {
    data.spells.forEach(spell => {
      addSpell({
        warband_id,
        spell_name: spell.spell_name,
        school: spell.school,
        base_casting_number: spell.base_casting_number,
        casting_number: spell.base_casting_number,
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
  ss = ss || SpreadsheetApp.openById(SHEET_ID);
  const solSheet = ss.getSheetByName('SOLDIERS');
  const itemSheet = ss.getSheetByName('ITEMS');

  const solData = solSheet.getDataRange().getValues();
  for (let i = 1; i < solData.length; i++) {
    if (solData[i][0] === soldier_id) {
      solSheet.getRange(i + 1, 5).setValue('dead');
      break;
    }
  }

  const itemData = itemSheet.getDataRange().getValues();
  for (let i = 1; i < itemData.length; i++) {
    if (itemData[i][6] === soldier_id) {
      itemSheet.getRange(i + 1, 6).setValue('lost');
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

function updateSpellCN(spell_id, new_cn, ss) {
  ss = ss || SpreadsheetApp.openById(SHEET_ID);
  const spellSheet = ss.getSheetByName('SPELLS');
  const data = spellSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === spell_id) {
      spellSheet.getRange(i + 1, 6).setValue(new_cn); // col 6 = casting_number
      break;
    }
  }
}


// =============================================================================
// POST-GAME SUBMISSION
// =============================================================================

function submitGame(data) {
  const ss        = SpreadsheetApp.openById(SHEET_ID);
  const gameSheet = ss.getSheetByName('GAMES');
  const txnSheet  = ss.getSheetByName('TRANSACTIONS');
  const injSheet  = ss.getSheetByName('INJURIES');
  const wbSheet   = ss.getSheetByName('WARBANDS');
  const itemSheet = ss.getSheetByName('ITEMS');

  const timestamp = new Date();
  const game_id = generateId('GM', gameSheet);
  const participating_ids = data.warbands.map(w => w.warband_id).join(', ');

  gameSheet.appendRow([
    game_id,
    data.date,
    data.scenario,
    data.warbands.length,
    participating_ids,
    data.recorded_by,
    data.notes || ''
  ]);

  data.warbands.forEach(wb => {
    const { warband_id, xp_earned, gold_earned,
            soldiers_killed, soldiers_recovering,
            items_found, injuries,
            stat_improvements, spell_improvements, spells_learned,
            soldiers_hired, items_purchased, items_sold } = wb;

    // XP
    if (xp_earned > 0) {
      appendTransaction(txnSheet, warband_id, game_id, 'xp',
        'XP from game: ' + data.scenario, 0, xp_earned, timestamp);
      updateWarbandXP(wbSheet, warband_id, xp_earned);
    }

    // Gold from treasure
    if (gold_earned > 0) {
      appendTransaction(txnSheet, warband_id, game_id, 'treasure',
        'Gold from game: ' + data.scenario, gold_earned, 0, timestamp);
      updateWarbandGold(wbSheet, warband_id, gold_earned);
    }

    // Soldier deaths
    if (soldiers_killed && soldiers_killed.length > 0) {
      soldiers_killed.forEach(soldier_id => {
        killSoldier(soldier_id, ss);
        appendTransaction(txnSheet, warband_id, game_id, 'soldier_killed',
          'Soldier killed: ' + soldier_id, 0, 0, timestamp);
      });
    }

    // Soldiers recovering
    if (soldiers_recovering && soldiers_recovering.length > 0) {
      soldiers_recovering.forEach(soldier_id => setRecovering(soldier_id, ss));
    }

    // Items found (treasure)
    if (items_found && items_found.length > 0) {
      items_found.forEach(item => {
        const item_id = generateId('ITM', itemSheet);
        itemSheet.appendRow([item_id, warband_id, item.item_type, item.item_name,
                             item.description || '', 'active', item.carried_by || '']);
        appendTransaction(txnSheet, warband_id, game_id, 'item_found',
          'Found: ' + item.item_name, 0, 0, timestamp);
      });
    }

    // Permanent injuries (wizard / apprentice / soldiers)
    if (injuries && injuries.length > 0) {
      injuries.forEach(injury => {
        const injury_id = generateId('INJ', injSheet);
        injSheet.appendRow([injury_id, warband_id, game_id,
                            injury.target_type, injury.target_name, injury.injury_description]);
      });
    }

    // Level-up: stat improvements (array, one per level gained)
    if (stat_improvements && stat_improvements.length > 0) {
      stat_improvements.forEach(si => updateWarbandStat(wbSheet, warband_id, si.stat, si.delta));
    }

    // Level-up: spell casting number improvements
    if (spell_improvements && spell_improvements.length > 0) {
      spell_improvements.forEach(si => updateSpellCN(si.spell_id, si.new_cn, ss));
    }

    // Level-up: spells learned
    if (spells_learned && spells_learned.length > 0) {
      spells_learned.forEach(spell => addSpell({
        warband_id,
        spell_name: spell.spell_name,
        school: spell.school,
        base_casting_number: spell.base_casting_number,
        casting_number: spell.casting_number
      }, ss));
    }

    // Soldiers hired
    if (soldiers_hired && soldiers_hired.length > 0) {
      soldiers_hired.forEach(s => {
        addSoldier({ warband_id, soldier_name: s.soldier_name, soldier_type: s.soldier_type }, ss);
        if (s.cost > 0) {
          appendTransaction(txnSheet, warband_id, game_id, 'hire',
            'Hired: ' + s.soldier_name + ' (' + s.soldier_type + ')', -s.cost, 0, timestamp);
          updateWarbandGold(wbSheet, warband_id, -s.cost);
        }
      });
    }

    // Items purchased
    if (items_purchased && items_purchased.length > 0) {
      items_purchased.forEach(item => {
        const item_id = generateId('ITM', itemSheet);
        itemSheet.appendRow([item_id, warband_id, item.item_type, item.item_name,
                             'Purchased', 'active', '']);
        if (item.cost > 0) {
          appendTransaction(txnSheet, warband_id, game_id, 'purchase',
            'Purchased: ' + item.item_name, -item.cost, 0, timestamp);
          updateWarbandGold(wbSheet, warband_id, -item.cost);
        }
      });
    }

    // Items sold
    if (items_sold && items_sold.length > 0) {
      items_sold.forEach(sale => {
        markItemSold(sale.item_id, ss);
        if (sale.gold_gained > 0) {
          appendTransaction(txnSheet, warband_id, game_id, 'sale',
            'Sold item', sale.gold_gained, 0, timestamp);
          updateWarbandGold(wbSheet, warband_id, sale.gold_gained);
        }
      });
    }
  });

  return { success: true, game_id };
}


// =============================================================================
// WARBAND STAT UPDATES
// =============================================================================

function updateWarbandXP(wbSheet, warband_id, xp_delta) {
  // Frostgrave 2e level thresholds
  const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
  const data = wbSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === warband_id) {
      const newXP = (Number(data[i][6]) || 0) + xp_delta;
      let newLevel = 1;
      for (let l = LEVEL_XP.length - 1; l >= 0; l--) {
        if (newXP >= LEVEL_XP[l]) { newLevel = l + 1; break; }
      }
      wbSheet.getRange(i + 1, 7).setValue(newXP);    // col 7 = xp
      wbSheet.getRange(i + 1, 6).setValue(newLevel); // col 6 = level
      break;
    }
  }
}

function updateWarbandGold(wbSheet, warband_id, gold_delta) {
  const data = wbSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === warband_id) {
      const current = Number(data[i][15]) || 0; // col 16 = gold
      wbSheet.getRange(i + 1, 16).setValue(current + gold_delta);
      break;
    }
  }
}

function updateWarbandStat(wbSheet, warband_id, stat, delta) {
  // WARBANDS columns (1-indexed): move=8, fight=9, shoot=10, armour=11, will=12, health=13
  const colMap = { move: 8, fight: 9, shoot: 10, armour: 11, will: 12, health: 13 };
  const col = colMap[stat];
  if (!col) return;
  const data = wbSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === warband_id) {
      const current = Number(data[i][col - 1]) || 0;
      wbSheet.getRange(i + 1, col).setValue(current + delta);
      break;
    }
  }
}

function markItemSold(item_id, ss) {
  ss = ss || SpreadsheetApp.openById(SHEET_ID);
  const itemSheet = ss.getSheetByName('ITEMS');
  const data = itemSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === item_id) {
      itemSheet.getRange(i + 1, 6).setValue('sold'); // col 6 = status
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
  txnSheet.appendRow([txn_id, warband_id, game_id, type,
                      description, gold_delta, xp_delta, timestamp]);
}


// =============================================================================
// BASE OF OPERATIONS
// =============================================================================

function updateBase(data) {
  const ss       = SpreadsheetApp.openById(SHEET_ID);
  const wbSheet  = ss.getSheetByName('WARBANDS');
  const txnSheet = ss.getSheetByName('TRANSACTIONS');
  const timestamp = new Date();

  const rows    = wbSheet.getDataRange().getValues();
  const headers = rows[0];
  const baseTypeCol     = headers.indexOf('base_type') + 1;
  const baseUpgradesCol = headers.indexOf('base_upgrades') + 1;

  if (baseTypeCol < 1 || baseUpgradesCol < 1) {
    return { success: false, error: 'WARBANDS sheet is missing base_type or base_upgrades columns. Please add them.' };
  }

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.warband_id) {
      wbSheet.getRange(i + 1, baseTypeCol).setValue(data.base_type || '');
      wbSheet.getRange(i + 1, baseUpgradesCol).setValue((data.upgrades || []).join(','));

      if (data.gold_spent > 0) {
        updateWarbandGold(wbSheet, data.warband_id, -data.gold_spent);
        appendTransaction(txnSheet, data.warband_id, 'BASE', 'purchase',
          'Base upgrades purchased', -data.gold_spent, 0, timestamp);
      }
      break;
    }
  }

  return { success: true };
}


// =============================================================================
// READ FUNCTIONS
// =============================================================================

function getWarbands() {
  const ss      = SpreadsheetApp.openById(SHEET_ID);
  const wbSheet  = ss.getSheetByName('WARBANDS');
  const solSheet = ss.getSheetByName('SOLDIERS');
  const spSheet  = ss.getSheetByName('SPELLS');
  const itemSheet = ss.getSheetByName('ITEMS');

  const wbData   = sheetToObjects(wbSheet);
  const solData  = sheetToObjects(solSheet);
  const spData   = sheetToObjects(spSheet);
  const itemData = sheetToObjects(itemSheet);

  const warbands = wbData.map(wb => {
    const soldiers = solData.filter(s => s.warband_id === wb.warband_id);
    const spells   = spData.filter(s => s.warband_id === wb.warband_id);
    const items    = itemData.filter(i => i.warband_id === wb.warband_id);

    wb.apprentice_fight  = wb.fight  - 2;
    wb.apprentice_will   = wb.will   - 2;
    wb.apprentice_health = wb.health - 2;
    wb.apprentice_move   = wb.move;
    wb.apprentice_shoot  = wb.shoot;
    wb.apprentice_armour = wb.armour;

    return { ...wb, soldiers, spells, items };
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
// UTILITY
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
