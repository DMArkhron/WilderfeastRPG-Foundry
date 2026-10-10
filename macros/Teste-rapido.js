const api = game.modules.get("wilderfeast-enhanced")?.api;
if (!api) return ui.notifications.error("Ative o módulo Wilderfeast — Fichas e Mecânicas Aprimoradas.");
try { await api.rollDialog(api.selectedActor()); } catch (error) { ui.notifications.error(error.message); }
