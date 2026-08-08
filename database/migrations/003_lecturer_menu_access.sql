UPDATE users
SET permissions = '[
    "pl", "cpl", "matriks_cpl_pl", "mk", "cpmk",
    "setup_perkuliahan", "rps", "input_nilai", "presensi",
    "mon_komponen", "mon_subcpmk", "mon_cpmk", "mon_cpl"
]'::jsonb,
updated_at = NOW()
WHERE role = 'dosen'
  AND permissions_locked = FALSE
  AND (
      permissions = '[]'::jsonb
      OR permissions = '[
          "rps", "input_nilai", "presensi",
          "mon_komponen", "mon_subcpmk", "mon_cpmk", "mon_cpl"
      ]'::jsonb
  );
