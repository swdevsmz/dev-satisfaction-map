#!/bin/bash

# 環境変数から情報を取得
SUPABASE_URL=$(grep SUPABASE_URL pipeline.env | cut -d= -f2)
SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY pipeline.env | cut -d= -f2)

echo "🚀 Supabase マイグレーション開始"
echo ""
echo "📍 Supabase URL: $SUPABASE_URL"
echo ""

# マイグレーション SQL を読み込み
MIGRATION_SQL=$(cat supabase/migrations/20260407000000_refactor_scores_and_scrapes.sql)

echo "⏳ マイグレーション実行中..."
echo "  - company_scores テーブル作成"
echo "  - スコアデータ移行"
echo "  - companies テーブルからスコアカラム削除"
echo "  - raw_documents → company_scrapes リネーム"
echo ""

# SQL を実行（複数のステートメントに対応）
# Supabase では直接 SQL を実行するエンドポイントがないため、別の方法を使う

# 方法: GraphQL API を使用（または RPC）
# 実際には、Supabase ダッシュボード内で実行するしかない

echo "⚠️  REST API での SQL 実行は Supabase では直接サポートされていません"
echo ""
echo "💡 以下の方法で実行してください:"
echo ""
echo "📋 方法1: Supabase ダッシュボード SQL Editor（推奨）"
echo "   1. https://supabase.com/dashboard を開く"
echo "   2. プロジェクト選択"
echo "   3. SQL Editor → + New Query"
echo "   4. supabase/migrations/20260407000000_refactor_scores_and_scrapes.sql を開く"
echo "   5. Run ボタンをクリック"
echo ""
echo "📋 方法2: Docker で PostgreSQL イメージを使用"
echo "   1. Docker Desktop をインストール"
echo "   2. docker run -it --rm postgres:15 psql コマンドを使用"
echo ""

