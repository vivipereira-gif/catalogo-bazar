# Contexto do projeto — Bazar da Ana Rebeca

## Objetivo

Construir em até dois dias o MVP de um catálogo virtual responsivo, estilo e-commerce, para o **Bazar da Ana Rebeca**. O bazar divulga semanalmente roupas selecionadas em um grupo de WhatsApp. O catálogo deve facilitar a publicação, o compartilhamento, a escolha das peças e o envio dos pedidos.

## História e identidade

O bazar é dedicado a Ana Rebeca, filha dos proprietários e uma criança atípica. A aplicação deve transmitir carinho e delicadeza, mantendo uma aparência moderna e profissional, sem ficar excessivamente infantil.

Direção visual inicial:

- Layout bonito, delicado, moderno e mobile-first.
- Fundo creme e tons rosados suaves.
- Detalhes em verde-sálvia.
- Tipografia elegante e interface acolhedora.

## Jornada da cliente

1. A cliente recebe o link no grupo de WhatsApp.
2. Acessa o catálogo público sem cadastro.
3. Visualiza as peças e seus detalhes.
4. Adiciona uma ou mais peças ao carrinho.
5. Informa nome completo, telefone e endereço.
6. Toca em “Enviar pedido pelo WhatsApp”.
7. O WhatsApp abre para o número `5535991923321`, com uma mensagem formatada contendo nome completo, telefone, endereço, peças, detalhes, quantidades e total.
8. Pagamento, confirmação e entrega são combinados diretamente com a responsável pelo bazar.

O catálogo deve informar que a disponibilidade será confirmada pelo WhatsApp; o envio da mensagem não representa reserva automática.

## Administração

A responsável pelo bazar precisa de uma área protegida para:

- Entrar com login administrativo.
- Cadastrar peças e enviar fotos.
- Informar nome, preço, tamanho, descrição e estado de conservação.
- A descrição é livre para Viviane registrar medidas, cor, tamanho e outras observações da peça.
- Cada anúncio aceita uma galeria com várias fotos, permitindo mostrar frente, costas e detalhes.
- A galeria também aceita vídeo opcional da peça.
- No painel administrativo, Viviane e a equipe podem enviar várias mídias; a primeira foto é definida automaticamente como capa.
- Informar a quantidade disponível de cada peça, usando uma unidade como padrão.
- Editar peças.
- Ocultar/publicar peças.
- Marcar peças como vendidas; ao fazer isso, elas deixam de aparecer na vitrine pública.

## Arquitetura decidida

- Hospedagem do frontend: **Vercel**.
- Banco de dados, autenticação e armazenamento das fotos: **Supabase**.
- Checkout: link oficial do WhatsApp (`wa.me`) com mensagem codificada.
- WhatsApp de destino dos pedidos: `5535991923321`.
- Sem gateway de pagamento.
- Sem backend robusto dedicado no MVP; Supabase atende persistência, autenticação e arquivos.
- Não usar `localStorage` como fonte principal do catálogo, pois os dados seriam locais a um dispositivo, poderiam ser apagados e não seriam sincronizados com as clientes.
- `localStorage` pode ser usado somente para conveniências locais, como persistir temporariamente o carrinho.

## Escopo evitado no MVP

- Cadastro/login de clientes.
- Pagamento online.
- Frete calculado automaticamente.
- Cupons e avaliações.
- Múltiplos níveis de administradores.
- Reserva automática com expiração.
- Controle complexo de estoque.

## Regras de disponibilidade e entrega

- Na maioria dos casos, cada anúncio representa uma peça única.
- A quantidade disponível é configurável pela administradora e começa com o valor padrão de uma unidade.
- Quando Viviane marcar uma peça como vendida, ela deve sair imediatamente da vitrine pública.
- O envio do pedido não reserva nem baixa o estoque automaticamente; Viviane confirma a disponibilidade pelo WhatsApp e marca a peça como vendida no painel.
- Entrega ou retirada são combinadas diretamente com Viviane.
- No checkout, nome completo, telefone e endereço são campos obrigatórios.

## Organização do catálogo

