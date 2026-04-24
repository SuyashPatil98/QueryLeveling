// Documented schema both datasets share.
// Learning dataset (Hunter Guild) and Practice dataset (Shadow Army) mirror structure
// but use different table/column names so learners must re-map instead of memorizing.

export const learningSchemaDoc = `
# HUNTER GUILD (learning dataset)

Tables:
- hunters(hunter_id, name, rank, level, class, guild_id, awakened_at, last_active_at, mana_capacity, strength, agility, intellect)
- guilds(guild_id, name, rank, founded_at, master_id, treasury_gold)
- dungeons(dungeon_id, name, rank, location, boss_name, mana_density)
- raids(raid_id, dungeon_id, guild_id, started_at, ended_at, status, party_leader_id, reward_gold)
- raid_participants(raid_id, hunter_id, role, damage_dealt, healing_done, survived)
- items(item_id, name, rarity, type, base_value)
- hunter_inventory(hunter_id, item_id, quantity, acquired_at, equipped)
- skills(skill_id, name, element, mana_cost, base_damage)
- hunter_skills(hunter_id, skill_id, skill_level, unlocked_at)
- gold_transactions(txn_id, hunter_id, amount, type, occurred_at)

Key conventions:
- rank in {'E','D','C','B','A','S'}
- status in {'in_progress','cleared','failed','aborted'}
- type for gold_transactions in {'reward','purchase','sale','repair','tax'}
- dates are ISO strings 'YYYY-MM-DD HH:MM:SS'
`;

export const practiceSchemaDoc = `
# SHADOW ARMY (practice dataset)

Tables:
- shadows(shadow_id, name, rank, level, class, army_id, summoned_at, last_active_at, mana_capacity, strength, agility, intellect)
- armies(army_id, name, rank, founded_at, commander_id, treasury_mana)
- territories(territory_id, name, rank, location, overlord_name, mana_density)
- missions(mission_id, territory_id, army_id, started_at, ended_at, status, squad_leader_id, reward_mana)
- mission_participants(mission_id, shadow_id, role, damage_dealt, healing_done, survived)
- artifacts(artifact_id, name, rarity, type, base_value)
- shadow_arsenal(shadow_id, artifact_id, quantity, acquired_at, equipped)
- abilities(ability_id, name, element, mana_cost, base_damage)
- shadow_abilities(shadow_id, ability_id, ability_level, unlocked_at)
- mana_transactions(txn_id, shadow_id, amount, type, occurred_at)

Same conventions as the learning dataset.
`;
