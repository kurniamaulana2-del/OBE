        // Database Seed State
        const seedState = {
            rbacDataVersion: 4,
            activeMainMenu: 'kurikulum',
            activeSubMenu: 'pl',
            selectedClassKey: '', 
            selectedMKId: '',
            accounts: [
                { id: 'usr-admin', username: 'admin', name: 'Administrator Sistem', nuptk: '', role: 'administrator', facultyId: '', prodiId: '', active: true },
                { id: 'usr-kaprodi', username: 'kaprodi', name: 'Sri Kurnia Dwi Budi Maulana, S.T., M.T.', nuptk: '1234567890123456', role: 'kaprodi', facultyId: 'fak-teknologi', prodiId: 'prodi-ri', active: true },
                { id: 'usr-gkm', username: 'gkm', name: 'Adi Priansyah, S.T., M.T.', nuptk: '1234567890123456', role: 'gkm', facultyId: 'fak-teknologi', prodiId: 'prodi-ri', active: true },
                { id: 'usr-dosen', username: 'dosen', name: 'Jauharatul Wardah', nuptk: '1234567890123456', role: 'dosen', facultyId: 'fak-teknologi', prodiId: 'prodi-ri', active: true }
            ],
            masterData: {
                faculties: [
                    { id: 'fak-teknologi', code: 'FTR', name: 'Fakultas Teknologi dan Rekayasa', active: true }
                ],
                studyPrograms: [
                    { id: 'prodi-ri', code: 'RI', name: 'Rekayasa Industri', facultyId: 'fak-teknologi', active: true }
                ],
                academicYears: [
                    { id: 'ta-2025', code: '2025/2026', term: 'Ganjil', active: true }
                ]
            },

            plFinalized: true,
            cplFinalized: true,
            matrixCplPlFinalized: true,
            mkFinalized: true,
            cpmkFinalized: {},

            // Kurikulum Data
            plList: [
                { id: 'PL1', code: 'PL 1', desc: 'Sarjana Teknik Industri yang mampu bekerja secara individu maupun bekerjasama dalam tim untuk mengembangkan dan merancang sistem industri yang terintegrasi.' },
                { id: 'PL2', code: 'PL 2', desc: 'Sarjana Teknik Industri yang mampu menganalisis permasalahan, memberikan solusi berupa perekayasaan, pembuatan dan pengelolaan, serta melakukan evaluasi pada suatu sistem industri.' },
                { id: 'PL3', code: 'PL 3', desc: 'Sarjana Teknik Industri yang mampu mengembangkan diri secara terus menerus secara mandiri maupun profesional' }
            ],
            cplList: [
                { id: 'CPL1', code: 'CPL 1', desc: 'Kemampuan untuk menerapkan pengetahuan matematika, ilmu alam dan/atau material, teknologi informasi dan keteknikan untuk memperoleh pemahaman menyeluruh dari prinsip-prinsip teknik industri' },
                { id: 'CPL2', code: 'CPL 2', desc: 'Kemampuan untuk merancang sistem terintegrasi dengan menentukan standar yang diperlukan dan membuat desain akhir yang realistis (misal: teknis, aspek hukum, ekonomi, lingkungan, sosial, politik, kesehatan dan keselamatan, keberlanjutan) serta melibatkan berbagai pemangku kepentingan, dan mengidentifikasi dan/atau memanfaatkan potensi sumber daya lokal dan nasional dengan pandangan global di bidang teknik industri' },
                { id: 'CPL3', code: 'CPL 3', desc: 'Kemampuan untuk merancang dan melakukan eksperimen laboratorium dan/atau lapangan dan menganalisis dan menafsirkan data untuk mendukung proses pengambilan keputusan keteknikindustrian' },
                { id: 'CPL4', code: 'CPL 4', desc: 'Kemampuan untuk mengidentifikasi, merumuskan, menganalisis dan menyelesaikan permasalahan kompleks di bidang teknik industri' },
                { id: 'CPL5', code: 'CPL 5', desc: 'Kemampuan untuk menerapkan metode, keterampilan, dan peralatan teknik modern yang diperlukan dalam praktik keteknikindustrian' },
                { id: 'CPL6', code: 'CPL 6', desc: 'Kemampuan untuk berkomunikasi lisan dan tulisan secara efektif' },
                { id: 'CPL7', code: 'CPL 7', desc: 'Kemampuan untuk merencanakan, dan menyelesaikan, dan mengevaluasi tugas dengan memperhatikan batasan yang diberikan' },
                { id: 'CPL8', code: 'CPL 8', desc: 'Kemampuan untuk bekerja dalam tim yang multidisiplin dan multibudaya' },
                { id: 'CPL9', code: 'CPL 9', desc: 'Kemampuan untuk bertanggung jawab kepada masyarakat, termasuk dalam menjalankan etika profesi dan menjaga keselamatan kerja' },
                { id: 'CPL10', code: 'CPL 10', desc: 'Kemampuan untuk terlibat dalam pembelajaran sepanjang hayat, termasuk akses terhadap pengetahuan yang relevan dari isu-isu terkini' },
            ],
            matrixCPL_PL: {
                // CPL 1: Pengetahuan Fundamental
                'CPL1_PL1': true,
                'CPL1_PL2': true,
                // CPL 2: Merancang sistem terintegrasi
                'CPL2_PL1': true,
                'CPL2_PL2': true,
                // CPL 3: Eksperimen dan interpretasi data
                'CPL3_PL2': true,
                // CPL 4: Penyelesaian masalah kompleks
                'CPL4_PL2': true,
                // CPL 5: Metode dan alat teknik modern
                'CPL5_PL1': true,
                'CPL5_PL2': true,
                // CPL 6: Komunikasi
                'CPL6_PL1': true,
                'CPL6_PL3': true,
                // CPL 7: Perencanaan dan evaluasi tugas
                'CPL7_PL2': true,
                // CPL 8: Tim multidisiplin
                'CPL8_PL1': true,
                // CPL 9: Etika profesi dan masyarakat
                'CPL9_PL2': true,
                'CPL9_PL3': true,
                // CPL 10: Belajar sepanjang hayat
                'CPL10_PL3': true
            },
            mkList: [
                // --- SEMESTER 1 ---
                {
                    id: 'MK12',
                    semester: '1',
                    code: 'RI1L33',
                    name: 'Pengantar Teknik Industri',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKWP',
                    cpls: ['CPL1', 'CPL9', 'CPL10']
                },
                {
                    id: 'MK21',
                    semester: '2',
                    code: 'RI2D21',
                    name: 'Kewarganegaraan',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKDU',
                    cpls: ['CPL3', 'CPL7']
                },
                {
                    id: 'MK22',
                    semester: '2',
                    code: 'RI2E23',
                    name: 'Kimia Dasar',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKWP',
                    cpls: ['CPL1', 'CPL5']
                },
                {
                    id: 'MK23',
                    semester: '2',
                    code: 'RI2F23',
                    name: 'Material Teknik',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKWP',
                    cpls: ['CPL2', 'CPL6']
                },
                {
                    id: 'MK24',
                    semester: '2',
                    code: 'RI2G33',
                    name: 'Proses Manufaktur',
                    sksTeori: 2,
                    sksPraktik: 1,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL4', 'CPL8']
                },
                {
                    id: 'MK25',
                    semester: '2',
                    code: 'RI2H33',
                    name: 'Statistika II',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL5', 'CPL10']
                },
                {
                    id: 'MK31',
                    semester: '3',
                    code: 'RI3F23',
                    name: 'Maqashid Syariah Industri',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKWP',
                    cpls: ['CPL2', 'CPL7']
                },
                {
                    id: 'MK32',
                    semester: '3',
                    code: 'RI3G23',
                    name: 'Mekanika Teknik',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKWP',
                    cpls: ['CPL3', 'CPL5']
                },
                {
                    id: 'MK33',
                    semester: '3',
                    code: 'RI3H23',
                    name: 'Perilaku Organisasi',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKWP',
                    cpls: ['CPL1', 'CPL8']
                },
                {
                    id: 'MK34',
                    semester: '3',
                    code: 'RI3I33',
                    name: 'Riset Operasi I',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL4', 'CPL6']
                },
                {
                    id: 'MK41',
                    semester: '4',
                    code: 'RI4C33',
                    name: 'Keselamatan dan Kesehatan Kerja',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL2', 'CPL9']
                },
                {
                    id: 'MK42',
                    semester: '4',
                    code: 'RI4D42',
                    name: 'Kewirausahaan',
                    sksTeori: 1,
                    sksPraktik: 3,
                    totalSks: 4,
                    jenis: 'MKWU',
                    cpls: ['CPL5', 'CPL10']
                },
                {
                    id: 'MK43',
                    semester: '4',
                    code: 'RI4E33',
                    name: 'Pengendalian dan Penjaminan Mutu',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL1', 'CPL4']
                },
                {
                    id: 'MK44',
                    semester: '4',
                    code: 'RI4F23',
                    name: 'Perancangan dan Manajemen Organisasi Industri',
                    sksTeori: 2,
                    sksPraktik: 0,
                    totalSks: 2,
                    jenis: 'MKWP',
                    cpls: ['CPL3', 'CPL8']
                },
                {
                    id: 'MK45',
                    semester: '4',
                    code: 'RI4G33',
                    name: 'Perencanaan dan Pengendalian Produksi',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL6', 'CPL7']
                },
                {
                    id: 'MK51',
                    semester: '5',
                    code: 'RI5B33',
                    name: 'Perancangan Fasilitas',
                    sksTeori: 2,
                    sksPraktik: 1,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL1', 'CPL3']
                },
                {
                    id: 'MK52',
                    semester: '5',
                    code: 'RI5C33',
                    name: 'Supply Chain Management',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL4', 'CPL9']
                },
                {
                    id: 'MK53',
                    semester: '5',
                    code: 'RI5D32',
                    name: 'Metodologi Penelitian',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWU',
                    cpls: ['CPL2', 'CPL8']
                },
                {
                    id: 'MK54',
                    semester: '5',
                    code: 'RI5E33',
                    name: 'Pemodelan Sistem',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL5', 'CPL7']
                },
                {
                    id: 'MK55',
                    semester: '5',
                    code: 'RI5F33',
                    name: 'Pengukuran dan Perancangan Sistem Kerja',
                    sksTeori: 3,
                    sksPraktik: 0,
                    totalSks: 3,
                    jenis: 'MKWP',
                    cpls: ['CPL6', 'CPL10']
                }
            ],
            cpmkList: {
                'MK12': [
                    { id: 'CPMK1', code: 'CPMK 1', desc: 'Mampu menjelaskan prinsip dasar teknik industri, ruang lingkup, dan penerapannya dalam industri, termasuk isu green industry dan halal compliance', weights: { 'CPL1': 50, 'CPL9': 0, 'CPL10': 0 } },
                    { id: 'CPMK2', code: 'CPMK 2', desc: 'Mampu menunjukkan sikap profesional dan etika keinsinyuran, termasuk memahami kode etik insinyur Indonesia (PII)', weights: { 'CPL1': 0, 'CPL9': 20, 'CPL10': 0 } },
                    { id: 'CPMK3', code: 'CPMK 3', desc: 'Mampu memahami perkembangan keilmuan teknik industri dan pentingnya pembelajaran sepanjang hayat dalam era industri global', weights: { 'CPL1': 0, 'CPL9': 0, 'CPL10': 30 } }
                ]
            },

            // Perkuliahan Data (Per Kelas)
            classData: {
                '1_MK12_A25': {
                    sampleRpsVersion: 1,
                    semester: '1',
                    mkId: 'MK12',
                    kelas: 'A25 (2025/2026)',
                    prodiId: 'prodi-ri',
                    academicYearId: 'ta-2025',
                    lecturerIds: ['usr-dosen'],
                    pjmkLecturerId: 'usr-dosen',
                    locked: true,
                    subCpmkList: [
                        { id: 'SUB1', code: 'SubCPMK 1', desc: 'Mampu menjelaskan sejarah, perkembangan, ruang lingkup, dan peran teknik industri.', weights: { 'CPMK1': 15 } },
                        { id: 'SUB2', code: 'SubCPMK 2', desc: 'Mampu memahami isu strategis dan tren digitalisasi industri', weights: { 'CPMK1': 15 } },
                        { id: 'SUB3', code: 'SubCPMK 3', desc: 'Mampu memahami etika profesi dan kode etik insinyur (PII), serta menerapkan sikap profesional dalam konteks teknik industri', weights: { 'CPMK2': 20 } },
                        { id: 'SUB4', code: 'SubCPMK 4', desc: 'Mampu memahami konsep dasar engineering, proses desain, berpikir sistem, sistem terintegrasi, dan Body of Knowledge Teknik Industri', weights: { 'CPMK1': 20 } },
                        { id: 'SUB5', code: 'SubCPMK 5', desc: 'Mampu mengenali teori-teori dasar teknik industri dan menjelaskan penerapannya secara umum', weights: { 'CPMK3': 15 } },
                        { id: 'SUB6', code: 'SubCPMK 6', desc: 'Mampu menganalisis studi kasus sederhana, berkolaborasi, dan mempresentasikan hasil mini project', weights: { 'CPMK3': 15 } }
                    ],
                    subCpmkFinalized: true,
                    weeklyMatrixFinalized: true,
                    weeklyDraftSaved: true,
                    weeklyDraftDirty: false,
                    komponenList: [
                        { id: 'PTI_K1', jenis: 'Kuis', name: 'Peta Konsep Peran Teknik Industri', technique: 'tes', weeklyRowId: 'PTI_W1', weekNumber: '1, 2', criteria: ['Rubrik Analitik'], criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Individu; sejarah, ruang lingkup, dan kontribusi teknik industri pada sistem manufaktur dan jasa.', assignmentInstructions: 'Susun peta konsep satu halaman dan uraian maksimal 750 kata dengan satu contoh penerapan lokal.', assignmentMethod: 'Diunggah melalui LMS dalam format PDF.', performanceEvidence: 'Peta konsep, uraian argumentatif, dan daftar pustaka.', durationDeadline: '7 hari setelah pertemuan ke-2.', assessmentNotes: 'Nilai minimum ketuntasan 60.', assessmentInstrument: 'Formatif', formativeCriterion: 'Rubrik Analitik', summativeCriterion: '', weights: { 'SUB1': 15 } },
                        { id: 'PTI_K2', jenis: 'Tugas', name: 'Analisis Tren Digitalisasi Industri', technique: 'non_tes', weeklyRowId: 'PTI_W2', weekNumber: '3, 4', criteria: ['Rubrik Analitik'], criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Kelompok; analisis dampak IoT, AI, otomasi, dan keberlanjutan pada satu sektor industri.', assignmentInstructions: 'Analisis minimal tiga sumber mutakhir, identifikasi peluang, risiko, dan usulan kesiapan organisasi.', assignmentMethod: 'Laporan kelompok dan diskusi kelas.', performanceEvidence: 'Laporan 5-7 halaman serta materi presentasi.', durationDeadline: '10 hari setelah pertemuan ke-4.', assessmentNotes: 'Setiap anggota menyertakan refleksi kontribusi.', assessmentInstrument: 'Formatif', formativeCriterion: 'Rubrik Analitik', summativeCriterion: '', weights: { 'SUB2': 15 } },
                        { id: 'PTI_K3', jenis: 'Hasil Proyek', name: 'Analisis Dilema Etika Keinsinyuran', technique: 'non_tes', weeklyRowId: 'PTI_W3', weekNumber: '5, 6', criteria: ['Rubrik Analitik'], criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Individu; kasus konflik keselamatan, mutu, biaya, dan kepentingan pemangku kepentingan.', assignmentInstructions: 'Identifikasi fakta, pihak terdampak, pasal kode etik PII yang relevan, alternatif tindakan, dan rekomendasi.', assignmentMethod: 'Esai studi kasus melalui LMS.', performanceEvidence: 'Esai analitis 1.000-1.250 kata.', durationDeadline: '7 hari setelah pertemuan ke-6.', assessmentNotes: 'Argumentasi harus dapat ditelusuri ke kode etik dan sumber ilmiah.', assessmentInstrument: 'Formatif', formativeCriterion: 'Rubrik Analitik', summativeCriterion: '', weights: { 'SUB3': 10 } },
                        { id: 'PTI_K4', jenis: 'UTS', name: 'UTS Terintegrasi Etika Profesi', technique: 'tes', weeklyRowId: 'PTI_W4', weekNumber: '7', criteria: ['Rubrik Holistik'], criterionType: 'Rubrik Holistik', criterionLabel: 'Rubrik Holistik', assignmentScope: 'Individu; penguasaan konsep profesi, tanggung jawab insinyur, dan kode etik PII.', assignmentInstructions: 'Jawab soal uraian berbasis skenario secara tertutup dalam waktu yang ditentukan.', assignmentMethod: 'Tes tertulis luring.', performanceEvidence: 'Lembar jawaban UTS.', durationDeadline: '90 menit pada minggu UTS.', assessmentNotes: 'Ujian bersifat individual dan tanpa buku.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Holistik', weights: { 'SUB3': 10 } },
                        { id: 'PTI_K5', jenis: 'Tugas', name: 'Pemetaan Sistem Terintegrasi', technique: 'non_tes', weeklyRowId: 'PTI_W5', weekNumber: '9, 10', criteria: ['Rubrik Analitik'], criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Kelompok; pemetaan manusia, mesin, material, metode, informasi, energi, dan lingkungan pada sistem nyata.', assignmentInstructions: 'Lakukan observasi terbatas, buat rich picture/SIPOC, jelaskan batas sistem, hubungan antarelemen, dan peluang perbaikan.', assignmentMethod: 'Project-based learning dan presentasi kelas.', performanceEvidence: 'Poster sistem, laporan observasi, dan presentasi.', durationDeadline: '14 hari setelah pertemuan ke-10.', assessmentNotes: 'Objek observasi wajib disetujui dosen.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Analitik', weights: { 'SUB4': 20 } },
                        { id: 'PTI_K6', jenis: 'Tugas', name: 'Tinjauan Body of Knowledge Teknik Industri', technique: 'non_tes', weeklyRowId: 'PTI_W6', weekNumber: '11, 12', criteria: ['Portofolio'], criterionType: 'Portofolio', criterionLabel: 'Portofolio', assignmentScope: 'Individu; pengenalan area keilmuan ergonomi, sistem produksi, riset operasi, kualitas, dan rantai pasok.', assignmentInstructions: 'Pilih dua area keilmuan, rangkum teori dasarnya, bandingkan penerapannya, dan buat rencana belajar lanjut.', assignmentMethod: 'Portofolio digital melalui LMS.', performanceEvidence: 'Ringkasan literatur, infografik, anotasi sumber, dan refleksi belajar.', durationDeadline: '10 hari setelah pertemuan ke-12.', assessmentNotes: 'Gunakan minimal dua artikel ilmiah dan satu buku rujukan.', assessmentInstrument: 'Formatif', formativeCriterion: 'Portofolio', summativeCriterion: '', weights: { 'SUB5': 15 } },
                        { id: 'PTI_K7', jenis: 'Hasil Proyek', name: 'Laporan Mini Project Perbaikan Sistem', technique: 'non_tes', weeklyRowId: 'PTI_W7', weekNumber: '13, 14, 15', criteria: ['Rubrik Analitik'], criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Kelompok; diagnosis masalah sederhana dan rancangan perbaikan awal pada sistem manufaktur atau jasa.', assignmentInstructions: 'Definisikan masalah, kumpulkan data sederhana, gunakan minimal satu alat analisis, susun alternatif, dan rekomendasikan perbaikan.', assignmentMethod: 'Project-based learning dengan dua sesi konsultasi.', performanceEvidence: 'Proposal, logbook, data pendukung, dan laporan akhir 10-15 halaman.', durationDeadline: 'Akhir pertemuan ke-15.', assessmentNotes: 'Penilaian mencakup mutu hasil dan kontribusi anggota.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Analitik', weights: { 'SUB6': 10 } },
                        { id: 'PTI_K8', jenis: 'UAS', name: 'Presentasi dan Refleksi Mini Project', technique: 'non_tes', weeklyRowId: 'PTI_W7', weekNumber: '13, 14, 15', criteria: ['Rubrik Skala Persepsi'], criterionType: 'Rubrik Skala Persepsi', criterionLabel: 'Rubrik Skala Persepsi', assignmentScope: 'Kelompok dan individu; komunikasi solusi, kolaborasi, dan refleksi pembelajaran.', assignmentInstructions: 'Presentasikan hasil selama 12 menit, jawab pertanyaan selama 8 menit, lalu unggah refleksi individual.', assignmentMethod: 'Presentasi luring dan peer assessment.', performanceEvidence: 'Slide, rekaman presentasi, lembar tanya jawab, dan refleksi individu.', durationDeadline: 'Pertemuan ke-15 dan paling lambat 2 hari setelah presentasi.', assessmentNotes: 'Skor akhir menggabungkan performa kelompok dan individu.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Skala Persepsi', weights: { 'SUB6': 5 } }
                    ],
                    komponenFinalized: false,
                    rpsFinalized: false,
                    rps: {
                        identitas: {
                            mataKuliah: 'Pengantar Teknik Industri',
                            kodeMK: 'RI1L33',
                            semester: '1',
                            jenisMK: 'MKWP',
                            moda: 'Blended Learning',
                            mkPrasyarat: 'Tidak ada',
                            menjadiPrasyarat: 'Sistem Produksi, Ergonomi dan Perancangan Sistem Kerja, serta Pengendalian Kualitas',
                            integrasiAntarMK: 'Matematika Dasar, Pengantar Rekayasa dan Desain, serta Literasi Digital',
                            tanggalPenyusunan: '2025-07-14',
                            tanggalRevisi: '2025-08-01',
                            deskripsiMK: 'Mata kuliah ini memperkenalkan sejarah, ruang lingkup, Body of Knowledge, pendekatan sistem, etika profesi, perkembangan teknologi, dan peran insinyur industri dalam merancang serta memperbaiki sistem terintegrasi. Pembelajaran dilaksanakan melalui kajian konsep, studi kasus, observasi, diskusi, dan mini project.',
                            tautanKelasDaring: 'https://lms.universitas.ac.id/course/RI1L33-A25',
                            bahasaPengantar: 'Indonesia',

                        },
                        bahanKajianItems: [
                            { id: 'PTI_BK1', isi: 'Sejarah, perkembangan, ruang lingkup, dan peran profesi teknik industri' },
                            { id: 'PTI_BK2', isi: 'Transformasi digital, Industry 4.0/5.0, green industry, dan halal compliance' },
                            { id: 'PTI_BK3', isi: 'Profesionalisme, tanggung jawab insinyur, dan Kode Etik Insinyur Indonesia (PII)' },
                            { id: 'PTI_BK4', isi: 'Konsep engineering design, berpikir sistem, dan sistem terintegrasi' },
                            { id: 'PTI_BK5', isi: 'Body of Knowledge Teknik Industri dan keterkaitan antardisiplin' },
                            { id: 'PTI_BK6', isi: 'Pengantar ergonomi, sistem produksi, kualitas, riset operasi, dan rantai pasok' },
                            { id: 'PTI_BK7', isi: 'Identifikasi masalah, pengumpulan data sederhana, dan perumusan alternatif perbaikan' },
                            { id: 'PTI_BK8', isi: 'Komunikasi teknis, kerja tim, presentasi, dan refleksi pembelajaran sepanjang hayat' }
                        ],
                        daftarPustakaItems: [
                            { id: 'PTI_DP1', jenis: 'utama', isi: 'Salvendy, G. (Ed.). (2001). Handbook of Industrial Engineering: Technology and Operations Management (3rd ed.). Wiley.' },
                            { id: 'PTI_DP2', jenis: 'utama', isi: 'Turner, W. C., Mize, J. H., Case, K. E., & Nazemetz, J. W. (1993). Introduction to Industrial and Systems Engineering (3rd ed.). Prentice Hall.' },
                            { id: 'PTI_DP3', jenis: 'utama', isi: 'Badiru, A. B. (Ed.). (2014). Handbook of Industrial and Systems Engineering (2nd ed.). CRC Press.' },
                            { id: 'PTI_DP4', jenis: 'utama', isi: 'Persatuan Insinyur Indonesia. (2021). Kode Etik Insinyur Indonesia dan Pedoman Perilaku Profesional.' },
                            { id: 'PTI_DP5', jenis: 'pendukung', isi: 'International Labour Organization. (2019). Skills for a Greener Future: A Global View.' },
                            { id: 'PTI_DP6', jenis: 'pendukung', isi: 'Schwab, K. (2016). The Fourth Industrial Revolution. World Economic Forum.' },
                            { id: 'PTI_DP7', jenis: 'pendukung', isi: 'Institute of Industrial and Systems Engineers. Industrial and Systems Engineering Body of Knowledge.' },
                            { id: 'PTI_DP8', jenis: 'pendukung', isi: 'Artikel ilmiah mutakhir terkait digitalisasi, keberlanjutan, ergonomi, kualitas, dan sistem produksi yang disediakan pada LMS.' }
                        ],
                        matrixCpmkCpl: {
                            CPMK1: { CPL1: 50, CPL9: 0, CPL10: 0 },
                            CPMK2: { CPL1: 0, CPL9: 20, CPL10: 0 },
                            CPMK3: { CPL1: 0, CPL9: 0, CPL10: 30 }
                        },
                        matrixSubcpmkCpmk: {
                            SUB1: { CPMK1: 15, CPMK2: 0, CPMK3: 0 },
                            SUB2: { CPMK1: 15, CPMK2: 0, CPMK3: 0 },
                            SUB3: { CPMK1: 0, CPMK2: 20, CPMK3: 0 },
                            SUB4: { CPMK1: 20, CPMK2: 0, CPMK3: 0 },
                            SUB5: { CPMK1: 0, CPMK2: 0, CPMK3: 15 },
                            SUB6: { CPMK1: 0, CPMK2: 0, CPMK3: 15 }
                        },
                        evaluasiMatrix: {},
                        weeklyPlan: [
                            { id: 'PTI_W1', weekSelections: ['1', '2'], mingguKe: '1, 2', subcpmkId: 'SUB1', subcpmkIds: ['SUB1'], subcpmkWeights: { SUB1: 15 }, indikatorPenilaian: 'Ketepatan menjelaskan evolusi teknik industri, keluasan identifikasi ruang lingkup, dan relevansi contoh penerapan.', metodePembelajaranDaring: 'Video pengantar, forum tanya jawab, dan kuis diagnostik di LMS.', metodePembelajaranLuring: 'Ceramah interaktif, think-pair-share, dan penyusunan peta konsep.', bahanKajianIds: ['PTI_BK1'], daftarPustakaIds: ['PTI_DP1', 'PTI_DP2'], assessmentComponents: [
                                { id: 'PTI_K1', technique: 'tes', name: 'Peta Konsep Peran Teknik Industri', jenis: 'Kuis', weight: 15, criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Individu; sejarah, ruang lingkup, dan kontribusi teknik industri pada sistem manufaktur dan jasa.', assignmentInstructions: 'Susun peta konsep satu halaman dan uraian maksimal 750 kata dengan satu contoh penerapan lokal.', assignmentMethod: 'Diunggah melalui LMS dalam format PDF.', performanceEvidence: 'Peta konsep, uraian argumentatif, dan daftar pustaka.', durationDeadline: '7 hari setelah pertemuan ke-2.', assessmentNotes: 'Nilai minimum ketuntasan 60.', assessmentInstrument: 'Formatif', formativeCriterion: 'Rubrik Analitik', summativeCriterion: '' }
                            ] },
                            { id: 'PTI_W2', weekSelections: ['3', '4'], mingguKe: '3, 4', subcpmkId: 'SUB2', subcpmkIds: ['SUB2'], subcpmkWeights: { SUB2: 15 }, indikatorPenilaian: 'Ketepatan mengidentifikasi tren, kualitas bukti, dan kedalaman analisis peluang serta risiko digitalisasi.', metodePembelajaranDaring: 'Telaah video industri dan diskusi asinkron berbasis artikel.', metodePembelajaranLuring: 'Case-based learning, diskusi kelompok, dan gallery walk.', bahanKajianIds: ['PTI_BK2'], daftarPustakaIds: ['PTI_DP5', 'PTI_DP6', 'PTI_DP8'], assessmentComponents: [
                                { id: 'PTI_K2', technique: 'non_tes', name: 'Analisis Tren Digitalisasi Industri', jenis: 'Tugas', weight: 15, criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Kelompok; analisis dampak IoT, AI, otomasi, dan keberlanjutan pada satu sektor industri.', assignmentInstructions: 'Analisis minimal tiga sumber mutakhir, identifikasi peluang, risiko, dan usulan kesiapan organisasi.', assignmentMethod: 'Laporan kelompok dan diskusi kelas.', performanceEvidence: 'Laporan 5-7 halaman serta materi presentasi.', durationDeadline: '10 hari setelah pertemuan ke-4.', assessmentNotes: 'Setiap anggota menyertakan refleksi kontribusi.', assessmentInstrument: 'Formatif', formativeCriterion: 'Rubrik Analitik', summativeCriterion: '' }
                            ] },
                            { id: 'PTI_W3', weekSelections: ['5', '6'], mingguKe: '5, 6', subcpmkId: 'SUB3', subcpmkIds: ['SUB3'], subcpmkWeights: { SUB3: 10 }, indikatorPenilaian: 'Ketepatan mengidentifikasi dilema etika, penggunaan kode etik PII, dan kelayakan rekomendasi profesional.', metodePembelajaranDaring: 'Forum debat etika dan telaah kode etik melalui LMS.', metodePembelajaranLuring: 'Case method, role play pemangku kepentingan, dan diskusi reflektif.', bahanKajianIds: ['PTI_BK3'], daftarPustakaIds: ['PTI_DP4', 'PTI_DP8'], assessmentComponents: [
                                { id: 'PTI_K3', technique: 'non_tes', name: 'Analisis Dilema Etika Keinsinyuran', jenis: 'Hasil Proyek', weight: 10, criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Individu; kasus konflik keselamatan, mutu, biaya, dan kepentingan pemangku kepentingan.', assignmentInstructions: 'Identifikasi fakta, pihak terdampak, pasal kode etik PII yang relevan, alternatif tindakan, dan rekomendasi.', assignmentMethod: 'Esai studi kasus melalui LMS.', performanceEvidence: 'Esai analitis 1.000-1.250 kata.', durationDeadline: '7 hari setelah pertemuan ke-6.', assessmentNotes: 'Argumentasi harus dapat ditelusuri ke kode etik dan sumber ilmiah.', assessmentInstrument: 'Formatif', formativeCriterion: 'Rubrik Analitik', summativeCriterion: '' }
                            ] },
                            { id: 'PTI_W4', weekSelections: ['7'], mingguKe: '7', subcpmkId: 'SUB3', subcpmkIds: ['SUB3'], subcpmkWeights: { SUB3: 10 }, indikatorPenilaian: 'Penguasaan konsep profesi, tanggung jawab insinyur, dan penerapan kode etik pada skenario baru.', metodePembelajaranDaring: 'Latihan soal dan umpan balik persiapan UTS.', metodePembelajaranLuring: 'Review terstruktur dan latihan analisis skenario.', bahanKajianIds: ['PTI_BK3'], daftarPustakaIds: ['PTI_DP4'], assessmentComponents: [
                                { id: 'PTI_K4', technique: 'tes', name: 'UTS Terintegrasi Etika Profesi', jenis: 'UTS', weight: 10, criterionType: 'Rubrik Holistik', criterionLabel: 'Rubrik Holistik', assignmentScope: 'Individu; penguasaan konsep profesi, tanggung jawab insinyur, dan kode etik PII.', assignmentInstructions: 'Jawab soal uraian berbasis skenario secara tertutup dalam waktu yang ditentukan.', assignmentMethod: 'Tes tertulis luring.', performanceEvidence: 'Lembar jawaban UTS.', durationDeadline: '90 menit pada minggu UTS.', assessmentNotes: 'Ujian bersifat individual dan tanpa buku.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Holistik' }
                            ] },
                            { id: 'PTI_WUTS', weekSelections: ['UTS'], mingguKe: 'UTS', subcpmkId: '', subcpmkIds: [], subcpmkWeights: {}, indikatorPenilaian: 'Pelaksanaan Ujian Tengah Semester sesuai kalender akademik.', metodePembelajaranDaring: 'Pengumuman dan administrasi ujian melalui LMS.', metodePembelajaranLuring: 'Ujian tertulis terjadwal.', bahanKajianIds: ['PTI_BK1', 'PTI_BK2', 'PTI_BK3'], daftarPustakaIds: ['PTI_DP1', 'PTI_DP2', 'PTI_DP4'], assessmentComponents: [] },
                            { id: 'PTI_W5', weekSelections: ['9', '10'], mingguKe: '9, 10', subcpmkId: 'SUB4', subcpmkIds: ['SUB4'], subcpmkWeights: { SUB4: 20 }, indikatorPenilaian: 'Kelengkapan elemen sistem, ketepatan batas dan hubungan antarelemen, serta kualitas usulan perbaikan.', metodePembelajaranDaring: 'Simulasi pemetaan sistem dan konsultasi kelompok melalui konferensi video.', metodePembelajaranLuring: 'Observasi terbatas, workshop SIPOC/rich picture, dan presentasi.', bahanKajianIds: ['PTI_BK4'], daftarPustakaIds: ['PTI_DP1', 'PTI_DP3'], assessmentComponents: [
                                { id: 'PTI_K5', technique: 'non_tes', name: 'Pemetaan Sistem Terintegrasi', jenis: 'Tugas', weight: 20, criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Kelompok; pemetaan manusia, mesin, material, metode, informasi, energi, dan lingkungan pada sistem nyata.', assignmentInstructions: 'Lakukan observasi terbatas, buat rich picture/SIPOC, jelaskan batas sistem, hubungan antarelemen, dan peluang perbaikan.', assignmentMethod: 'Project-based learning dan presentasi kelas.', performanceEvidence: 'Poster sistem, laporan observasi, dan presentasi.', durationDeadline: '14 hari setelah pertemuan ke-10.', assessmentNotes: 'Objek observasi wajib disetujui dosen.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Analitik' }
                            ] },
                            { id: 'PTI_W6', weekSelections: ['11', '12'], mingguKe: '11, 12', subcpmkId: 'SUB5', subcpmkIds: ['SUB5'], subcpmkWeights: { SUB5: 15 }, indikatorPenilaian: 'Ketepatan konsep, kemampuan membandingkan bidang keilmuan, mutu sumber, dan kedalaman refleksi belajar.', metodePembelajaranDaring: 'Webquest sumber ilmiah, anotasi bacaan, dan peer review.', metodePembelajaranLuring: 'Jigsaw learning dan diskusi pakar bidang teknik industri.', bahanKajianIds: ['PTI_BK5', 'PTI_BK6'], daftarPustakaIds: ['PTI_DP1', 'PTI_DP3', 'PTI_DP7', 'PTI_DP8'], assessmentComponents: [
                                { id: 'PTI_K6', technique: 'non_tes', name: 'Tinjauan Body of Knowledge Teknik Industri', jenis: 'Tugas', weight: 15, criterionType: 'Portofolio', criterionLabel: 'Portofolio', assignmentScope: 'Individu; pengenalan area keilmuan ergonomi, sistem produksi, riset operasi, kualitas, dan rantai pasok.', assignmentInstructions: 'Pilih dua area keilmuan, rangkum teori dasarnya, bandingkan penerapannya, dan buat rencana belajar lanjut.', assignmentMethod: 'Portofolio digital melalui LMS.', performanceEvidence: 'Ringkasan literatur, infografik, anotasi sumber, dan refleksi belajar.', durationDeadline: '10 hari setelah pertemuan ke-12.', assessmentNotes: 'Gunakan minimal dua artikel ilmiah dan satu buku rujukan.', assessmentInstrument: 'Formatif', formativeCriterion: 'Portofolio', summativeCriterion: '' }
                            ] },
                            { id: 'PTI_W7', weekSelections: ['13', '14', '15'], mingguKe: '13, 14, 15', subcpmkId: 'SUB6', subcpmkIds: ['SUB6'], subcpmkWeights: { SUB6: 15 }, indikatorPenilaian: 'Ketepatan diagnosis, kecukupan data, logika alternatif solusi, kolaborasi, dan efektivitas komunikasi teknis.', metodePembelajaranDaring: 'Konsultasi proyek, logbook digital, dan peer assessment.', metodePembelajaranLuring: 'Project-based learning, coaching clinic, presentasi, dan refleksi.', bahanKajianIds: ['PTI_BK7', 'PTI_BK8'], daftarPustakaIds: ['PTI_DP1', 'PTI_DP3', 'PTI_DP8'], assessmentComponents: [
                                { id: 'PTI_K7', technique: 'non_tes', name: 'Laporan Mini Project Perbaikan Sistem', jenis: 'Hasil Proyek', weight: 10, criterionType: 'Rubrik Analitik', criterionLabel: 'Rubrik Analitik', assignmentScope: 'Kelompok; diagnosis masalah sederhana dan rancangan perbaikan awal pada sistem manufaktur atau jasa.', assignmentInstructions: 'Definisikan masalah, kumpulkan data sederhana, gunakan minimal satu alat analisis, susun alternatif, dan rekomendasikan perbaikan.', assignmentMethod: 'Project-based learning dengan dua sesi konsultasi.', performanceEvidence: 'Proposal, logbook, data pendukung, dan laporan akhir 10-15 halaman.', durationDeadline: 'Akhir pertemuan ke-15.', assessmentNotes: 'Penilaian mencakup mutu hasil dan kontribusi anggota.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Analitik' },
                                { id: 'PTI_K8', technique: 'non_tes', name: 'Presentasi dan Refleksi Mini Project', jenis: 'UAS', weight: 5, criterionType: 'Rubrik Skala Persepsi', criterionLabel: 'Rubrik Skala Persepsi', assignmentScope: 'Kelompok dan individu; komunikasi solusi, kolaborasi, dan refleksi pembelajaran.', assignmentInstructions: 'Presentasikan hasil selama 12 menit, jawab pertanyaan selama 8 menit, lalu unggah refleksi individual.', assignmentMethod: 'Presentasi luring dan peer assessment.', performanceEvidence: 'Slide, rekaman presentasi, lembar tanya jawab, dan refleksi individu.', durationDeadline: 'Pertemuan ke-15 dan paling lambat 2 hari setelah presentasi.', assessmentNotes: 'Skor akhir menggabungkan performa kelompok dan individu.', assessmentInstrument: 'Sumatif', formativeCriterion: '', summativeCriterion: 'Rubrik Skala Persepsi' }
                            ] },
                            { id: 'PTI_WUAS', weekSelections: ['UAS'], mingguKe: 'UAS', subcpmkId: '', subcpmkIds: [], subcpmkWeights: {}, indikatorPenilaian: 'Presentasi akhir, refleksi integratif, dan penutupan pembelajaran semester.', metodePembelajaranDaring: 'Pengumpulan arsip proyek dan refleksi melalui LMS.', metodePembelajaranLuring: 'Presentasi akhir dan umpan balik komprehensif.', bahanKajianIds: ['PTI_BK7', 'PTI_BK8'], daftarPustakaIds: ['PTI_DP8'], assessmentComponents: [] }
                        ],
                        rubricSetups: {
                            PTI_K1: { type: 'analytic', schemaVersion: 2, instructions: 'Nilai setiap aspek pada skala 1-5, lalu kalikan dengan bobot aspek.', rows: [
                                { aspect: 'Ketepatan sejarah dan ruang lingkup', weight: 35, veryPoor: 'Banyak konsep keliru.', poor: 'Konsep utama belum utuh.', fair: 'Konsep dasar cukup tepat.', good: 'Konsep lengkap dan tepat.', veryGood: 'Konsep lengkap, terhubung, dan kritis.' },
                                { aspect: 'Struktur dan hubungan konsep', weight: 35, veryPoor: 'Tidak menunjukkan hubungan.', poor: 'Hubungan antarkonsep lemah.', fair: 'Hubungan utama terlihat.', good: 'Hubungan logis dan sistematis.', veryGood: 'Struktur sangat runtut dan integratif.' },
                                { aspect: 'Contoh penerapan dan sumber', weight: 30, veryPoor: 'Tanpa contoh dan sumber.', poor: 'Contoh tidak relevan.', fair: 'Contoh relevan dengan sumber terbatas.', good: 'Contoh kontekstual dan didukung sumber.', veryGood: 'Contoh tajam, kontekstual, dan sumber kredibel.' }
                            ] },
                            PTI_K2: { type: 'analytic', schemaVersion: 2, instructions: 'Gunakan skala 1-5 untuk menilai laporan dan kontribusi diskusi.', rows: [
                                { aspect: 'Kualitas identifikasi tren', weight: 30, veryPoor: 'Tren tidak tepat.', poor: 'Tren minim dan usang.', fair: 'Tren utama teridentifikasi.', good: 'Tren relevan dan mutakhir.', veryGood: 'Tren mutakhir dipetakan secara komprehensif.' },
                                { aspect: 'Analisis peluang dan risiko', weight: 40, veryPoor: 'Tanpa analisis.', poor: 'Analisis deskriptif.', fair: 'Analisis cukup berimbang.', good: 'Analisis mendalam dan berbukti.', veryGood: 'Analisis kritis, sistemik, dan berbukti kuat.' },
                                { aspect: 'Rekomendasi dan komunikasi', weight: 30, veryPoor: 'Tidak ada rekomendasi.', poor: 'Rekomendasi tidak layak.', fair: 'Rekomendasi cukup layak.', good: 'Rekomendasi operasional dan jelas.', veryGood: 'Rekomendasi inovatif, terukur, dan komunikatif.' }
                            ] },
                            PTI_K3: { type: 'analytic', schemaVersion: 2, instructions: 'Penilaian menekankan argumentasi etis yang dapat dipertanggungjawabkan.', rows: [
                                { aspect: 'Identifikasi fakta dan pemangku kepentingan', weight: 25, veryPoor: 'Fakta utama terlewat.', poor: 'Fakta dan pihak tidak lengkap.', fair: 'Fakta utama cukup lengkap.', good: 'Fakta dan pihak dipetakan tepat.', veryGood: 'Pemetaan lengkap termasuk konflik kepentingan.' },
                                { aspect: 'Penerapan kode etik PII', weight: 35, veryPoor: 'Tidak merujuk kode etik.', poor: 'Rujukan tidak tepat.', fair: 'Rujukan cukup relevan.', good: 'Rujukan tepat dan dijelaskan.', veryGood: 'Rujukan terintegrasi dalam argumentasi kritis.' },
                                { aspect: 'Alternatif dan rekomendasi', weight: 40, veryPoor: 'Tanpa solusi.', poor: 'Solusi tidak realistis.', fair: 'Solusi cukup layak.', good: 'Solusi layak dan beralasan.', veryGood: 'Solusi berimbang, berisiko-terukur, dan profesional.' }
                            ] },
                            PTI_K4: { type: 'holistic', schemaVersion: 2, instructions: 'Pilih deskriptor yang paling merepresentasikan kualitas keseluruhan jawaban UTS.', rows: [
                                { grade: 'Sangat Baik', score: 5, criterion: 'Konsep akurat, analisis etis tajam, kode etik diterapkan tepat, dan rekomendasi sangat logis.' },
                                { grade: 'Baik', score: 4, criterion: 'Konsep akurat, analisis memadai, dan rekomendasi logis dengan kekurangan kecil.' },
                                { grade: 'Cukup', score: 3, criterion: 'Konsep dasar dipahami, tetapi analisis dan penerapan kode etik belum mendalam.' },
                                { grade: 'Kurang', score: 2, criterion: 'Terdapat kekeliruan konsep dan rekomendasi kurang didukung argumentasi.' },
                                { grade: 'Sangat Kurang', score: 1, criterion: 'Jawaban tidak menunjukkan penguasaan konsep maupun pertimbangan etis yang memadai.' }
                            ] },
                            PTI_K5: { type: 'analytic', schemaVersion: 2, instructions: 'Nilai mutu pemetaan sistem dan kemampuan kelompok menjelaskan keterkaitannya.', rows: [
                                { aspect: 'Kelengkapan elemen dan batas sistem', weight: 30, veryPoor: 'Elemen utama tidak terpetakan.', poor: 'Banyak elemen terlewat.', fair: 'Elemen utama cukup lengkap.', good: 'Elemen dan batas sistem jelas.', veryGood: 'Elemen, batas, dan konteks sistem sangat lengkap.' },
                                { aspect: 'Hubungan antarelemen', weight: 35, veryPoor: 'Tidak ada hubungan logis.', poor: 'Hubungan banyak keliru.', fair: 'Hubungan utama cukup tepat.', good: 'Hubungan jelas dan sistematis.', veryGood: 'Interaksi, umpan balik, dan dampak dijelaskan mendalam.' },
                                { aspect: 'Temuan dan peluang perbaikan', weight: 35, veryPoor: 'Tanpa temuan.', poor: 'Temuan tidak berbukti.', fair: 'Temuan cukup relevan.', good: 'Temuan dan usulan didukung bukti.', veryGood: 'Usulan prioritas tajam, layak, dan berdampak.' }
                            ] },
                            PTI_K6: { type: 'portfolio', schemaVersion: 2, instructions: 'Gunakan rentang 1-10 untuk menilai bukti perkembangan belajar mahasiswa.', rows: [
                                { aspect: 'Kelengkapan dan keteraturan artefak', lowScore: 'Artefak tidak lengkap, tidak terstruktur, dan sulit ditelusuri.', highScore: 'Artefak lengkap, tertata, diberi anotasi, dan mudah ditelusuri.' },
                                { aspect: 'Kedalaman pemahaman lintas bidang', lowScore: 'Ringkasan dangkal dan banyak kekeliruan konsep.', highScore: 'Perbandingan akurat, sintesis kuat, dan menunjukkan keterkaitan lintas bidang.' },
                                { aspect: 'Refleksi dan rencana belajar lanjut', lowScore: 'Refleksi umum tanpa bukti atau rencana konkret.', highScore: 'Refleksi jujur berbasis bukti dengan target belajar yang spesifik dan realistis.' }
                            ] },
                            PTI_K7: { type: 'analytic', schemaVersion: 2, instructions: 'Nilai laporan kelompok serta bukti kontribusi yang tercatat dalam logbook.', rows: [
                                { aspect: 'Perumusan masalah dan data', weight: 25, veryPoor: 'Masalah tidak jelas dan tanpa data.', poor: 'Masalah terlalu luas, data lemah.', fair: 'Masalah cukup fokus dengan data dasar.', good: 'Masalah fokus dan data relevan.', veryGood: 'Masalah tajam, terukur, dan data tervalidasi.' },
                                { aspect: 'Metode dan analisis', weight: 30, veryPoor: 'Tidak ada metode.', poor: 'Metode tidak sesuai.', fair: 'Metode dasar cukup sesuai.', good: 'Metode tepat dan analisis runtut.', veryGood: 'Metode tepat, analisis kritis, dan asumsi transparan.' },
                                { aspect: 'Alternatif dan rekomendasi', weight: 30, veryPoor: 'Tanpa alternatif.', poor: 'Alternatif tidak layak.', fair: 'Alternatif cukup layak.', good: 'Alternatif dibandingkan dan rekomendasi logis.', veryGood: 'Rekomendasi terukur, inovatif, dan mempertimbangkan dampak sistem.' },
                                { aspect: 'Kolaborasi dan dokumentasi', weight: 15, veryPoor: 'Tidak ada bukti kolaborasi.', poor: 'Kontribusi timpang dan dokumentasi lemah.', fair: 'Pembagian kerja cukup jelas.', good: 'Kolaborasi efektif dan logbook lengkap.', veryGood: 'Kolaborasi adaptif, akuntabel, dan terdokumentasi sangat baik.' }
                            ] },
                            PTI_K8: { type: 'perception', schemaVersion: 2, instructions: 'Dosen dan rekan sejawat memberi skor 1-5 pada setiap aspek.', rows: [
                                { aspect: 'Kejelasan dan struktur penyampaian', weight: 30, veryPoor: 'Tidak runtut dan sulit dipahami.', poor: 'Struktur lemah.', fair: 'Cukup runtut.', good: 'Runtut dan jelas.', veryGood: 'Sangat menarik, ringkas, dan meyakinkan.' },
                                { aspect: 'Penguasaan materi dan respons', weight: 35, veryPoor: 'Tidak menguasai materi.', poor: 'Banyak jawaban keliru.', fair: 'Menguasai konsep dasar.', good: 'Jawaban tepat dan beralasan.', veryGood: 'Jawaban tajam, reflektif, dan berbukti.' },
                                { aspect: 'Kerja tim dan profesionalisme', weight: 20, veryPoor: 'Tidak ada koordinasi.', poor: 'Koordinasi lemah.', fair: 'Peran cukup terbagi.', good: 'Tim kompak dan profesional.', veryGood: 'Sinergi kuat, setara, dan sangat profesional.' },
                                { aspect: 'Refleksi pembelajaran', weight: 15, veryPoor: 'Tanpa refleksi.', poor: 'Refleksi sangat umum.', fair: 'Refleksi cukup jujur.', good: 'Refleksi berbasis pengalaman.', veryGood: 'Refleksi kritis dengan rencana tindak lanjut konkret.' }
                            ] }
                        }
                    },
                    students: [
                        { nim: '25123001', name: 'Supangat', scores: { PTI_K1: 84, PTI_K2: 82, PTI_K3: 86, PTI_K4: 80, PTI_K5: 85, PTI_K6: 88, PTI_K7: 87, PTI_K8: 86 } },
                        { nim: '25123002', name: 'Alief Riandi', scores: { PTI_K1: 76, PTI_K2: 78, PTI_K3: 74, PTI_K4: 72, PTI_K5: 80, PTI_K6: 79, PTI_K7: 82, PTI_K8: 81 } },
                        { nim: '25123003', name: 'Nadia Putri', scores: { PTI_K1: 90, PTI_K2: 88, PTI_K3: 91, PTI_K4: 87, PTI_K5: 89, PTI_K6: 92, PTI_K7: 91, PTI_K8: 93 } },
                        { nim: '25123004', name: 'Rizky Maulana', scores: { PTI_K1: 70, PTI_K2: 73, PTI_K3: 68, PTI_K4: 66, PTI_K5: 75, PTI_K6: 72, PTI_K7: 77, PTI_K8: 74 } },
                        { nim: '25123005', name: 'Aulia Safitri', scores: { PTI_K1: 86, PTI_K2: 85, PTI_K3: 88, PTI_K4: 84, PTI_K5: 87, PTI_K6: 89, PTI_K7: 88, PTI_K8: 90 } }
                    ],

                }
            }
        };

module.exports = seedState;
