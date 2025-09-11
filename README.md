# Adonis Auditing

> **Este é um fork do projeto original [StouderIO/adonis-auditing](https://github.com/StouderIO/adonis-auditing) com melhorias e correções de bugs.**

Audite seus modelos Lucid com facilidade no AdonisJS. Este pacote permite rastrear automaticamente todas as alterações feitas em seus modelos, mantendo um histórico completo de auditoria.

## ✨ Melhorias e Correções

- Correções de bugs relacionados à importação dinâmica de dependências
- Melhorias na configuração e estabilidade do pacote
- Atualizações de compatibilidade com versões mais recentes do AdonisJS
- Correções em problemas de CI/CD

## 📦 Instalação

Você pode instalar o pacote usando o comando ace do AdonisJS para configuração automática:

```sh
node ace add @stouder-io/adonis-auditing
```

Ou instalar manualmente usando seu gerenciador de pacotes favorito:

```sh
# npm
npm install @stouder-io/adonis-auditing
node ace configure @stouder-io/adonis-auditing

# pnpm
pnpm install @stouder-io/adonis-auditing
node ace configure @stouder-io/adonis-auditing

# yarn
yarn add @stouder-io/adonis-auditing
node ace configure @stouder-io/adonis-auditing
```

## 🚀 Uso Básico

Para usar a auditoria em seus modelos, você precisa adicionar o mixin `Auditable` usando o helper `compose`:

```typescript
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import { Auditable } from '@stouder-io/adonis-auditing'

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
