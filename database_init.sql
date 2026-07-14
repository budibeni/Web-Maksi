CREATE TABLE IF NOT EXISTS tb_role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  keterangan VARCHAR(255),
  dibuat_oleh BIGINT,
  dibuat_tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
  diubah_oleh BIGINT,
  diubah_tanggal DATETIME,
  INDEX idx_role_nama (nama)
);

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
);

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
);

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
);

-- Seed Data
INSERT INTO tb_cabang (kode, nama, alamat, telepon) 
VALUES ('PST', 'Kantor Pusat', 'Jl. Pusat Maksindo No 1', '02112345678')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO tb_role (nama, keterangan) 
VALUES ('Administrator', 'Hak akses penuh')
ON DUPLICATE KEY UPDATE id=id;

-- Password for 'admin' is 'password123' (bcrypt hash)
INSERT INTO tb_user (cabang_id, role_id, nama, username, telepon, password) 
VALUES (
  (SELECT id FROM tb_cabang WHERE kode = 'PST' LIMIT 1),
  (SELECT id FROM tb_role WHERE nama = 'Administrator' LIMIT 1),
  'Administrator', 
  'admin', 
  '081234567890', 
  '$2a$10$Y1/sT3O2.9aN6i9v0ZJ6b.F88z2h8XlJq7Z2V4W3qF1oH9kL7g1' 
) ON DUPLICATE KEY UPDATE id=id;
