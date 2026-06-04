_addon.name = 'titles'
_addon.author = 'Kayte'
_addon.version = '1.0'
_addon.command = 'titles'

require('luau')
require('pack')
bit = require('bit')
files = require('files')

local npcs = require('npcmap')
local exclude = require('exclusions')
local titles = S{}
local bonus = 0
local file = nil
local settings = config.load({NPCs = S{}})

-------------------------

local function id_to_name(id)
	if not id or not res.titles[id] then
		return "Invalid Title"
	end
	return res.titles[id].name
end

local function load_titles()
	local name = windower.ffxi.get_player().name
	if not name then
		error("Unable to determine titles file")
		return
	end

	titles= S{}
	bonus = 0
	file = files.new('data/' .. name .. '.titles')
	
	if not file:exists() then
		log("No current titles saved for " .. name)
		return
	end
	
	local data = file:read():split(',')
	for _, v in ipairs(data) do
		local id = tonumber(v)
		if id then
			titles:add(id)
			if exclude[id] then
				bonus = bonus + 1
			end
		end
	end
end

local function save_titles()
	if not file then
		error("Unable to determine titles file")
		return
	end
	
	if not file:exists() then
		file:create()
		notice("Created new file: " .. file.path)
	end

	file:write(titles:concat(','))
end

local function reset_titles()
	titles:clear()
	bonus = 0
	save_titles()
	settings.NPCs:clear()
	config.save(settings)
	log("Cleared all recorded titles")
end

-------------------------

local function log_npc_count()
	if settings.NPCs:length() < npcs:length() then
		log("Currently recorded " .. settings.NPCs:length() .. "/" .. npcs:length() .. " title NPCs")
	end
end

local function log_npcs()
	if settings.NPCs:length() < npcs:length() then
		log_npc_count()
		
		local locations = S{}		
		for npc, v in pairs(npcs) do
			if not settings.NPCs[npc] then
				locations:add("Missing " .. npc .. " at " .. res.zones[v.location.zone].name .. " " .. v.location.pos)
			end
		end
		locations:sort():map(log)
	else
		log("All NPCs have been recorded at least once")
	end
end

local function log_title_count()
	local total = (res.titles - exclude):length() + bonus
	log("Currently recorded " .. titles:length() .. "/" .. total .. " owned titles")
	log_npc_count()
end

local function log_titles(owned, export)
	local name = windower.ffxi.get_player().name
	local action = owned and 'owned' or 'missing'
	local list = owned and titles or (res.titles - titles - exclude)
	list = list:map(id_to_name):sort()
	
	if export then
		local export_file = files.new('export/' .. name .. '-' .. action .. '.txt')
		if not export_file:exists() then
			export_file:create()
		end
		export_file:write(list:concat('\n'))
		notice("Exported " .. action .. " titles to: " .. export_file.path)
	else
		log("Listing all " .. list:length() .. " " .. action .. " titles...")
		list:map(log)
	end
end

-------------------------

local function add_title(id)
	if titles[id] then
		return false
	end
	
	titles:add(id)
	if exclude[id] then
		bonus = bonus + 1
	end
	return true
end

local function remove_title(id)
	if not titles[id] then
		return false
	end
	
	titles:remove(id)
	if exclude[id] then
		bonus = bonus - 1
	end
	return true
end

local function handle_npc(npc, flags)
	local new = 0
	local lost = 0
	
	for cat, ids in ipairs(npcs[npc].menu) do
		local category = flags:unpack('I', 1 + (cat - 1) * 4)
		for flag, id in ipairs(ids) do
			if bit.band(category, bit.lshift(1, flag)) == 0 then
				if add_title(id) then
					new = new + 1
				end
			else
				if remove_title(id) then
					lost = lost + 1
				end
			end
		end
	end
	
	if new > 0 or lost > 0 then
		save_titles()
		if new > 0 then
			log("Recorded " .. new .. " new titles from " .. npc)
		end
		if lost > 0 then
			log("Lost " .. lost .. " previously owned titles")
		end
	end
	
	if not settings.NPCs[npc] then
		settings.NPCs:add(npc)
		config.save(settings)
		log_npc_count()
	end
end

local function handle_info(id)
	if add_title(id) then
		save_titles()
		log("Recorded new title: " .. id_to_name(id))
	end
end

-------------------------

windower.register_event('load', 'login', function()
	if windower.ffxi.get_info().logged_in then
		load_titles()
	end
end)

windower.register_event('logout', function()
	titles = S{}
	bonus = 0
	file = nil
end)

windower.register_event('addon command', function(...)
	local args = T{...}
	local cmd = args and args[1] or ''

	if cmd == 'count' or cmd == 'c' then
		log_title_count()
	elseif cmd == 'owned' or cmd == 'o' then
		log_titles(true, args[2] == 'export')
	elseif cmd == 'missing' or cmd == 'm' then
		log_titles(false, args[2] == 'export')
	elseif cmd == 'npcs' or comd == 'n' then
		log_npcs()
	elseif cmd == 'reset' or cmd == 'r' then
		reset_titles()
	else
		log("Valid commands are:")
		log("     count - Logs total number of recorded titles")
		log("     owned [export] - Logs list of owned titles [to file]")
		log("     missing [export] - Logs list of missing titles [to file]")
		log("     npcs - Shows title NPCs that have not been checked yet")
		log("     reset - Resets all recorded titles for the current character")
    end
end)

windower.register_event('incoming chunk', function(id, original, modified, injected, blocked)
	if id == 0x033 then
		local index = original:unpack('H', 9)
		local npc = index and windower.ffxi.get_mob_by_index(index).name
		if not npc or not npcs[npc] then
			return
		end
		handle_npc(npc, original:sub(81, 104))
	elseif id == 0x061 then
		local title = original:unpack('H', 69)
		if not title then
			return
		end
		handle_info(title)
	end
end)
