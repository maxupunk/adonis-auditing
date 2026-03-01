# Adonis Auditing

> **Este é um fork do projeto original [StouderIO/adonis-auditing](https://github.com/StouderIO/adonis-auditing) com melhorias e correções de bugs.**

Audite seus modelos Lucid com facilidade no AdonisJS. Este pacote permite rastrear automaticamente todas as alterações feitas em seus modelos, mantendo um histórico completo de auditoria.

## ✨ Melhorias e Correções

- Correções de bugs relacionados à importação dinâmica de dependências
- Melhorias na configuração e estabilidade do pacote
- Atualizações de compatibilidade com versões mais recentes do AdonisJS
- Novas opções de auditoria em updates: `fullSnapshotOnUpdate` e `ignoredFieldsOnUpdate`

## ✅ Compatibilidade

Compatível com AdonisJS v7 (Core 7, Auth 10 e Lucid 22).

## 🧩 Versões e Tags

- AdonisJS v7: use a série 2.x.x (tag padrão)
- AdonisJS v6: use a tag adonis6 (série 1.x.x)

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

Para AdonisJS v6:

```sh
# npm
npm install adonis-auditing@adonis6
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

## 🔒 Campos Ocultos (Hidden Fields)

Você pode configurar campos sensíveis que devem ser ocultados nos registros de auditoria (por exemplo, senhas, tokens). O valor original será substituído por `******`. Esta configuração é global e se aplica a todos os modelos auditados.

Essa configuração deve ser feita no arquivo **`config/auditing.ts`**, que é criado automaticamente após a instalação do pacote.

- `hiddenFields` (string[]; padrão: []): Lista de atributos a serem mascarados nos objetos `oldValues` e `newValues`.

Exemplo de configuração no arquivo `config/auditing.ts`:

```ts
import { defineConfig } from 'adonis-auditing/setup'

export default defineConfig({
  userResolver: () => import('#audit_resolvers/user_resolver'),
  resolvers: {
    ip_address: () => import('#audit_resolvers/ip_address_resolver'),
    user_agent: () => import('#audit_resolvers/user_agent_resolver'),
    url: () => import('#audit_resolvers/url_resolver'),
  },
  // Adicione os campos que deseja ocultar aqui
  hiddenFields: ['password', 'token', 'secret'],
})
```

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
  ignoredFieldsOnUpdate: ['updatedAt'],
})
```

## 🏢 Multitenancy

O pacote oferece suporte completo a multitenancy com duas formas de capturar o `tenantId`:

### 1. TenantResolver (Recomendado)

O `tenantResolver` permite capturar o `tenantId` diretamente do contexto HTTP (por exemplo, do usuário autenticado):

```ts
// config/auditing.ts
import { defineConfig } from 'adonis-auditing'

export default defineConfig({
  userResolver: () => import('#audit_resolvers/user_resolver'),
  tenantResolver: () => import('#audit_resolvers/tenant_resolver'), // Adicione esta linha
  resolvers: {
    ip_address: () => import('#audit_resolvers/ip_address_resolver'),
    user_agent: () => import('#audit_resolvers/user_agent_resolver'),
    url: () => import('#audit_resolvers/url_resolver'),
  },
})
```

Crie o resolver de tenant:

```ts
// app/audit_resolvers/tenant_resolver.ts
import { HttpContext } from '@adonisjs/core/http'
import { TenantResolver } from 'adonis-auditing'

export default class implements TenantResolver {
  async resolve({ auth }: HttpContext): Promise<{ id: number | string } | null> {
    // Ajuste conforme a estrutura do seu modelo de usuário
    const user = auth.user as { tenantId?: number } | undefined
    return user?.tenantId ? { id: user.tenantId } : null
  }
}
```

### 2. Fallback: TenantId do Modelo

Se o `tenantResolver` não estiver configurado, o pacote copia automaticamente o `tenantId` da instância do modelo (se existir):

```ts
// O campo tenantId do modelo será copiado para o audit
class Book extends compose(BaseModel, Auditable) {
  @column()
  declare id: number

  @column()
  declare tenantId: number // Será copiado para o audit automaticamente
}
```

### Prioridade

1. **tenantResolver**: Se configurado, sempre tem prioridade
2. **model.tenantId**: Usado como fallback se o tenantResolver não estiver configurado ou retornar null

### Migration

Se estiver atualizando de uma versão anterior, adicione a coluna `tenant_id`:

```ts
// Migration de exemplo
this.schema.alterTable('audits', (table) => {
  table.integer('tenant_id').nullable()
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
