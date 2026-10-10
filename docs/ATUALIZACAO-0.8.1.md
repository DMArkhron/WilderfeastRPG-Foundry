# v0.8.1
- Marcadores SVG vetoriais, sem bitmap embutido, com dimensões explícitas de 2400 × 3800 para rasterização no canvas do Foundry. Proporção 480:760 preservada.
- Novo caminho de textura evita reutilização da versão em cache. Peças criadas pelo módulo são atualizadas ao abrir o mundo como GM, preservando posição e tamanho.
- Capa original incluída como padrão da Cena, com Playlist Fogueira da Floresta em loop. Preferências de imagem já salvas são preservadas.
- Para peças redimensionadas de forma desproporcional anteriormente, restaure a proporção largura/altura 480/760 nas configurações do Tile.
- SVG é vetorial; o canvas do Foundry usa textura finita. Ampliações extremas ainda podem suavizar a imagem.
- Validação automatizada e navegador externo; sem sessão real do Foundry.
