import { Helmet } from 'react-helmet-async'

interface JsonLdProps {
  schema: object | null
}

/**
 * JSON-LD 構造化データを <script type="application/ld+json"> として head に注入するコンポーネント。
 * schema が null の場合はレンダリングをスキップする。
 */
export default function JsonLd({ schema }: JsonLdProps) {
  if (schema === null) {
    return null
  }

  return (
    // defer={false}: requestAnimationFrame を使わず同期的に DOM を更新する
    <Helmet defer={false}>
      <script type="application/ld+json">{JSON.stringify(schema, null, 2)}</script>
    </Helmet>
  )
}
