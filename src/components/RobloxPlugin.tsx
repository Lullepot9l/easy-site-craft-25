import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download, Puzzle, BookOpen, Code2, Rocket, History, Trash2, Eye, Save, Key, Plus, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { listMyApiKeys, createLurisApiKey, deleteMyApiKey } from "@/lib/roblox.functions";

const API_BASE_DEFAULT = typeof window !== "undefined"
  ? `${window.location.origin}/api/public/luris`
  : "/api/public/luris";
const HISTORY_KEY = "luris.roblox.history";

type HistoryItem = { id: string; name: string; createdAt: string; apiBase: string; hasKey: boolean; src: string };
type ApiKeyRow = { id: string; name: string; key: string; created_at: string; last_used_at?: string | null };

function pluginSource(apiKey: string, apiBase: string) {
  return `-- ============================================================
--  LURIS AI · Roblox Studio Plugin  (v5)
--  Trabalhadora/assistente: conversa, pergunta, constrói, pesquisa e cria scripts
--  Ações: BUILD / GROUP / SCRIPT / ASK / SEARCH / SELECT / MOVE / DELETE / WELD / TELL
-- ============================================================

local HttpService     = game:GetService("HttpService")
local Selection       = game:GetService("Selection")
local ChangeHistory   = game:GetService("ChangeHistoryService")
local Workspace       = game:GetService("Workspace")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterPlayer   = game:GetService("StarterPlayer")

local API_URL = "${apiBase}"
local API_KEY = "${apiKey || "COLE_SUA_API_KEY_AQUI"}"

local history = {}
local MAX_TURNS = 12

-- paleta Luris
local C_BG      = Color3.fromRGB(12,8,24)
local C_PANEL   = Color3.fromRGB(20,14,42)
local C_PANEL2  = Color3.fromRGB(30,20,60)
local C_ACCENT  = Color3.fromRGB(170,80,255)
local C_ACCENT2 = Color3.fromRGB(255,90,200)
local C_TEXT    = Color3.fromRGB(235,225,255)
local C_MUTED   = Color3.fromRGB(160,150,200)
local C_GOOD    = Color3.fromRGB(120,240,180)
local C_BAD     = Color3.fromRGB(255,110,120)

local toolbar = plugin:CreateToolbar("Luris AI 🌑")
local button  = toolbar:CreateButton("Luris", "Abrir Luris AI", "rbxassetid://6031075931")

local widget = plugin:CreateDockWidgetPluginGui(
    "LurisAI_Worker_Widget_v5",
    DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 440, 660, 360, 520)
)
widget.Title = "Luris Worker AI 🌑"

local root = Instance.new("Frame", widget)
root.Size = UDim2.fromScale(1,1); root.BackgroundColor3 = C_BG; root.BorderSizePixel = 0

-- topo com "logo" Luris (gradiente + wordmark)
local header = Instance.new("Frame", root)
header.Size = UDim2.new(1,0,0,54); header.BackgroundColor3 = C_PANEL; header.BorderSizePixel = 0
local hg = Instance.new("UIGradient", header)
hg.Color = ColorSequence.new{
    ColorSequenceKeypoint.new(0, Color3.fromRGB(60,20,90)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(120,40,180)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(220,60,160)),
}
hg.Rotation = 20

local moon = Instance.new("TextLabel", header)
moon.Size = UDim2.new(0,44,0,44); moon.Position = UDim2.new(0,8,0,5)
moon.BackgroundColor3 = Color3.fromRGB(15,10,30); moon.BorderSizePixel = 0
moon.Text = "🌑"; moon.Font = Enum.Font.GothamBold; moon.TextSize = 26
moon.TextColor3 = Color3.fromRGB(230,190,255)
local mc = Instance.new("UICorner", moon); mc.CornerRadius = UDim.new(1,0)
local ms = Instance.new("UIStroke", moon); ms.Color = C_ACCENT; ms.Thickness = 1.5; ms.Transparency = 0.2

local title = Instance.new("TextLabel", header)
title.Position = UDim2.new(0,60,0,6); title.Size = UDim2.new(1,-70,0,24)
title.BackgroundTransparency = 1; title.Text = "LURIS  WORKER"
title.Font = Enum.Font.GothamBlack; title.TextSize = 20
title.TextColor3 = Color3.new(1,1,1); title.TextXAlignment = Enum.TextXAlignment.Left

local status = Instance.new("TextLabel", header)
status.Position = UDim2.new(0,60,0,30); status.Size = UDim2.new(1,-160,0,18)
status.BackgroundTransparency = 1; status.Text = "● pronta para trabalhar"
status.Font = Enum.Font.Code; status.TextSize = 11; status.TextColor3 = C_MUTED
status.TextXAlignment = Enum.TextXAlignment.Left

local clearBtn = Instance.new("TextButton", header)
clearBtn.Size = UDim2.new(0,86,0,26); clearBtn.Position = UDim2.new(1,-94,0,14)
clearBtn.BackgroundColor3 = Color3.fromRGB(50,15,55); clearBtn.TextColor3 = Color3.new(1,1,1)
clearBtn.Text = "🗑 limpar"; clearBtn.Font = Enum.Font.GothamBold; clearBtn.TextSize = 11
clearBtn.BorderSizePixel = 0
local cc = Instance.new("UICorner", clearBtn); cc.CornerRadius = UDim.new(0,6)

-- log
local log = Instance.new("ScrollingFrame", root)
log.Size = UDim2.new(1,-10,1,-170); log.Position = UDim2.new(0,5,0,60)
log.BackgroundColor3 = C_PANEL; log.BorderSizePixel = 0
log.AutomaticCanvasSize = Enum.AutomaticSize.Y; log.CanvasSize = UDim2.new()
log.ScrollBarThickness = 4; log.ScrollBarImageColor3 = C_ACCENT
local lc = Instance.new("UICorner", log); lc.CornerRadius = UDim.new(0,8)
local layout = Instance.new("UIListLayout", log)
layout.Padding = UDim.new(0,6); layout.SortOrder = Enum.SortOrder.LayoutOrder
local pad = Instance.new("UIPadding", log)
pad.PaddingLeft = UDim.new(0,8); pad.PaddingRight = UDim.new(0,8)
pad.PaddingTop = UDim.new(0,8); pad.PaddingBottom = UDim.new(0,8)

-- input
local input = Instance.new("TextBox", root)
input.Size = UDim2.new(1,-100,0,64); input.Position = UDim2.new(0,5,1,-105)
input.PlaceholderText = "Fala com a Luris... ex: 'constrói um carro que anda e pergunta o estilo'"
input.Text = ""; input.BackgroundColor3 = C_PANEL2; input.TextColor3 = C_TEXT
input.Font = Enum.Font.Code; input.TextSize = 13; input.ClearTextOnFocus = false
input.TextWrapped = true; input.MultiLine = true
input.TextXAlignment = Enum.TextXAlignment.Left; input.TextYAlignment = Enum.TextYAlignment.Top
input.BorderSizePixel = 0
local ic = Instance.new("UICorner", input); ic.CornerRadius = UDim.new(0,8)
local ip = Instance.new("UIPadding", input)
ip.PaddingLeft = UDim.new(0,8); ip.PaddingTop = UDim.new(0,6); ip.PaddingRight = UDim.new(0,8)

local send = Instance.new("TextButton", root)
send.Size = UDim2.new(0,90,0,64); send.Position = UDim2.new(1,-95,1,-105)
send.BackgroundColor3 = C_ACCENT; send.TextColor3 = Color3.new(1,1,1)
send.Text = "▶ Enviar"; send.Font = Enum.Font.GothamBlack; send.TextSize = 14
send.BorderSizePixel = 0
local sc = Instance.new("UICorner", send); sc.CornerRadius = UDim.new(0,8)
local ss = Instance.new("UIStroke", send); ss.Color = C_ACCENT2; ss.Thickness = 1.4

-- botões inserir script
local insertServer = Instance.new("TextButton", root)
insertServer.Size = UDim2.new(0.5,-8,0,32); insertServer.Position = UDim2.new(0,5,1,-36)
insertServer.BackgroundColor3 = Color3.fromRGB(60,180,140); insertServer.TextColor3 = Color3.new(1,1,1)
insertServer.Text = "＋ ServerScript"; insertServer.Font = Enum.Font.GothamBold; insertServer.TextSize = 12
insertServer.BorderSizePixel = 0
local is1 = Instance.new("UICorner", insertServer); is1.CornerRadius = UDim.new(0,6)

local insertLocal = Instance.new("TextButton", root)
insertLocal.Size = UDim2.new(0.5,-8,0,32); insertLocal.Position = UDim2.new(0.5,3,1,-36)
insertLocal.BackgroundColor3 = Color3.fromRGB(60,140,220); insertLocal.TextColor3 = Color3.new(1,1,1)
insertLocal.Text = "＋ LocalScript"; insertLocal.Font = Enum.Font.GothamBold; insertLocal.TextSize = 12
insertLocal.BorderSizePixel = 0
local is2 = Instance.new("UICorner", insertLocal); is2.CornerRadius = UDim.new(0,6)

local lastReply, lastCode = "", ""

-- =================== helpers ===================
local function addMsg(who, text, tint)
    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(1,0,0,0); lbl.AutomaticSize = Enum.AutomaticSize.Y
    lbl.BackgroundColor3 = tint or (who == "you" and C_PANEL2 or Color3.fromRGB(24,18,48))
    lbl.TextColor3 = who == "you" and Color3.fromRGB(210,195,255)
        or (who == "sys" and C_GOOD or C_TEXT)
    lbl.Font = Enum.Font.Code; lbl.TextSize = 12; lbl.TextWrapped = true
    lbl.TextXAlignment = Enum.TextXAlignment.Left; lbl.TextYAlignment = Enum.TextYAlignment.Top
    lbl.RichText = false; lbl.BorderSizePixel = 0
    local prefix = who == "you" and "🧑  " or (who == "sys" and "⚙  " or "🌑  ")
    lbl.Text = prefix .. text
    local corner = Instance.new("UICorner", lbl); corner.CornerRadius = UDim.new(0,6)
    local lp = Instance.new("UIPadding", lbl)
    lp.PaddingLeft = UDim.new(0,8); lp.PaddingRight = UDim.new(0,8)
    lp.PaddingTop = UDim.new(0,6); lp.PaddingBottom = UDim.new(0,6)
    lbl.Parent = log
end

local function extractCode(text)
    local block = text:match("\`\`\`lua%s*\\n(.-)\`\`\`") or text:match("\`\`\`%s*\\n(.-)\`\`\`")
    if block then return block end
    if text:find("local ") or text:find("function ") then return text end
    return nil
end

local function parseKV(str)
    local t = {}
    for k, v in str:gmatch("(%w+)=([^%s%]]+)") do t[k] = v end
    return t
end
local function toVec3(s, default)
    if not s then return default end
    local x,y,z = s:match("([%-%d%.]+),([%-%d%.]+),([%-%d%.]+)")
    if not x then return default end
    return Vector3.new(tonumber(x), tonumber(y), tonumber(z))
end
local function toColor(s, default)
    if not s then return default end
    local r,g,b = s:match("(%d+),(%d+),(%d+)")
    if not r then return default end
    return Color3.fromRGB(tonumber(r), tonumber(g), tonumber(b))
end
local function resolvePath(path)
    if not path or path == "" then return Workspace end
    local node = game
    for seg in tostring(path):gmatch("[^%.]+") do
        local nextNode = node:FindFirstChild(seg)
        if not nextNode and node == game then
            local ok, service = pcall(function() return game:GetService(seg) end)
            if ok then nextNode = service end
        end
        node = nextNode
        if not node then return nil end
    end
    return node
end

local function setParent(inst, path)
    local parent = resolvePath(path)
    if not parent then
        addMsg("sys", "⚠ parent não encontrado, usando Workspace: "..tostring(path))
        parent = Workspace
    end
    inst.Parent = parent
end

-- base64 decoder (para SCRIPT code64=...)
local B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local function b64decode(data)
    data = tostring(data):gsub("[^"..B64.."=]", "")
    return (data:gsub(".", function(x)
        if x == "=" then return "" end
        local r,f = "", (B64:find(x) or 1) - 1
        for i = 6,1,-1 do r = r..(f % 2^i - f % 2^(i-1) > 0 and "1" or "0") end
        return r
    end):gsub("%d%d%d?%d?%d?%d?%d?%d?", function(x)
        if #x ~= 8 then return "" end
        local c = 0
        for i = 1,8 do c = c + (x:sub(i,i) == "1" and 2^(8-i) or 0) end
        return string.char(c)
    end))
end

-- =================== executor de ações ===================
local pendingAsk -- guarda callback pra próximo click de opção

local function askButtons(question, options, id)
    local wrap = Instance.new("Frame", log)
    wrap.Size = UDim2.new(1,0,0,0); wrap.AutomaticSize = Enum.AutomaticSize.Y
    wrap.BackgroundColor3 = Color3.fromRGB(35,20,60); wrap.BorderSizePixel = 0
    local wc = Instance.new("UICorner", wrap); wc.CornerRadius = UDim.new(0,6)
    local wp = Instance.new("UIPadding", wrap)
    wp.PaddingLeft = UDim.new(0,8); wp.PaddingRight = UDim.new(0,8)
    wp.PaddingTop = UDim.new(0,6); wp.PaddingBottom = UDim.new(0,6)
    local wl = Instance.new("UIListLayout", wrap); wl.Padding = UDim.new(0,4)
    local q = Instance.new("TextLabel", wrap)
    q.Size = UDim2.new(1,0,0,0); q.AutomaticSize = Enum.AutomaticSize.Y
    q.BackgroundTransparency = 1; q.TextColor3 = C_TEXT
    q.Font = Enum.Font.GothamBold; q.TextSize = 12; q.TextWrapped = true
    q.TextXAlignment = Enum.TextXAlignment.Left
    q.Text = "🌑 "..question
    for _, opt in ipairs(options) do
        local b = Instance.new("TextButton", wrap)
        b.Size = UDim2.new(1,0,0,26); b.BackgroundColor3 = C_ACCENT
        b.TextColor3 = Color3.new(1,1,1); b.Font = Enum.Font.GothamBold; b.TextSize = 12
        b.Text = opt; b.BorderSizePixel = 0
        local bc = Instance.new("UICorner", b); bc.CornerRadius = UDim.new(0,4)
        b.MouseButton1Click:Connect(function()
            wrap:Destroy()
            local answer = (id and (id.."=") or "").. opt
            _G.__lurisAsk(answer)
        end)
    end
end

local function runAction(kind, args)
    if kind == "BUILD" then
        local class = args.class or "Part"
        if class == "CylinderPart" then class = "Part"; args.shape = args.shape or "Cylinder" end
        local ok, inst = pcall(Instance.new, class)
        if not ok then addMsg("sys", "✗ classe inválida: "..class); return end
        inst.Name = args.name or ("Luris_"..class)
        if inst:IsA("BasePart") then
            inst.Size     = toVec3(args.size, Vector3.new(4,4,4))
            inst.Position = toVec3(args.pos,  Vector3.new(0,10,0))
            inst.Orientation = toVec3(args.rot, Vector3.new(0,0,0))
            inst.Color    = toColor(args.color, Color3.fromRGB(170,80,255))
            inst.CanCollide = args.canCollide ~= "false"
            if args.transparency then inst.Transparency = tonumber(args.transparency) or 0 end
            if args.shape and inst:IsA("Part") then
                local sh = Enum.PartType[args.shape]; if sh then inst.Shape = sh end
            end
            if args.material then
                local m = Enum.Material[args.material]; if m then inst.Material = m end
            end
            if args.anchored ~= "false" then inst.Anchored = true end
        end
        setParent(inst, args.parent)
        Selection:Set({inst})
        ChangeHistory:SetWaypoint("Luris: build "..inst.Name)
        addMsg("sys", "✓ criado "..inst:GetFullName())
    elseif kind == "GROUP" then
        local class = args.class or "Model"
        local ok, g = pcall(Instance.new, class)
        if not ok then addMsg("sys","✗ classe inválida: "..class); return end
        g.Name = args.name or "LurisGroup"
        setParent(g, args.parent)
        ChangeHistory:SetWaypoint("Luris: group "..g.Name)
        addMsg("sys","📦 grupo "..g:GetFullName())
    elseif kind == "SCRIPT" then
        local kindMap = { Server = "Script", Local = "LocalScript", Module = "ModuleScript" }
        local className = kindMap[args.type or "Server"] or "Script"
        local s = Instance.new(className); s.Name = args.name or "LurisScript"
        local code = args.code64 and b64decode(args.code64) or (args.code or "")
        s.Source = code; setParent(s, args.parent)
        Selection:Set({s})
        ChangeHistory:SetWaypoint("Luris: script "..s.Name)
        addMsg("sys","📜 "..className.." "..s:GetFullName().." ("..#code.." chars)")
    elseif kind == "ASK" then
        local question = args.question or "?"
        local opts = {}
        for o in tostring(args.options or ""):gmatch("[^|]+") do table.insert(opts, o) end
        if #opts == 0 then opts = {"Sim","Não"} end
        askButtons(question, opts, args.id)
    elseif kind == "SEARCH" then
        local pattern = (args.pattern or ""):lower()
        local hits = {}
        for _, d in ipairs(Workspace:GetDescendants()) do
            if d.Name:lower():find(pattern, 1, true) then table.insert(hits, d:GetFullName()) end
            if #hits >= 25 then break end
        end
        addMsg("sys", "🔎 "..#hits.." resultado(s):\\n"..table.concat(hits,"\\n"))
    elseif kind == "SELECT" then
        local n = resolvePath(args.path); if not n then addMsg("sys","✗ não achei "..tostring(args.path)); return end
        Selection:Set({n}); addMsg("sys","✓ selecionei "..n:GetFullName())
    elseif kind == "MOVE" then
        local n = resolvePath(args.path); if not (n and n:IsA("BasePart")) then addMsg("sys","✗ path inválido"); return end
        n.Position = toVec3(args.pos, n.Position)
        n.Orientation = toVec3(args.rot, n.Orientation)
        ChangeHistory:SetWaypoint("Luris: move "..n.Name)
        addMsg("sys","✓ movido "..n.Name.." → "..tostring(n.Position))
    elseif kind == "WELD" then
        local a = resolvePath(args.a); local b = resolvePath(args.b)
        if not (a and b and a:IsA("BasePart") and b:IsA("BasePart")) then addMsg("sys", "✗ weld inválido"); return end
        local w = Instance.new("WeldConstraint"); w.Name = "LurisWeld"; w.Part0 = a; w.Part1 = b; w.Parent = a
        ChangeHistory:SetWaypoint("Luris: weld")
        addMsg("sys", "🔩 weld "..a.Name.." + "..b.Name)
    elseif kind == "DELETE" then
        local n = resolvePath(args.path); if not n then addMsg("sys","✗ não achei "..tostring(args.path)); return end
        local nm = n:GetFullName(); n:Destroy()
        ChangeHistory:SetWaypoint("Luris: delete "..nm)
        addMsg("sys","🗑 apagado "..nm)
    elseif kind == "TELL" then
        print("[Luris] "..(args.text or ""))
        addMsg("sys","📢 "..(args.text or ""))
    end
end

local function parseAskBlock(rest)
    -- captura question=..., options=..., id=... permitindo espaços
    local args = {}
    args.question = rest:match("question=(.-)%s+options=") or rest:match("question=(.-)%s+id=") or rest:match("question=(.+)$")
    args.options  = rest:match("options=(.-)%s+id=") or rest:match("options=(.+)$")
    args.id       = rest:match("id=([%w_%-]+)")
    return args
end

local function runActionsIn(text)
    local count = 0
    for block in text:gmatch("%[%[(.-)%]%]") do
        local kind, rest = block:match("^(%u+)%s*(.*)$")
        if kind then
            local args
            if kind == "ASK" then
                args = parseAskBlock(rest or "")
            else
                args = parseKV(rest or "")
                local textArg = rest:match("text=(.+)$")
                if textArg then args.text = textArg end
            end
            runAction(kind, args)
            count = count + 1
        end
    end
    return count
end

-- =================== chat ===================
local function trimHistory()
    while #history > MAX_TURNS * 2 do table.remove(history, 1) end
end

local function ask(prompt)
    if API_KEY == "" or API_KEY == "COLE_SUA_API_KEY_AQUI" then
        addMsg("luris", "⚠️ Cole uma API Key válida no gerador do site e baixe o plugin de novo."); return
    end
    addMsg("you", prompt)
    table.insert(history, { role = "user", content = prompt })
    trimHistory()
    status.Text = "◐ pensando..."; send.Text = "..."
    local ok, res = pcall(function()
        return HttpService:RequestAsync({
            Url = API_URL, Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json",
                ["Authorization"] = "Bearer " .. API_KEY,
                ["x-api-key"] = API_KEY,
            },
            Body = HttpService:JSONEncode({ model = "luris-roblox-worker", messages = history }),
        })
    end)
    send.Text = "▶ Enviar"
    if not ok then
        status.Text = "✗ erro rede"; status.TextColor3 = C_BAD
        addMsg("luris", "Erro de rede. Ative HTTP Requests em Game Settings > Security.\\n"..tostring(res)); return
    end
    if not res.Success then
        status.Text = "✗ "..tostring(res.StatusCode); status.TextColor3 = C_BAD
        addMsg("luris", "Servidor: "..tostring(res.StatusCode).."\\n"..tostring(res.Body):sub(1,300)); return
    end
    local okJ, data = pcall(HttpService.JSONDecode, HttpService, res.Body)
    if not okJ then status.Text = "✗ json"; addMsg("luris", "Resposta inválida"); return end
    if data.error and not (data.content or data.reply) then
        status.Text = "✗ api"; status.TextColor3 = C_BAD
        addMsg("luris", "Erro API: "..tostring(data.error)); return
    end
    lastReply = data.content or data.reply or data.text
        or (data.message and data.message.content)
        or (data.choices and data.choices[1] and data.choices[1].message and data.choices[1].message.content)
        or "(sem resposta)"
    table.insert(history, { role = "assistant", content = lastReply })
    trimHistory()
    lastCode = extractCode(lastReply) or ""
    -- mostra texto limpo (sem os blocos de ação)
    local clean = lastReply:gsub("%[%[.-%]%]", ""):gsub("^%s+", ""):gsub("%s+$", "")
    if clean ~= "" then addMsg("luris", clean) end
    local n = runActionsIn(lastReply)
    status.TextColor3 = C_MUTED
    status.Text = "● pronto"
        ..(lastCode ~= "" and "  ·  código detectado" or "")
        ..(n > 0 and ("  ·  "..n.." ação(ões)") or "")
end
_G.__lurisAsk = ask  -- botões [[ASK]] chamam essa função com a resposta

local function doInsert(className)
    if lastCode == "" then
        addMsg("luris", "⚠️ Nenhum bloco de código detectado."); return
    end
    local parent = className == "Script"
        and ServerScriptService
        or  StarterPlayer:FindFirstChild("StarterPlayerScripts")
    local s = Instance.new(className); s.Name = "LurisGenerated"
    s.Source = lastCode; s.Parent = parent
    Selection:Set({s})
    ChangeHistory:SetWaypoint("Luris: insert "..className)
    addMsg("sys", "✓ "..className.." inserido em "..parent:GetFullName())
end

send.MouseButton1Click:Connect(function()
    local t = input.Text; if t == "" then return end
    input.Text = ""; ask(t)
end)
input.FocusLost:Connect(function(enter)
    if enter and input.Text ~= "" then local t = input.Text; input.Text = ""; ask(t) end
end)
insertServer.MouseButton1Click:Connect(function() doInsert("Script") end)
insertLocal.MouseButton1Click:Connect(function() doInsert("LocalScript") end)
clearBtn.MouseButton1Click:Connect(function()
    history = {}; log:ClearAllChildren()
    local l2 = Instance.new("UIListLayout", log); l2.Padding = UDim.new(0,6); l2.SortOrder = Enum.SortOrder.LayoutOrder
    local p2 = Instance.new("UIPadding", log)
    p2.PaddingLeft = UDim.new(0,8); p2.PaddingRight = UDim.new(0,8)
    p2.PaddingTop = UDim.new(0,8); p2.PaddingBottom = UDim.new(0,8)
    addMsg("luris", "🧹 conversa limpa. Manda ver.")
end)

button.Click:Connect(function() widget.Enabled = not widget.Enabled end)
addMsg("luris", "Oi 🌑 eu sou a Luris Worker. Eu converso, faço perguntas, procuro objetos e construo no teu mapa com scripts quando precisar.")
`;
}

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(h: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 30)));
}

