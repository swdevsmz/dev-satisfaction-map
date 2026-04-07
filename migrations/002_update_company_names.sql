-- DML: 企業名を正式名称に更新
UPDATE companies SET name = '株式会社メルカリ'
WHERE id = 'mercari-jp';

UPDATE companies SET name = 'SmartHR株式会社'
WHERE id = 'smarthr';

UPDATE companies SET name = 'サイバーエージェント株式会社'
WHERE id = 'cyberagent';

UPDATE companies SET name = 'freee株式会社'
WHERE id = 'freee';

UPDATE companies SET name = '楽天グループ株式会社'
WHERE id = 'rakuten-tech';
