#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

async function migrate() {
  try {
    console.log('🚀 Supabase マイグレーション\n');

    // 接続情報を取得
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('❌ VITE_SUPABASE_URL が設定されていません');
      console.log('   .env.local を確認してください');
      process.exit(1);
    }

    // URL から host を抽出
    const url = new URL(supabaseUrl);
    const projectId = url.hostname.split('.')[0];
    const host = `db.${projectId}.supabase.co`;

    console.log(`📍 Supabase Project: ${projectId}`);
    console.log(`🔗 Host: ${host}\n`);

    const password = await question('🔐 PostgreSQL パスワードを入力してください: ');
    rl.close();

    // 接続設定
    const client = new Client({
      host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password,
    });

    console.log('\n⏳ Supabase に接続中...');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // マイグレーション SQL を読み込み
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260407000000_refactor_scores_and_scrapes.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // SQL を実行
    console.log('⏳ テーブルを作成中...');
    await client.query(migrationSql);
    console.log('✅ テーブル作成完了！\n');

    // 確認クエリ
    console.log('📊 テーブル確認:');
    const tablesResult = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log('  作成済みテーブル:');
    for (const row of tablesResult.rows) {
      console.log(`    - ${row.tablename}`);
    }

    const companiesCount = await client.query('SELECT COUNT(*) FROM companies');
    const scoresCount = await client.query('SELECT COUNT(*) FROM company_scores');
    const scrapesCount = await client.query('SELECT COUNT(*) FROM company_scrapes');

    console.log(`\n  レコード数:
    - companies: ${companiesCount.rows[0].count}
    - company_scores: ${scoresCount.rows[0].count}
    - company_scrapes: ${scrapesCount.rows[0].count}\n`);

    await client.end();

    console.log('✅ マイグレーション完了！');
    console.log('   アプリを再起動してください: npm run dev');
  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(`   ${error.message}`);

    if (error.message.includes('password')) {
      console.error('\n💡 ヒント: パスワードが正しいか確認してください。');
      console.error('   Supabase ダッシュボード → Settings → Database から確認できます。');
    }

    process.exit(1);
  }
}

migrate();