function highlightLua(code: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = esc(code);
  out = out.replace(/(--\[\[[\s\S]*?\]\]|--[^\n]*)/g, '<span style="color:oklch(0.65 0.05 200)">$1</span>');
  out = out.replace(/("[^"\n]*"|'[^'\n]*')/g, '<span style="color:oklch(0.85 0.2 140)">$1</span>');
  out = out.replace(/\b(local|function|end|if|then|else|elseif|for|do|while|return|not|and|or|nil|true|false|in)\b/g,
    '<span style="color:oklch(0.82 0.28 320);font-weight:600">$1</span>');
  out = out.replace(/\b(game|plugin|Instance|Enum|Color3|UDim2|UDim|HttpService|script|workspace)\b/g,
    '<span style="color:oklch(0.85 0.22 60)">$1</span>');
  out = out.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:oklch(0.82 0.2 30)">$1</span>');
  return out;
}

export function RobloxPlugin() {
  const [apiKey, setApiKey] = useState("");
  const [apiBase, setApiBase] = useState(API_BASE_DEFAULT);
  const [name, setName] = useState("LurisAI");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const listKeys = useServerFn(listMyApiKeys);
  const createKey = useServerFn(createLurisApiKey);
  const delKey = useServerFn(deleteMyApiKey);

  const src = useMemo(() => pluginSource(apiKey, apiBase), [apiKey, apiBase]);

  useEffect(() => { setHistory(loadHistory()); refreshKeys(); }, []);

  async function refreshKeys() {
    setLoadingKeys(true);
    try {
      const rows = await listKeys() as ApiKeyRow[];
      setKeys(rows);
      if (rows.length && !apiKey) setApiKey(rows[0].key);
    } catch (e: any) { toast.error(e.message); }
    setLoadingKeys(false);
  }

  async function newKey() {
    try {
      const row = await createKey({ data: { name: `Roblox Studio ${new Date().toLocaleDateString()}` } }) as ApiKeyRow;
      setApiKey(row.key);
      toast.success("API Key criada e selecionada");
      refreshKeys();
    } catch (e: any) { toast.error(e.message); }
  }

  async function removeKey(id: string) {
    if (!confirm("Deletar essa API Key? Plugins que ainda a usam vão parar de funcionar.")) return;
    try { await delKey({ data: { id } }); toast.success("Key removida"); refreshKeys(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function testConnection() {
    if (!apiKey) { toast.error("Sem API Key selecionada."); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ message: "diga apenas: pong" }),
      });
      const txt = await res.text();
      if (!res.ok) { setTestResult({ ok: false, msg: `${res.status}: ${txt.slice(0, 200)}` }); return; }
      const data = JSON.parse(txt);
      setTestResult({ ok: true, msg: data.content || data.reply || "(vazio)" });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message });
    } finally { setTesting(false); }
  }

  function copy(text = src) { navigator.clipboard.writeText(text); toast.success("Copiado!"); }
  function download(text = src, filename = `${name || "LurisAI"}.lua`) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} baixado`);
  }
  function saveToHistory() {
    const item: HistoryItem = {
      id: crypto.randomUUID(), name: name || "LurisAI",
      createdAt: new Date().toISOString(), apiBase, hasKey: !!apiKey, src,
    };
    const next = [item, ...history];
    setHistory(next); saveHistory(next);
    toast.success("Salvo no histórico");
  }
  function removeItem(id: string) {
    const next = history.filter(h => h.id !== id);
    setHistory(next); saveHistory(next);
  }
  function clearHistory() {
    setHistory([]); saveHistory([]);
    toast.success("Histórico limpo");
  }

  const shown = previewSrc ?? src;

  return (
    <div className="space-y-5">
      <div className="glass rounded-xl p-4 border border-[oklch(0.5_0.2_295/0.4)] flex items-center gap-3">
        <img src="/luris-icon.png" alt="" className="h-10 w-10 rounded-lg" style={{ boxShadow: "0 0 14px oklch(0.6 0.3 295 / 0.6)" }} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-[oklch(0.78_0.28_330)]" />
            <h3 className="font-display gradient-text text-lg">Luris · Plugin do Roblox Studio (v5 Worker)</h3>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Chat com IA real, perguntas interativas, construção no mapa, busca de objetos e scripts funcionais.
          </p>
        </div>
      </div>

      {/* API KEYS */}
      <div className="glass-strong rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[oklch(0.85_0.2_60)]" />
            <h3 className="font-display neon-text text-lg">API Keys</h3>
            <span className="text-[10px] font-mono text-muted-foreground">({keys.length})</span>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshKeys} disabled={loadingKeys}
              className="glass px-3 py-1.5 rounded text-xs hover-lift">↻ atualizar</button>
            <button onClick={newKey}
              className="px-3 py-1.5 rounded text-xs font-display flex items-center gap-1"
              style={{ background: "oklch(0.5 0.25 295)", color: "white" }}>
              <Plus className="h-3 w-3" /> Criar nova key
            </button>
          </div>
        </div>
        {keys.length === 0 && !loadingKeys && (
          <p className="text-[11px] font-mono text-muted-foreground">
            Sem keys. Clique em <b>Criar nova key</b> — ela vai ser embutida no plugin automaticamente.
          </p>
        )}
        <div className="space-y-1.5">
          {keys.map(k => (
            <div key={k.id}
              className={`glass p-2 rounded flex items-center gap-2 text-xs ${apiKey === k.key ? "ring-1 ring-[oklch(0.7_0.25_295)]" : ""}`}>
              <input type="radio" checked={apiKey === k.key} onChange={() => setApiKey(k.key)} />
              <div className="flex-1 min-w-0">
                <div className="font-display truncate">{k.name}</div>
                <code className="text-[10px] text-muted-foreground truncate block">{k.key}</code>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(k.key); toast.success("Key copiada"); }}
                className="glass px-2 py-1 rounded text-[10px]"><Copy className="h-3 w-3" /></button>
              <button onClick={() => removeKey(k.id)}
                className="glass px-2 py-1 rounded text-[10px] text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIG */}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="glass p-3 rounded-lg text-xs font-mono space-y-1 block">
          <span className="neon-text">Nome do plugin</span>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-black/50 rounded px-2 py-1.5 mt-1" />
        </label>
        <label className="glass p-3 rounded-lg text-xs font-mono space-y-1 block">
          <span className="neon-text">API Key selecionada</span>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="luris_sk_..." className="w-full bg-black/50 rounded px-2 py-1.5 mt-1" />
        </label>
        <label className="glass p-3 rounded-lg text-xs font-mono space-y-1 block">
          <span className="neon-text">Endpoint</span>
          <input value={apiBase} onChange={(e) => setApiBase(e.target.value)}
            className="w-full bg-black/50 rounded px-2 py-1.5 mt-1" />
        </label>
      </div>

      <div className="glass rounded-xl p-4 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="neon-text-magenta">Endpoint compatível com apps estilo OpenAI</span>
          <button onClick={() => copy(`${apiBase.replace(/\/$/, "")}/v1/chat/completions`)} className="glass px-2 py-1 rounded text-[10px]">
            <Copy className="h-3 w-3 inline mr-1" /> Copiar
          </button>
        </div>
        <code className="block break-all text-muted-foreground">{apiBase.replace(/\/$/, "")}/v1/chat/completions</code>
      </div>

      {/* TEST */}
      <div className="glass rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-[oklch(0.7_0.25_140)]" />
            <h4 className="font-display neon-text-magenta">Testar conexão</h4>
          </div>
          <button onClick={testConnection} disabled={testing}
            className="glass px-3 py-1.5 rounded text-xs hover-lift">
            {testing ? "testando..." : "▶ enviar ping"}
          </button>
        </div>
        {testResult && (
          <div className={`text-xs font-mono flex items-start gap-2 p-2 rounded ${testResult.ok ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
            <span className="break-all">{testResult.msg}</span>
          </div>
        )}
      </div>

      {/* SOURCE */}
      <div className="glass-strong rounded-xl p-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-display">
            <Code2 className="h-4 w-4 text-[oklch(0.78_0.28_330)]" />
            {previewSrc ? "Preview do histórico" : `${name || "LurisAI"}.lua`}
            {previewSrc && (
              <button onClick={() => setPreviewSrc(null)} className="ml-2 text-[10px] text-muted-foreground underline">voltar ao atual</button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => copy(shown)} className="glass px-3 py-1.5 rounded text-xs hover-lift flex items-center gap-1">
              <Copy className="h-3 w-3" /> Copiar
            </button>
            <button onClick={() => download(shown)} className="glass px-3 py-1.5 rounded text-xs hover-lift flex items-center gap-1 neon-text-magenta">
              <Download className="h-3 w-3" /> Baixar .lua
            </button>
            {!previewSrc && (
              <button onClick={saveToHistory} className="glass px-3 py-1.5 rounded text-xs hover-lift flex items-center gap-1 neon-text">
                <Save className="h-3 w-3" /> Salvar no histórico
              </button>
            )}
          </div>
        </div>
        <pre
          className="bg-black/80 rounded p-3 text-[10.5px] font-mono leading-relaxed overflow-auto max-h-80"
          dangerouslySetInnerHTML={{ __html: highlightLua(shown) }}
        />
      </div>

      {/* HISTÓRICO */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[oklch(0.78_0.28_330)]" />
            <h3 className="font-display neon-text-magenta text-lg">Histórico de gerações</h3>
            <span className="text-[10px] font-mono text-muted-foreground">({history.length})</span>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-[10px] font-mono text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        {history.length === 0 && (
          <p className="text-[11px] font-mono text-muted-foreground">Nenhum plugin salvo ainda.</p>
        )}
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="glass p-2.5 rounded-lg flex items-center gap-3 text-xs">
              <div className="flex-1 min-w-0">
                <div className="font-display truncate">{h.name}.lua {h.hasKey && <span className="text-[9px] text-[oklch(0.7_0.25_140)]">🔑</span>}</div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">
                  {new Date(h.createdAt).toLocaleString()}
                </div>
              </div>
              <button onClick={() => setPreviewSrc(h.src)} className="glass px-2 py-1 rounded text-[10px]"><Eye className="h-3 w-3" /></button>
              <button onClick={() => download(h.src, `${h.name}.lua`)} className="glass px-2 py-1 rounded text-[10px]"><Download className="h-3 w-3" /></button>
              <button onClick={() => removeItem(h.id)} className="glass px-2 py-1 rounded text-[10px] text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* TUTORIAL */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[oklch(0.7_0.25_140)]" />
          <h3 className="font-display neon-text text-lg">Como instalar</h3>
        </div>
        <ol className="text-xs font-mono space-y-2 list-decimal list-inside text-muted-foreground">
          <li>Clique em <b>Criar nova key</b> acima (a key vai direto no arquivo).</li>
          <li>Clique em <b>▶ enviar ping</b> pra confirmar que a IA responde.</li>
          <li>Baixe <b>{name || "LurisAI"}.lua</b>.</li>
          <li>Roblox Studio → <b>Plugins → Plugins Folder</b> → cole o arquivo lá.</li>
          <li>Studio → <b>Plugins → Reload</b>. Aparece o botão <b>Luris</b> 🌑.</li>
          <li><b>Game Settings → Security → Allow HTTP Requests</b>: ativar.</li>
          <li>Clica no botão Luris, pede algo tipo: <i>"gera um LocalScript que faz o player voar"</i>.</li>
          <li>Se a resposta contém código, os botões <b>＋ ServerScript</b> / <b>＋ LocalScript</b> inserem direto no lugar certo.</li>
        </ol>
      </div>
    </div>
  );
}