- Viviane pode marcar peças como destaque para que apareçam em uma seção especial no início da vitrine.
- Categorias principais: Feminino, Masculino, Infantil, Acessórios e Utilidades / Outros.
- Subcategorias de Feminino: Vestidos, Blusas, Calças, Conjuntos, Saias e Calçados.
- Masculino não possui subcategorias no MVP devido ao baixo volume de peças.
- Subcategorias de Infantil: Menino, Menina e Calçados.
- A vitrine permite combinar busca com filtros de categoria, tipo/subcategoria e tamanho.
- O catálogo pode ter peças a partir de R$ 10.

## Estado atual

- O terminal voltou a funcionar normalmente.
- O frontend foi inicializado com Next.js 16, React 19, TypeScript, Tailwind CSS 4 e App Router.
- O repositório Git foi inicializado na raiz do projeto.
- A vitrine pública está implementada com layout responsivo, busca, filtros combináveis de categoria/tipo/tamanho, seção de destaques, favoritos, galeria de fotos e vídeo nos detalhes das peças, sacola, controle de quantidades e checkout pelo WhatsApp.
- O checkout solicita nome completo, telefone e endereço e monta a mensagem para o número `5535991923321`.
- A vitrine usa dados demonstrativos sem configuração e passa a consumir as peças publicadas no Supabase assim que as variáveis são preenchidas.
- Lint e build de produção executados com sucesso em 3 de setembro de 2026.
- GitHub CLI autenticado na conta `caiogpereira`.
- Git configurado como `Caio Pereira <caiog.pereira@gmail.com>`.
- Node.js `v24.14.0` e npm `11.6.0` disponíveis.
- As CLIs da Vercel e do Supabase não estão instaladas globalmente; podem ser executadas via `npx` quando necessário.

## Atualização de 4 de setembro de 2026

- Integração Supabase preparada, com clientes browser/server/admin e renovação de sessão.
- Modelo de dados e políticas RLS implementados em `supabase/migrations/202609040001_initial_catalog.sql`.
- A vitrine consome somente peças publicadas e com estoque quando o Supabase está configurado.
- Painel `/admin` criado com login, cadastro, destaques, baixa de venda, aprovações e equipe.
- O perfil padrão de assistente cadastra e envia para revisão, mas não publica; Viviane escolhe acessos individualmente.
- Fotos: até 10, conversão local para WebP, lado maior de 1600 px e saída máxima de 1,5 MB.
- Vídeo: um por peça, até 15 segundos, transcodificado localmente para MP4 720p/24 fps, saída máxima de 6 MB.
- Sem variáveis do Supabase, vitrine e painel funcionam em modo demonstrativo.

### Ativação do Supabase concluída em 4 de setembro de 2026

