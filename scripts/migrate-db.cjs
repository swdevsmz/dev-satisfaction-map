#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 環境変数から接続情報を取得
const dbPassword = process.env.DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ DB_PASSWORD 環境変数が設定されていません');
  console.error('\n📋 使用方法:');
  console.error('   DB_PASSWORD="パスワード" npm run migrate\n');
  console.error('💡 パスワード取得方法:');
  console.error('   1. Supabase ダッシュボード → Settings → Database');
  console.error('   2. "Reset password" をクリック');
  console.error('   3. 新しいパスワードをコピー\n');
  process.exit(1);
}

const projectId = 'aadrckaghzbfqjoojxrj';
const host = `db.${projectId}.supabase.co`;

const client = new Client({
  host,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: 'require',
});

async function runMigration() {
  try {
    console.log('🚀 Supabase マイグレーション開始\n');
    console.log(`📍 接続情報:`);
    console.log(`   Host: ${host}`);
    console.log(`   Database: postgres`);
    console.log(`   User: postgres\n`);

    console.log('⏳ Supabase に接続中...');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // マイグレーション SQL を読み込み
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260407000000_refactor_scores_and_scrapes.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // SQL を実行
    console.log('⏳ マイグレーション実行中...');
    console.log('  - company_scores テーブル作成');
    console.log('  - スコアデータ移行');
    console.log('  - companies テーブルからスコアカラム削除');
    console.log('  - raw_documents → company_scrapes リネーム\n');

    await client.query(migrationSql);
    console.log('✅ マイグレーション完了！\n');

    // 確認クエリ
    console.log('📊 テーブル確認:');
    const tablesResult = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );

    const tableNames = tablesResult.rows.map(r => r.tablename);
    console.log('  作成済みテーブル:');
    for (const tableName of tableNames) {
      const checkMark = ['companies', 'company_scores', 'company_scrapes'].includes(tableName) ? '✓' : '  ';
      console.log(`    ${checkMark} ${tableName}`);
    }

    // レコード数確認
    const companiesCount = await client.query('SELECT COUNT(*) FROM companies');
    const scoresCount = await client.query('SELECT COUNT(*) FROM company_scores');
    const scrapesCount = await client.query('SELECT COUNT(*) FROM company_scrapes');

    console.log('\n📈 レコード数:');
    console.log(`    ✓ companies: ${companiesCount.rows[0].count} 件`);
    console.log(`    ✓ company_scores: ${scoresCount.rows[0].count} 件`);
    console.log(`    ✓ company_scrapes: ${scrapesCount.rows[0].count} 件\n`);

    await client.end();

    console.log('✅ 全テーブルが正常に作成されました！\n');
    console.log('🚀 アプリを再起動してください:');
    console.log('   npm run dev\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('password')) {
      console.error('💡 パスワードが正しいか確認してください');
      console.error('   Supabase ダッシュボード → Settings → Database\n');
    }

    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 ネットワーク接続を確認してください\n');
    }

    process.exit(1);
  }
}

runMigration();
