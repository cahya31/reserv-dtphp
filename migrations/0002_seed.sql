-- Data awal RESERV DTPHP (pengguna, ruangan, contoh reservasi, pengaturan)
-- Terapkan dengan: npx wrangler d1 execute reserv-dtphp-db --remote --file=./migrations/0002_seed.sql

-- Data User (5 baris)
INSERT OR IGNORE INTO User (id, name, accessCode, role, active, createdAt, updatedAt) VALUES ('cmwna3yle0000u15gzz2wfv4s', 'Administrator', '01', 'ADMIN', 1, 1795076347874, 1795076347874);
INSERT OR IGNORE INTO User (id, name, accessCode, role, active, createdAt, updatedAt) VALUES ('cmwna3ylf0001u15gwtwexz7e', 'Andi Pratama', '02', 'USER', 1, 1795076347875, 1795076347875);
INSERT OR IGNORE INTO User (id, name, accessCode, role, active, createdAt, updatedAt) VALUES ('cmwna3ylg0002u15gmggfm78n', 'Siti Rahayu', '03', 'USER', 1, 1795076347876, 1795076347876);
INSERT OR IGNORE INTO User (id, name, accessCode, role, active, createdAt, updatedAt) VALUES ('cmwna3ylg0003u15g0mdi0czr', 'Budi Wibowo', '04', 'USER', 1, 1795076347877, 1795076347877);
INSERT OR IGNORE INTO User (id, name, accessCode, role, active, createdAt, updatedAt) VALUES ('cmwnaum7z0005u1xq3d4r4wjx', 'Dewi Lestari', '05', 'USER', 1, 1795077591551, 1795077591551);

-- Data Room (1 baris)
INSERT OR IGNORE INTO Room (id, name, location, capacity, facilities, color, active, createdAt) VALUES ('room-dtphp-utama', 'Ruang Rapat DTPHP', 'Kantor Dinas Tanaman Pangan, Hortikultura dan Perkebunan', 25, 'Proyektor, AC, Sound System, Whiteboard, Meja Konferensi', '#16a34a', 1, '2026-11-19 09:19:02');

-- Data Reservation (4 baris)
INSERT OR IGNORE INTO Reservation (id, title, agenda, roomId, userId, date, startTime, endTime, status, actualStart, actualEnd, createdAt, updatedAt) VALUES ('cmwna3ylk0009u15gjci4xmm0', 'Rapat Koordinasi Harian', 'Sinkronisasi progres proyek padi organik dan pembagian tugas harian.', 'room-dtphp-utama', 'cmwna3ylf0001u15gwtwexz7e', '2026-11-19', '09:30', '10:30', 'APPROVED', 1795077526576, 1795077541411, 1795076347880, 1795077541412);
INSERT OR IGNORE INTO Reservation (id, title, agenda, roomId, userId, date, startTime, endTime, status, actualStart, actualEnd, createdAt, updatedAt) VALUES ('cmwna3yll000bu15gef7wbhaa', 'Presentasi Klien Mitra Tani', 'Presentasi hasil panen dan rencana distribusi bulan depan.', 'room-dtphp-utama', 'cmwna3ylg0002u15gmggfm78n', '2026-11-19', '13:00', '14:30', 'PENDING', NULL, NULL, 1795076347881, 1795076347881);
INSERT OR IGNORE INTO Reservation (id, title, agenda, roomId, userId, date, startTime, endTime, status, actualStart, actualEnd, createdAt, updatedAt) VALUES ('cmwna3ylm000du15ggbfqsore', 'Rapat Evaluasi Bulanan', 'Evaluasi kinerja tim dan target kuartal berikutnya.', 'room-dtphp-utama', 'cmwna3ylg0003u15g0mdi0czr', '2026-11-20', '14:00', '15:30', 'PENDING', NULL, NULL, 1795076347882, 1795077570923);
INSERT OR IGNORE INTO Reservation (id, title, agenda, roomId, userId, date, startTime, endTime, status, actualStart, actualEnd, createdAt, updatedAt) VALUES ('cmwnawbcy0007u1xqkfxs5giu', 'Rapat Persiapan Panen', NULL, 'room-dtphp-utama', 'cmwna3ylf0001u15gwtwexz7e', '2026-11-19', '08:00', '09:30', 'PENDING', NULL, NULL, 1795077670786, 1795077670786);

-- Data Settings (1 baris)
INSERT OR IGNORE INTO Settings (id, openHour, closeHour, autoApprove, maxDaysAhead) VALUES ('main', 7, 18, 0, 30);
