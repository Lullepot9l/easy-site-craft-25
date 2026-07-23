export type CommandPreset = {
  name: string;
  description: string;
  category: string;
  subcommands?: { name: string; description: string }[];
};

export const COMMAND_CATEGORIES = [
  "Administração", "Moderação", "IA", "Tickets", "Economia", "Níveis",
  "Giveaways", "Anúncios", "Eventos", "Formulários", "Emojis", "Stickers",
  "Automações", "Analytics", "Backup", "Configurações", "Webhooks",
  "Cargos", "Canais", "Owner",
] as const;

export const COMMAND_PRESETS: CommandPreset[] = [
  // ADMINISTRAÇÃO
  { name: "setup", description: "Configura todo o servidor automaticamente", category: "Administração" },
  { name: "config", description: "Abre o painel de configurações", category: "Administração" },
  { name: "dashboard", description: "Mostra informações do servidor", category: "Administração" },
  { name: "serverinfo", description: "Informações completas do servidor", category: "Administração" },
  { name: "userinfo", description: "Informações de um usuário", category: "Administração" },
  { name: "roleinfo", description: "Informações de um cargo", category: "Administração" },
  { name: "channelinfo", description: "Informações de um canal", category: "Administração" },
  { name: "emojiinfo", description: "Informações de um emoji", category: "Administração" },
  { name: "inviteinfo", description: "Informações de um convite", category: "Administração" },
  { name: "botinfo", description: "Informações do bot", category: "Administração" },
  { name: "ping", description: "Mostra o ping", category: "Administração" },
  { name: "uptime", description: "Tempo online", category: "Administração" },
  { name: "stats", description: "Estatísticas do bot", category: "Administração" },
  { name: "health", description: "Saúde do servidor", category: "Administração" },

  // MODERAÇÃO
  { name: "ban", description: "Banir usuário", category: "Moderação" },
  { name: "softban", description: "Soft ban em usuário", category: "Moderação" },
  { name: "unban", description: "Desbanir usuário", category: "Moderação" },
  { name: "kick", description: "Expulsar usuário", category: "Moderação" },
  { name: "timeout", description: "Aplicar timeout", category: "Moderação" },
  { name: "untimeout", description: "Remover timeout", category: "Moderação" },
  { name: "warn", description: "Advertir usuário", category: "Moderação" },
  { name: "unwarn", description: "Remover advertência", category: "Moderação" },
  { name: "warnings", description: "Ver advertências", category: "Moderação" },
  { name: "mute", description: "Mutar usuário", category: "Moderação" },
  { name: "unmute", description: "Desmutar usuário", category: "Moderação" },
  { name: "lock", description: "Bloquear canal", category: "Moderação" },
  { name: "unlock", description: "Desbloquear canal", category: "Moderação" },
  { name: "purge", description: "Apagar mensagens", category: "Moderação" },
  { name: "nuke", description: "Recriar canal limpando tudo", category: "Moderação" },
  { name: "slowmode", description: "Alterar slowmode", category: "Moderação" },
  { name: "nickname", description: "Alterar apelido", category: "Moderação" },
  { name: "role", description: "Adicionar ou remover cargo", category: "Moderação" },

  // IA
  { name: "ai", description: "Conversar com a IA", category: "IA" },
  { name: "summarize", description: "Resumir conversa", category: "IA" },
  { name: "translate", description: "Traduzir mensagens", category: "IA" },
  { name: "rewrite", description: "Reescrever texto", category: "IA" },
  { name: "embed-ai", description: "Criar embed automaticamente", category: "IA" },
  { name: "announcement", description: "Gerar anúncio", category: "IA" },
  { name: "rules", description: "Gerar regras", category: "IA" },
  { name: "ticket-ai", description: "Criar painel de ticket", category: "IA" },
  { name: "server-review", description: "Analisar o servidor", category: "IA" },
  { name: "permissions-review", description: "Analisar permissões", category: "IA" },

  // TICKETS
  { name: "ticket", description: "Criar ticket", category: "Tickets" },
  { name: "close", description: "Fechar ticket", category: "Tickets" },
  { name: "reopen", description: "Reabrir ticket", category: "Tickets" },
  { name: "transcript", description: "Gerar transcript", category: "Tickets" },
  { name: "claim", description: "Assumir ticket", category: "Tickets" },
  { name: "unclaim", description: "Liberar ticket", category: "Tickets" },
  { name: "rename", description: "Renomear ticket", category: "Tickets" },
  { name: "priority", description: "Alterar prioridade", category: "Tickets" },
  { name: "add", description: "Adicionar membro ao ticket", category: "Tickets" },
  { name: "remove", description: "Remover membro do ticket", category: "Tickets" },

  // ECONOMIA
  { name: "balance", description: "Ver saldo", category: "Economia" },
  { name: "daily", description: "Recompensa diária", category: "Economia" },
  { name: "weekly", description: "Recompensa semanal", category: "Economia" },
  { name: "monthly", description: "Recompensa mensal", category: "Economia" },
  { name: "pay", description: "Transferir dinheiro", category: "Economia" },
  { name: "deposit", description: "Depositar", category: "Economia" },
  { name: "withdraw", description: "Sacar", category: "Economia" },
  { name: "shop", description: "Abrir loja", category: "Economia" },
  { name: "buy", description: "Comprar", category: "Economia" },
  { name: "sell", description: "Vender", category: "Economia" },
  { name: "inventory", description: "Inventário", category: "Economia" },
  { name: "leaderboard", description: "Ranking", category: "Economia" },

  // NÍVEIS
  { name: "rank", description: "Ver rank", category: "Níveis" },
  { name: "level", description: "Ver nível", category: "Níveis" },
  { name: "xp", description: "Ver XP", category: "Níveis" },
  { name: "top", description: "Ranking global", category: "Níveis" },
  { name: "rewards", description: "Recompensas", category: "Níveis" },

  // GIVEAWAYS
  { name: "giveaway", description: "Sorteios (create/end/reroll/pause/resume)", category: "Giveaways",
    subcommands: [
      { name: "create", description: "Criar sorteio" },
      { name: "end", description: "Encerrar" },
      { name: "reroll", description: "Novo vencedor" },
      { name: "pause", description: "Pausar" },
      { name: "resume", description: "Continuar" },
    ] },

  // ANÚNCIOS
  { name: "announce", description: "Criar anúncio", category: "Anúncios" },
  { name: "embed", description: "Criar embed", category: "Anúncios" },
  { name: "schedule", description: "Agendar anúncio", category: "Anúncios" },
  { name: "repeat", description: "Repetir anúncio", category: "Anúncios" },

  // EVENTOS
  { name: "event", description: "Gerenciar eventos", category: "Eventos",
    subcommands: [
      { name: "create", description: "Criar evento" },
      { name: "edit", description: "Editar" },
      { name: "delete", description: "Excluir" },
      { name: "list", description: "Listar" },
    ] },
  { name: "calendar", description: "Calendário", category: "Eventos" },

  // FORMULÁRIOS
  { name: "application", description: "Criar formulário", category: "Formulários" },
  { name: "review", description: "Avaliar aplicação", category: "Formulários" },
  { name: "approve", description: "Aprovar", category: "Formulários" },
  { name: "deny", description: "Negar", category: "Formulários" },

  // EMOJIS
  { name: "emoji", description: "Gerenciar emojis", category: "Emojis",
    subcommands: [
      { name: "add", description: "Adicionar emoji" },
      { name: "remove", description: "Remover" },
      { name: "rename", description: "Renomear" },
      { name: "list", description: "Listar" },
    ] },

  // STICKERS
  { name: "sticker", description: "Gerenciar stickers", category: "Stickers",
    subcommands: [
      { name: "add", description: "Adicionar sticker" },
      { name: "remove", description: "Remover" },
      { name: "list", description: "Listar" },
    ] },

  // AUTOMAÇÕES
  { name: "automation", description: "Gerenciar automações", category: "Automações",
    subcommands: [
      { name: "create", description: "Criar automação" },
      { name: "edit", description: "Editar" },
      { name: "delete", description: "Excluir" },
      { name: "enable", description: "Ativar" },
      { name: "disable", description: "Desativar" },
      { name: "list", description: "Listar" },
    ] },

  // ANALYTICS
  { name: "analytics", description: "Abrir analytics", category: "Analytics" },
  { name: "growth", description: "Crescimento", category: "Analytics" },
  { name: "messages", description: "Estatísticas de mensagens", category: "Analytics" },
  { name: "activity", description: "Atividade", category: "Analytics" },
  { name: "commands", description: "Comandos utilizados", category: "Analytics" },

  // BACKUP
  { name: "backup", description: "Backup do servidor", category: "Backup",
    subcommands: [
      { name: "create", description: "Criar backup" },
      { name: "restore", description: "Restaurar" },
      { name: "export", description: "Exportar" },
      { name: "import", description: "Importar" },
      { name: "list", description: "Histórico" },
    ] },

  // CONFIGURAÇÕES
  { name: "settings", description: "Abrir configurações", category: "Configurações" },
  { name: "language", description: "Idioma", category: "Configurações" },
  { name: "theme", description: "Tema", category: "Configurações" },
  { name: "permissions", description: "Permissões", category: "Configurações" },
  { name: "modules", description: "Ativar módulos", category: "Configurações" },
  { name: "plugins", description: "Plugins", category: "Configurações" },

  // WEBHOOKS
  { name: "webhook", description: "Gerenciar webhooks", category: "Webhooks",
    subcommands: [
      { name: "create", description: "Criar webhook" },
      { name: "edit", description: "Editar" },
      { name: "delete", description: "Excluir" },
      { name: "send", description: "Enviar mensagem" },
    ] },

  // CARGOS
  { name: "roleadmin", description: "Administrar cargos", category: "Cargos",
    subcommands: [
      { name: "create", description: "Criar cargo" },
      { name: "edit", description: "Editar" },
      { name: "delete", description: "Excluir" },
      { name: "clone", description: "Duplicar" },
      { name: "move", description: "Mover posição" },
    ] },

  // CANAIS
  { name: "channel", description: "Administrar canais", category: "Canais",
    subcommands: [
      { name: "create", description: "Criar canal" },
      { name: "delete", description: "Excluir" },
      { name: "clone", description: "Duplicar" },
      { name: "move", description: "Mover" },
      { name: "archive", description: "Arquivar" },
      { name: "lock", description: "Bloquear" },
    ] },

  // OWNER
  { name: "owner", description: "Painel exclusivo do owner", category: "Owner",
    subcommands: [
      { name: "console", description: "Abrir console" },
      { name: "database", description: "Banco de dados" },
      { name: "logs", description: "Logs completos" },
      { name: "restart", description: "Reiniciar bot" },
      { name: "shutdown", description: "Desligar bot" },
      { name: "maintenance", description: "Modo manutenção" },
      { name: "sync", description: "Sincronizar banco" },
      { name: "cache", description: "Limpar cache" },
      { name: "update", description: "Atualizar sistema" },
      { name: "terminal", description: "Abrir terminal" },
      { name: "diagnostics", description: "Diagnóstico completo" },
      { name: "modules", description: "Gerenciar módulos" },
      { name: "plugins", description: "Gerenciar plugins" },
      { name: "ai", description: "Controlar IA" },
      { name: "permissions", description: "Permissões globais" },
      { name: "backup", description: "Backup completo" },
      { name: "restore", description: "Restaurar sistema" },
      { name: "performance", description: "CPU, RAM, uso" },
      { name: "emergency", description: "Modo de emergência" },
    ] },
];
