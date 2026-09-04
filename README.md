# Bazar da Ana Rebeca

Catálogo responsivo com vitrine pública, pedido pelo WhatsApp e painel protegido para Viviane e sua equipe.

## O que já está implementado

- Vitrine com destaques, busca e filtros por categoria, tipo e tamanho.
- Galeria com várias fotos e um vídeo por peça.
- Sacola e checkout para o WhatsApp `5535991923321`.
- Painel em `/admin` com visão geral, cadastro, aprovações, estoque, destaques e equipe.
- Fluxo `rascunho → aguardando aprovação → publicado` para o trabalho da assistente.
- Viviane e usuários com permissão de publicação podem publicar diretamente na vitrine, sem etapa de aprovação.
- Edição de informações de peças já cadastradas, preservando as mídias atuais.
- Arquivamento retira a peça da vitrine sem apagar o cadastro; exclusão permanente remove também fotos e vídeo do Storage.
- Uma peça pode ser reservada temporariamente: ela sai da vitrine, mantém o estoque e pode voltar com um clique.
- Peças marcadas como vendidas também podem voltar à vitrine; nesse retorno, uma unidade é restaurada automaticamente.
- Convites por e-mail e permissões individuais por usuário.
- Peças marcadas como vendidas ficam com estoque zero e saem da vitrine.
- Vitrine ligada ao Supabase; sem configuração, o projeto usa dados demonstrativos.
- A primeira dobra usa uma fotografia editorial própria de alfaiataria, bolsa e calçados, integrada à paleta creme, rosé e verde-sálvia.

## Política de mídia

O processamento acontece no navegador, antes do upload:

- Até 10 fotos por peça.
- Entrada JPG, PNG ou WebP de até 15 MB.
- Saída WebP, lado maior de 1600 px, qualidade inicial de 82% e máximo de 1,5 MB.
- Um vídeo opcional de até 15 segundos e entrada de até 50 MB.
- Saída MP4 (H.264/AAC), no máximo 1280×720, 24 fps e 6 MB.
- Vídeo ideal: 10 a 15 segundos; normalmente ficará entre 2 e 3 MB.
- O navegador envia cada arquivo por uma URL assinada de uso temporário; a rota do servidor só a gera depois de validar a sessão, as permissões e o rascunho de destino.

O bucket também rejeita arquivos acima de 6 MB. Assim, um arquivo original grande nunca precisa ser armazenado.

## Executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. O painel fica em `http://localhost:3000/admin`.

## Conectar o Supabase

1. Crie um projeto no Supabase.
2. Copie `.env.example` para `.env.local` e preencha as três chaves.
3. Execute a migration `supabase/migrations/202609040001_initial_catalog.sql` no SQL Editor.
4. Em Authentication, crie a primeira conta da Viviane.
5. No final da migration há o comando comentado para promover essa conta como proprietária. Troque o e-mail e execute o comando.
6. Em Authentication > URL Configuration, cadastre a URL do site e `/auth/callback` como destino permitido.
7. Reinicie o servidor de desenvolvimento.

`SUPABASE_SECRET_KEY` é usada somente na rota protegida que envia convites. Nunca deve receber o prefixo `NEXT_PUBLIC_`.

### Configuração manual no Dashboard

- Em `Authentication > URL Configuration`, use `http://localhost:3000` como Site URL durante o desenvolvimento e inclua `http://localhost:3000/**` nas Redirect URLs.
- Ao publicar, troque a Site URL pela URL oficial e adicione `https://SEU-DOMINIO/**` às Redirect URLs. Atualize também `NEXT_PUBLIC_SITE_URL` no ambiente de produção.
- O template padrão de convite é aceito: a tela de definição de senha recupera a sessão enviada no fragmento da URL pelo fluxo implícito.
- Em `Authentication > Emails > SMTP Settings`, configure um provedor SMTP próprio antes de convidar a equipe em produção. Isso não é obrigatório para o teste inicial quando o e-mail padrão é entregue.
- Se um SMTP próprio liberar a edição de `Authentication > Email Templates > Invite user`, este formato com `token_hash` também é compatível com a rota SSR do projeto:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/definir-senha">
  Aceitar convite e criar senha
</a>
```

## Permissões de equipe

O perfil inicial de assistente permite cadastrar peças, enviar mídia e mandar para aprovação. Ele não permite publicar, aprovar, alterar peças de outras pessoas ou administrar usuários. Viviane pode mudar cada acesso separadamente no painel.

As regras são aplicadas por Row Level Security no banco, não apenas pela interface.

## Comandos

```bash
npm run dev
npm run lint
npm run build
npm run start
```