- Migration aplicada no projeto remoto; tabelas, funções, gatilhos, políticas RLS e bucket `product-media` ativos.
- Conta de `vivianedecarvalhopereira@gmail.com` criada por convite e promovida com todas as permissões de proprietária.
- Build de produção validado com as variáveis reais do Supabase.
- O e-mail da Viviane foi confirmado e a senha foi definida pelo fluxo de recuperação.
- A definição de senha aceita tanto o fluxo SSR por `token_hash` quanto o fluxo implícito padrão com tokens no fragmento da URL.
- Viviane entrou com sucesso no painel `/admin` e está autenticada com todas as permissões de proprietária.
- O upload direto com JWT da usuária encontrou uma incompatibilidade do Storage/RLS com a autenticação ES256: o PostgREST reconhecia `auth.uid()`, mas o Storage negava o mesmo usuário.
- O upload passou a usar URLs assinadas geradas pela rota protegida `/api/admin/storage/upload-url`; o servidor valida sessão, conta ativa, permissão e vínculo com o rascunho antes de autorizar cada arquivo.
- O fluxo assinado foi testado no Storage remoto, o arquivo de diagnóstico foi removido e chamadas sem sessão retornam HTTP 401.
- Quatro rascunhos de teste chamados “Chamise”, sem mídia, foram criados durante as tentativas com erro e aguardam decisão do usuário antes de serem removidos.
- O primeiro cadastro real com mídia foi concluído com sucesso e a peça apareceu corretamente na vitrine pública.
- A listagem administrativa agora permite editar os dados das peças, arquivar, republicar e excluir definitivamente.
- Arquivar altera o status para `hidden`, retira a peça da vitrine e preserva cadastro e mídias; excluir apaga o cadastro e remove os arquivos correspondentes do bucket `product-media`.
- Rascunhos próprios também podem ser excluídos; portanto, os quatro rascunhos “Chamise” podem ser removidos diretamente pelo painel.
- Usuários com permissão de publicação, incluindo Viviane, veem “Publicar na vitrine” no cadastro e não passam pela fila de aprovação. Assistentes sem essa permissão continuam usando “Enviar para aprovação”.
- A exclusão, o arquivamento e a publicação direta passam pela rota protegida `/api/admin/products/manage`, que valida sessão, conta ativa e permissões no servidor antes de usar a chave administrativa.
- Lint, TypeScript e build de produção foram validados depois dessas alterações em 4 de setembro de 2026.
- O ciclo administrativo agora inclui o status `reserved`: reservar retira a peça da vitrine sem zerar o estoque e preserva o destaque para quando ela voltar.
- Peças reservadas podem voltar à vitrine ou ser marcadas como vendidas. Peças vendidas também podem voltar; nesse caso, o painel restaura automaticamente uma unidade de estoque.
- A migration `202609040002_reserved_products.sql` foi aplicada com sucesso no Supabase remoto e aparece sincronizada no histórico de migrations.
- A ilustração do vestido na primeira dobra foi substituída por `public/hero-bazar-editorial.png`, uma fotografia editorial gerada para o projeto com conjunto de alfaiataria, bolsa e calçados na paleta da marca.
- O selo “A partir de R$ 10” continua como HTML sobre a imagem, preservando nitidez, responsividade e acessibilidade visual.
- Cada peça agora possui um SKU sequencial e imutável gerado pelo PostgreSQL no formato `AR-000001`.
- A migration `202609040003_product_sku.sql` preencheu as peças existentes em ordem de cadastro e foi aplicada no Supabase remoto.
- A tela administrativa “Peças” permite pesquisar tanto pelo SKU — com ou sem hífen — quanto pelo nome da peça, e exibe o código nos cartões, na visão geral e nas aprovações.
- O SKU aparece nos detalhes e na sacola da vitrine e segue na mensagem enviada ao WhatsApp para facilitar a identificação pela Viviane.
- Pendente no Dashboard do Supabase: revisar `Authentication > URL Configuration` e configurar SMTP próprio antes da produção.

## Atualização de 7 de setembro de 2026

- Cada peça publicada passou a ter uma URL compartilhável em `/peca/[slug]`, formada pelo nome legível e pelo SKU imutável.
- A navegação iniciada no catálogo mantém a vitrine ao fundo e abre os detalhes em modal; o mesmo endereço aberto diretamente renderiza uma página completa da peça.
- Os detalhes oferecem compartilhamento nativo ou cópia do link e geram metadados com nome, descrição e foto para a prévia em aplicativos como o WhatsApp.
- A implementação não adicionou migration nem alterou registros existentes: o slug é derivado em tempo de execução e a peça é localizada pelo SKU único.
- Lint, TypeScript, build de produção, rota direta com peça real, redirecionamento canônico e resposta 404 foram validados.

### Ponto de retomada após a ativação

- Viviane está realizando os testes manuais do painel e da vitrine.
- Validar cadastro de peça com foto, publicação na vitrine, baixa como vendida e uso pelo celular.
- Depois dos testes, enviar o estado atual do projeto ao GitHub na conta `caiogpereira`.
- Conectar o repositório à Vercel e publicar inicialmente no domínio padrão `*.vercel.app`.
- Na Vercel, cadastrar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `NEXT_PUBLIC_SITE_URL`; a chave secreta deve permanecer somente no ambiente do servidor.
- Depois do primeiro deploy, atualizar `NEXT_PUBLIC_SITE_URL` com a URL final da Vercel e cadastrar essa URL em `Supabase > Authentication > URL Configuration`.
- Configurar SMTP próprio antes de convidar outros integrantes da equipe em produção.
- Trocar a senha do banco que foi compartilhada durante a configuração e guardá-la fora do repositório, preferencialmente em um gerenciador de senhas.
- Melhorias funcionais ainda planejadas: ordenação manual da galeria e escolha manual da capa.
