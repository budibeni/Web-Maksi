const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_maksi'
  });

  console.log('Connected to DB');

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tb_role (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        keterangan VARCHAR(255),
        dibuat_oleh BIGINT,
        dibuat_tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        diubah_oleh BIGINT,
        diubah_tanggal DATETIME,
        INDEX idx_role_nama (nama)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tb_cabang (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        kode VARCHAR(20) NOT NULL UNIQUE,
        nama VARCHAR(150) NOT NULL,
        alamat TEXT,
        telepon VARCHAR(30),
        aktif TINYINT DEFAULT 1,
        dibuat_oleh BIGINT,
        dibuat_tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        diubah_oleh BIGINT,
        diubah_tanggal DATETIME,
        INDEX idx_cabang_nama (nama)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tb_user (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        cabang_id BIGINT NOT NULL,
        role_id BIGINT NOT NULL,
        nama VARCHAR(150) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        telepon VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        aktif TINYINT DEFAULT 1,
        dibuat_oleh BIGINT,
        dibuat_tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        diubah_oleh BIGINT,
        diubah_tanggal DATETIME,
        FOREIGN KEY (cabang_id) REFERENCES tb_cabang(id),
        FOREIGN KEY (role_id) REFERENCES tb_role(id),
        INDEX idx_user_nama (nama),
        INDEX idx_user_cabang (cabang_id),
        INDEX idx_user_role (role_id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tb_audit_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT,
        nama_user VARCHAR(150) NOT NULL,
        modul VARCHAR(50) NOT NULL,
        aksi VARCHAR(30) NOT NULL,
        referensi_id BIGINT,
        deskripsi TEXT,
        data_sebelum JSON,
        data_sesudah JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        dibuat_tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES tb_user(id),
        INDEX idx_audit_log_user (user_id),
        INDEX idx_audit_log_modul (modul),
        INDEX idx_audit_log_aksi (aksi),
        INDEX idx_audit_log_referensi (referensi_id),
        INDEX idx_audit_log_tanggal (dibuat_tanggal)
      )
    `);
    
    console.log('Tables created');

    const [cabangRows] = await connection.execute('SELECT * FROM tb_cabang WHERE kode = ?', ['PST']);
    let cabangId;
    if (cabangRows.length === 0) {
      const [res] = await connection.execute(
        'INSERT INTO tb_cabang (kode, nama, alamat, telepon) VALUES (?, ?, ?, ?)',
        ['PST', 'Kantor Pusat', 'Jl. Pusat Maksindo No 1', '02112345678']
      );
      cabangId = res.insertId;
      console.log('Cabang created');
    } else {
      cabangId = cabangRows[0].id;
    }

    const [roleRows] = await connection.execute('SELECT * FROM tb_role WHERE nama = ?', ['Administrator']);
    let roleId;
    if (roleRows.length === 0) {
      const [res] = await connection.execute(
        'INSERT INTO tb_role (nama, keterangan) VALUES (?, ?)',
        ['Administrator', 'Hak akses penuh']
      );
      roleId = res.insertId;
      console.log('Role created');
    } else {
      roleId = roleRows[0].id;
    }

    const [userRows] = await connection.execute('SELECT * FROM tb_user WHERE username = ?', ['admin']);
    if (userRows.length === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await connection.execute(
        'INSERT INTO tb_user (cabang_id, role_id, nama, username, telepon, password) VALUES (?, ?, ?, ?, ?, ?)',
        [cabangId, roleId, 'Administrator', 'admin', '081234567890', passwordHash]
      );
      console.log('User admin created');
    }

    console.log('Seed finished successfully.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await connection.end();
  }
}

main();
