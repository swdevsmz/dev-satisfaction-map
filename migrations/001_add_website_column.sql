-- DDL: companies テーブルに website カラムを追加
ALTER TABLE companies
ADD COLUMN website TEXT;

-- DML: 企業データに website を投入
UPDATE companies SET website = 'https://www.mercari.com'
WHERE id = 'mercari-jp';

UPDATE companies SET website = 'https://smarthr.jp'
WHERE id = 'smarthr';

UPDATE companies SET website = 'https://www.cyberagent.co.jp'
WHERE id = 'cyberagent';

UPDATE companies SET website = 'https://www.freee.co.jp'
WHERE id = 'freee';

UPDATE companies SET website = 'https://www.rakuten.co.jp'
WHERE id = 'rakuten-tech';
