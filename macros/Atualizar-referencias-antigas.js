const api = game.modules.get("wilderfeast-enhanced")?.api?.compendium;
if (!api) ui.notifications.error("Ative Wilderfeast — Fichas, Mecânicas e Compêndios.");
else await api.migrateLegacyReferences();
