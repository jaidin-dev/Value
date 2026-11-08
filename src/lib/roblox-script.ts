// The stable address of the published site. The Roblox script sends trades here.
export const PUBLISHED_SITE_URL = "https://project--b12af1ab-e632-4aef-b84a-68a6137c3e36.lovable.app";
export const TRADE_ENDPOINT = `${PUBLISHED_SITE_URL}/api/public/trade`;

export function buildRobloxScript(endpoint: string = TRADE_ENDPOINT) {
  return `--[[ Trade Radar - PS99 trade logger
     Sends the other player's pets to your Trade Radar site
     every time the trade window changes. ]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TradingCmds = require(ReplicatedStorage.Library.Client.TradingCmds)
local LocalPlayer = Players.LocalPlayer

local SERVER_URL = "${endpoint}"
local BOT_SECRET = "PASTE_YOUR_TRADE_SECRET_HERE" -- same value as TRADE_SECRET on the site
local DEBUG = true -- prints every pet name it sends

local httpRequest = (syn and syn.request) or (http and http.request)
    or http_request or (fluxus and fluxus.request) or request

local function sendRequest(options)
    if httpRequest then return httpRequest(options) end
    return HttpService:RequestAsync(options)
end

-- "Shiny" -> "Golden"/"Rainbow" -> base name, e.g. "Shiny Rainbow Huge Cat"
local function getFormattedPetName(data, stackData)
    data = type(data) == "table" and data or {}
    stackData = type(stackData) == "table" and stackData or {}
    local baseName = data.id or stackData.id or "Unknown Pet"
    local shiny = (data.sh == true) or (stackData.sh == true)
    local tier = tonumber(data.pt or stackData.pt) or 0
    local prefix = shiny and "Shiny " or ""
    if tier == 1 then prefix = prefix .. "Golden "
    elseif tier == 2 then prefix = prefix .. "Rainbow " end
    return prefix .. baseName
end

local function getPlayerName(p)
    if typeof(p) == "Instance" and p:IsA("Player") then return p.Name end
    if type(p) == "string" then return p end
    if type(p) == "number" then
        local plr = Players:GetPlayerByUserId(p)
        return plr and plr.Name or tostring(p)
    end
    return "UnknownPlayer"
end

local function getOtherSlot(state)
    if type(state._players) == "table" then
        for i, p in pairs(state._players) do
            local isMe = (p == LocalPlayer)
                or (type(p) == "string" and p == LocalPlayer.Name)
                or (type(p) == "number" and p == LocalPlayer.UserId)
            if not isMe then return i, p end
        end
    end
    return 2, state._players and state._players[2]
end

local function sendTrade(playerName, items)
    local ok, response = pcall(sendRequest, {
        Url = SERVER_URL,
        Method = "POST",
        Headers = {
            ["Authorization"] = BOT_SECRET,
            ["Content-Type"] = "application/json",
        },
        Body = HttpService:JSONEncode({ player = playerName, items = items }),
    })
    if not ok then
        warn("Trade Radar: request failed - " .. tostring(response))
    elseif response and response.StatusCode == 200 then
        print("Trade Radar: live trade updated (" .. #items .. " pets)")
    else
        warn("Trade Radar: server answered " .. tostring(response and response.StatusCode)
            .. " " .. tostring(response and response.Body))
    end
end

local function makeSignature(items)
    local parts = {}
    for _, it in ipairs(items) do
        table.insert(parts, it.uid .. "=" .. it.name .. "x" .. it.amount)
    end
    table.sort(parts)
    return table.concat(parts, "|")
end

task.spawn(function()
    local lastSignature = nil
    local lastPlayerName = "UnknownPlayer"

    while true do
        local ok, state = pcall(TradingCmds.GetState)

        if ok and state and state._items then
            local slot, otherPlayer = getOtherSlot(state)
            local otherName = getPlayerName(otherPlayer)
            lastPlayerName = otherName

            local theirItems = state._items[slot]
            local currentItems = {}

            if theirItems and theirItems.Pet then
                for uid, petInfo in pairs(theirItems.Pet) do
                    local stackData = {}
                    if type(petInfo._stackKey) == "string" then
                        pcall(function() stackData = HttpService:JSONDecode(petInfo._stackKey) end)
                    end
                    local data = type(petInfo._data) == "table" and petInfo._data or {}
                    table.insert(currentItems, {
                        name = getFormattedPetName(data, stackData),
                        amount = tonumber(data._am) or 1,
                        uid = tostring(uid),
                    })
                end
            end

            local signature = otherName .. "#" .. makeSignature(currentItems)
            if signature ~= lastSignature then
                if DEBUG then
                    for _, it in ipairs(currentItems) do print("  -> " .. it.name .. " x" .. it.amount) end
                end
                sendTrade(otherName, currentItems)
                lastSignature = signature
            end
        elseif lastSignature ~= nil then
            sendTrade(lastPlayerName, {}) -- trade closed: clear the site
            lastSignature = nil
        end

        task.wait(1.5)
    end
end)

print("Trade Radar logger running! Start a trade to begin tracking.")
`;
}
