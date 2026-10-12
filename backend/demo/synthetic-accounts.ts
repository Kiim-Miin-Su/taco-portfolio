/** Public demonstration accounts; these credentials have no relation to the ERP's accounts. */
import type { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';

export async function prepareSyntheticAccounts(ds: DataSource): Promise<void> {
  const passwordHash = await bcrypt.hash('PortfolioDemo!2026', 10);
  const staff = await ds.query('SELECT id,role FROM staff ORDER BY id') as Array<{ id: string; role: string }>;
  const seen = new Set<string>();
  for (const row of staff) {
    const alias = `demo-${row.role}${seen.has(row.role) ? `-${row.id}` : ''}`;
    seen.add(row.role);
    // 북미 허구 전화번호 555-0100~0199로 비밀번호 찾기를 체험한다. 실제 발송은 DemoSender가 차단한다.
    const phone = `+1202555${String(100 + Number(row.id) % 100).padStart(4, '0')}`;
    await ds.query(`UPDATE staff SET name=$2,email=$3,phone=$6,login_id=$4,password_hash=$5,
      must_change_credentials=false,email_verified=true,phone_verified=true WHERE id=$1`,
    [row.id, `체험 ${row.role} ${row.id}`, `${alias}@example.com`, alias, passwordHash, phone]);
  }
  // Keep one current-month example so every visitor can exercise two new suggestions.
  await ds.query(`WITH current_items AS (
    SELECT id,row_number() OVER(PARTITION BY staff_id ORDER BY created_at DESC,id DESC) AS ordinal
    FROM suggestion WHERE to_char(created_at AT TIME ZONE 'Asia/Seoul','YYYY-MM')=to_char(now() AT TIME ZONE 'Asia/Seoul','YYYY-MM')
  ) UPDATE suggestion SET created_at=(date_trunc('month',now() AT TIME ZONE 'Asia/Seoul')-interval '1 day') AT TIME ZONE 'Asia/Seoul'
    WHERE id IN (SELECT id FROM current_items WHERE ordinal>1)`);
}
