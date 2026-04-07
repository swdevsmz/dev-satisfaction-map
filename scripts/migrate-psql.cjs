#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbPassword = process.env.DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ DB_PASSWORD 環境変数が設定されていません');
  console.error('\n📋 使用方法:');
  console.error('   DB_PASSWORD="パスワード" npm run migrate\n');
  process.exit(1);
}

const projectId = 'aadrckaghzbfqjoojxrj';
const host = `db.${projectId}.supabase.co`;
const connectionString = `postgresql://postgres:${dbPassword}@${host}:5432/postgres?sslmode=require`;

async function runMigration() {
  try {
    console.log('🚀 Supabase マイグレーション開始\n');
    console.log(`📍 接続情報:`);
    console.log(`   Host: ${host}`);
    console.log(`   Database: postgres`);
    console.log(`   User: postgres\n`);

    // マイグレーション SQL を読み込み
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260407000000_refactor_scores_and_scrapes.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('⏳ マイグレーション実行中...');
    console.log('  - company_scores テーブル作成');
    console.log('  - スコアデータ移行');
    console.log('  - companies テーブルからスコアカラム削除');
    console.log('  - raw_documents → company_scrapes リネーム\n');

    // 一時ファイルに SQL を保存
    const tempSqlPath = path.join(__dirname, '../.migration.tmp.sql');
    fs.writeFileSync(tempSqlPath, migrationSql);

    try {
      // psql で実行
      const output = execSync(`psql "${connectionString}" -f "${tempSqlPath}" 2>&1`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });
      console.log(output);
    } catch (error) {
      const output = error.stdout || error.stderr || error.message;
      console.error(output);

      // psql が見つからない場合の処理
      if (output.includes('psql: command not found') || output.includes('not recognized') || output.includes('\'psql\'')) {
        console.error('\n⚠️  psql がインストールされていません');
        console.error('   PostgreSQL Client Tools をインストールしてください\n');
        console.error('💡 別の方法: Supabase ダッシュボード SQL Editor を使用してください');
        fs.unlinkSync(tempSqlPath);
        process.exit(1);
      }
      throw error;
    }

    // 一時ファイルを削除
    fs.unlinkSync(tempSqlPath);

    console.log('✅ マイグレーション完了！\n');
    console.log('📊 テーブル確認用 SQL:');
    console.log('   SELECT tablename FROM pg_tables WHERE schemaname = \'public\' ORDER BY tablename;\n');
    console.log('🚀 アプリを再起動してください:');
    console.log('   npm run dev\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('password')) {
      console.error('💡 パスワードが正しいか確認してください');
      console.error('   Supabase ダッシュボード → Settings → Database\n');
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('connection refused')) {
      console.error('💡 ネットワーク接続を確認してください\n');
    }

    process.exit(1);
  }
}

runMigration();
