# Adonis Auditing

> **Este é um fork do projeto original [StouderIO/adonis-auditing](https://github.com/StouderIO/adonis-auditing) com melhorias e correções de bugs.**

Audite seus modelos Lucid com facilidade no AdonisJS. Este pacote permite rastrear automaticamente todas as alterações feitas em seus modelos, mantendo um histórico completo de auditoria.

## ✨ Melhorias e Correções

- Correções de bugs relacionados à importação dinâmica de dependências
- Melhorias na configuração e estabilidade do pacote
- Atualizações de compatibilidade com versões mais recentes do AdonisJS
- Novas opções de auditoria em updates: `fullSnapshotOnUpdate` e `ignoredFieldsOnUpdate`

## 📦 Instalação

Você pode instalar o pacote usando o comando ace do AdonisJS para configuração automática:

```sh
node ace add adonis-auditing
```

Ou instalar manualmente usando seu gerenciador de pacotes favorito:

```sh
# npm
npm install adonis-auditing
node ace configure adonis-auditing

# pnpm
pnpm install adonis-auditing
node ace configure adonis-auditing

# yarn
yarn add adonis-auditing
node ace configure adonis-auditing
```

```sh
# rodar a migration para criar a tabela de auditoria
node ace migration:run
```

## 🚀 Uso Básico

Para usar a auditoria em seus modelos, você precisa adicionar o mixin `Auditable` usando o helper `compose`:

```typescript
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import { Auditable } from 'adonis-auditing'

export default class Book extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

Após adicionar o mixin, todas as operações de criação, atualização e exclusão serão automaticamente auditadas.

## ⚙️ Configurações de Update

- fullSnapshotOnUpdate (booleano, padrão: false)
  - Quando true, eventos de update armazenam snapshots completos do modelo em `oldValues` e `newValues` (inclui atributos não alterados como `id`).
  - Quando false (padrão), apenas os atributos alterados são armazenados.

- ignoredFieldsOnUpdate (string[]; padrão: [])
  - Lista de atributos a serem ignorados no cálculo de diff de updates (ex.: `updatedAt`).
  - Se apenas campos ignorados mudarem, nenhum audit é criado para o update.
  - Quando campos não ignorados mudam, os ignorados não aparecem no diff.

Exemplo de configuração:

```ts
import { defineConfig } from 'adonis-auditing/setup'

export default defineConfig({
  userResolver: () => import('#audit_resolvers/user_resolver'),
  resolvers: {
    ip_address: () => import('#audit_resolvers/ip_address_resolver'),
    user_agent: () => import('#audit_resolvers/user_agent_resolver'),
    url: () => import('#audit_resolvers/url_resolver'),
  },
  fullSnapshotOnUpdate: true,
  ignoredFieldsOnUpdate: ['updatedAt']
})
```

## 📚 Documentação Completa

Para documentação detalhada, configurações avançadas, resolvers personalizados e mais exemplos, acesse a pasta **`docs/`** deste repositório ou consulte os seguintes guias:

- [Introdução](docs/guide/introduction.md)
- [Instalação](docs/guide/installation.md)
- [Configuração do Model](docs/guide/model-setup.md)
- [Configuração Geral](docs/guide/general-configuration.md)
- [Obtendo Auditorias](docs/guide/getting-audits.md)
- [Resolver de Usuário](docs/guide/user-resolver.md)
- [Resolvers de Auditoria](docs/guide/audit-resolvers.md)

## 📄 Licença

MIT

## 🙏 Créditos

Este projeto é baseado no trabalho original de [Xavier Stouder](https://github.com/StouderIO) no repositório [adonis-auditing](https://github.com/StouderIO/adonis-auditing).
