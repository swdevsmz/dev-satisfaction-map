#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// 環境変数から接続情報を取得
const envFile = fs.readFileSync('pipeline.env', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
const serviceRoleKey = keyMatch ? keyMatch[1].trim() : null;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ pipeline.env から SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が見つかりません');
  process.exit(1);
}

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/exec_raw_sql`);

    const body = JSON.stringify({ sql });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runMigration() {
  try {
    console.log('🚀 Supabase マイグレーション開始\n');
    console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

    // マイグレーション SQL を読み込み
    const migrationFiles = [
      '../supabase/migrations/20260407000000_refactor_scores_and_scrapes.sql',
      '../supabase/migrations/20260410000000_add_bonus_columns_to_company_scores.sql',
    ];
    const migrationSql = migrationFiles
      .map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8'))
      .join('\n\n');

    console.log('⏳ マイグレーション実行中...');
    console.log('  - company_scores テーブル作成');
    console.log('  - スコアデータ移行');
    console.log('  - companies テーブルからスコアカラム削除');
    console.log('  - raw_documents → company_scrapes リネーム\n');
    console.log('  - company_scores にボーナス列を追加\n');

    // SQL を 1 つずつ実行するため、セミコロンで分割
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      try {
        console.log(`  ⏳ ステップ ${i + 1}/${statements.length}...`);
        await executeSQL(statements[i]);
      } catch (error) {
        // 無視（すでに存在するテーブルなど）
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`     (スキップ: 既に存在)\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ マイグレーション完了！\n');
    console.log('🚀 アプリを再起動してください:');
    console.log('   npm run dev\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 ネットワーク接続を確認してください\n');
    }

    process.exit(1);
  }
}

runMigration();
