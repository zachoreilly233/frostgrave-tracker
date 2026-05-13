# Frostgrave Campaign Tracker — Schema Reference

## Google Sheet Setup

Create a new Google Sheet. Add the following tabs in order, with the exact headers listed.
All column names should go in Row 1. Data starts at Row 2.

---

## Tab 1: WARBANDS

| Column | Notes |
|--------|-------|
| warband_id | Unique ID, e.g. WB001. Set manually at creation. |
| player_name | Real name of the player |
| wizard_name | Name of the wizard character |
| wizard_photo_url | Google Drive shareable link |
| school | One of the ten wizard schools |
| level | Numeric, starts at 0 |
| xp | Numeric, starts at 0 |
| move | Wizard stat |
| fight | Wizard stat |
| shoot | Wizard stat |
| armour | Wizard stat |
| will | Wizard stat |
| health | Wizard stat |
| apprentice_name | Name of the apprentice character |
| apprentice_photo_url | Google Drive shareable link |
| gold | Current gold crowns |
| base_notes | Freetext notes on base/headquarters |
| status | active / retired / eliminated |

### Apprentice stat formulas (add as helper columns or use in frontend):
- apprentice_fight = wizard fight - 2
- apprentice_will = wizard will - 2
- apprentice_health = wizard health - 2
- apprentice_move = wizard move (identical)
- apprentice_shoot = wizard shoot (identical)
- apprentice_armour = wizard armour (identical)

These are never stored — always derived live from wizard stats.

---

## Tab 2: SOLDIERS

| Column | Notes |
|--------|-------|
| soldier_id | Unique ID, e.g. SOL001. Set by Apps Script. |
| warband_id | Foreign key → WARBANDS |
| soldier_name | Character name |
| soldier_type | e.g. Thug, Archer, Knight, Tracker, etc. |
| status | active / recovering / dead |
| photo_url | Google Drive shareable link |

---

## Tab 3: SPELLS

| Column | Notes |
|--------|-------|
| spell_id | Unique ID, e.g. SP001. Set by Apps Script. |
| warband_id | Foreign key → WARBANDS |
| spell_name | Name of the spell |
| school | School the spell belongs to |
| base_casting_number | The printed casting number |
| casting_number | Current casting number after improvements |
| category | e.g. Elemental, Summoning, etc. |

---

## Tab 4: INJURIES

| Column | Notes |
|--------|-------|
| injury_id | Unique ID, e.g. INJ001. Set by Apps Script. |
| warband_id | Foreign key → WARBANDS |
| game_id | Foreign key → GAMES |
| target_type | wizard / apprentice |
| target_name | Name of the injured figure |
| injury_description | Freetext description of permanent injury |

---

## Tab 5: ITEMS

| Column | Notes |
|--------|-------|
| item_id | Unique ID, e.g. ITM001. Set by Apps Script. |
| warband_id | Foreign key → WARBANDS |
| item_type | potion / scroll / grimoire / magic_weapon / magic_armour / magic_item |
| item_name | Name or description |
| description | Additional detail |
| status | active / lost |
| carried_by | soldier_id if carried by a soldier, blank if carried by wizard |

### Lost item rule:
When a soldier's status is set to `dead`, all ITEMS rows where
`carried_by` = that soldier_id are automatically set to `status = lost`.
The `carried_by` value is retained as a tombstone (do not null it out).

---

## Tab 6: GAMES

| Column | Notes |
|--------|-------|
| game_id | Unique ID, e.g. GM001. Set by Apps Script. |
| date | Date of the game |
| scenario | Name of the scenario played |
| player_count | Number of warbands that participated |
| participating_warbands | Comma-separated warband_ids |
| recorded_by | player_name of person who submitted the form |
| notes | Any freetext notes about the game |

---

## Tab 7: TRANSACTIONS

| Column | Notes |
|--------|-------|
| transaction_id | Unique ID, e.g. TXN001. Set by Apps Script. |
| warband_id | Foreign key → WARBANDS |
| game_id | Foreign key → GAMES (blank for between-game transactions) |
| type | treasure / purchase / recruitment / sale / injury_treatment / item_found / item_lost |
| description | Freetext description |
| gold_delta | Positive = gain, Negative = spend |
| xp_delta | Positive = gain |
| timestamp | Auto-set by Apps Script |

### Rules:
- This sheet is APPEND ONLY. Never edit or delete rows.
- Gold and XP on WARBANDS should always be reconcilable against this log.

---

## Drive Folder Convention

Create a shared Google Drive folder: `frostgrave_minis/`

File naming convention:
- `WB001_wizard.jpg` — wizard photo
- `WB001_apprentice.jpg` — apprentice photo
- `WB001_SOL001.jpg` — soldier photo

All files should be set to "Anyone with the link can view."
Paste the shareable URL into the appropriate `photo_url` column.
