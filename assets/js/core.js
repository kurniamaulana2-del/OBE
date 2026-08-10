        const APP_STATE_KEY = 'obe-app-state-v2';
        const ACCESS_TOKEN_KEY = 'obe-access-token';
        const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';
        const defaultProgramState = JSON.parse(JSON.stringify(state));
        const defaultAccounts = JSON.parse(JSON.stringify(state.accounts));
        const defaultMasterData = JSON.parse(JSON.stringify(state.masterData));
        const defaultPengantarTiClassData = state.classData['1_MK12_A25']
            ? JSON.parse(JSON.stringify(state.classData['1_MK12_A25']))
            : null;
        const ROLE_LABELS = {
            administrator: 'Administrator',
            kaprodi: 'Kaprodi',
            gkm: 'Gugus Kendali Mutu (GKM)',
            dosen: 'Dosen'
        };
        const ROLE_MENU_PERMISSIONS = {
            administrator: ['accounts', 'master_data', 'pl', 'cpl', 'matriks_cpl_pl', 'mk', 'cpmk', 'setup_perkuliahan', 'rps', 'input_nilai', 'presensi', 'mon_komponen', 'mon_subcpmk', 'mon_cpmk', 'mon_cpl'],
            kaprodi: ['pl', 'cpl', 'matriks_cpl_pl', 'mk', 'cpmk', 'setup_perkuliahan', 'rps', 'input_nilai', 'presensi', 'mon_komponen', 'mon_subcpmk', 'mon_cpmk', 'mon_cpl'],
            gkm: ['pl', 'cpl', 'matriks_cpl_pl', 'mk', 'cpmk', 'setup_perkuliahan', 'rps', 'input_nilai', 'presensi', 'mon_komponen', 'mon_subcpmk', 'mon_cpmk', 'mon_cpl'],
            dosen: ['pl', 'cpl', 'matriks_cpl_pl', 'mk', 'cpmk', 'setup_perkuliahan', 'rps', 'input_nilai', 'presensi', 'mon_komponen', 'mon_subcpmk', 'mon_cpmk', 'mon_cpl']
        };
        let currentUser = null;
        let accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY) || '';
        let contextProdiId = '';
        let programStateVersion = 0;
        let remoteStateReady = false;
        let remoteSaveTimer = null;
        let remoteSaveInFlight = false;
        let remoteSaveDirty = false;
        let lastSavedProgramPayload = '';
        let persistenceErrorShown = false;

        let activeModalClassKey = '';
        let activeWeeklyWeekModal = null;
        let activeWeeklyComponentModal = null;
        
        let importTargetClassKey = '';

        function ensureSystemData() {
            const needsRbacV3Migration = (parseInt(state.rbacDataVersion, 10) || 0) < 3;
            const needsPjmkMigration = (parseInt(state.rbacDataVersion, 10) || 0) < 4;
            if (!Array.isArray(state.accounts) || state.accounts.length === 0) {
                state.accounts = JSON.parse(JSON.stringify(defaultAccounts));
            }
            if (!state.masterData) state.masterData = JSON.parse(JSON.stringify(defaultMasterData));
            ['faculties', 'studyPrograms', 'academicYears'].forEach(key => {
                if (!Array.isArray(state.masterData[key])) {
                    state.masterData[key] = JSON.parse(JSON.stringify(defaultMasterData[key]));
                }
            });
            if (!state.classData) state.classData = {};
            Object.keys(state.classData).forEach(key => {
                const cls = state.classData[key];
                if (!cls.prodiId) {
                    const firstProgram = state.masterData.studyPrograms.find(program => program.active) || state.masterData.studyPrograms[0];
                    cls.prodiId = firstProgram ? firstProgram.id : '';
                }
                if (!Array.isArray(cls.lecturerIds)) {
                    const lecturerName = cls.rps && cls.rps.identitas ? cls.rps.identitas.dosenPengampu : '';
                    const lecturer = state.accounts.find(account => account.active && lecturerName && lecturerName.includes(account.name));
                    cls.lecturerIds = lecturer ? [lecturer.id] : [];
                }
                if (needsRbacV3Migration && key === '1_MK12_A25' && cls.lecturerIds.length === 0) {
                    const sampleLecturer = state.accounts.find(account => account.id === 'usr-dosen' && account.active);
                    if (sampleLecturer) cls.lecturerIds = [sampleLecturer.id];
                }
                if (needsPjmkMigration || !cls.pjmkLecturerId || !cls.lecturerIds.includes(cls.pjmkLecturerId)) {
                    cls.pjmkLecturerId = cls.lecturerIds[0] || '';
                }
            });
            state.rbacDataVersion = 4;
        }

        function loadState() {
            const saved = localStorage.getItem(APP_STATE_KEY) || localStorage.getItem('');
            if (saved) {
                try { state = JSON.parse(saved); } catch(e) { console.error(e); }
            }
            ensureSystemData();
            const savedPengantarTi = state.classData && state.classData['1_MK12_A25'];
            const hasAuthoredWeeklyPlan = savedPengantarTi
                && savedPengantarTi.rps
                && Array.isArray(savedPengantarTi.rps.weeklyPlan)
                && savedPengantarTi.rps.weeklyPlan.length > 0;
            if (!savedPengantarTi && defaultPengantarTiClassData) {
                if (!state.classData) state.classData = {};
                state.classData['1_MK12_A25'] = JSON.parse(JSON.stringify(defaultPengantarTiClassData));
            } else if (savedPengantarTi && defaultPengantarTiClassData && (savedPengantarTi.sampleRpsVersion || 0) < 1 && !hasAuthoredWeeklyPlan) {
                const preservedClassIdentity = {
                    semester: savedPengantarTi.semester || defaultPengantarTiClassData.semester,
                    mkId: savedPengantarTi.mkId || defaultPengantarTiClassData.mkId,
                    kelas: savedPengantarTi.kelas || defaultPengantarTiClassData.kelas,
                    locked: savedPengantarTi.locked
                };
                state.classData['1_MK12_A25'] = Object.assign(
                    JSON.parse(JSON.stringify(defaultPengantarTiClassData)),
                    preservedClassIdentity
                );
                saveState();
            }
            if (!state.selectedMKId && state.mkList.length > 0) state.selectedMKId = state.mkList[0].id;
            if (!state.classData) state.classData = {};
            if (!state.selectedClassKey && Object.keys(state.classData).length > 0) {
                state.selectedClassKey = Object.keys(state.classData)[0];
            }
        }

        function buildProgramPayload(sourceState = state) {
            const payload = JSON.parse(JSON.stringify(sourceState));
            delete payload.accounts;
            delete payload.masterData;
            delete payload.activeMainMenu;
            delete payload.activeSubMenu;
            delete payload.selectedClassKey;
            delete payload.selectedMKId;
            delete payload.tempStudentList;
            return payload;
        }

        function createEmptyProgramPayload() {
            const payload = buildProgramPayload(defaultProgramState);
            payload.plList = [];
            payload.cplList = [];
            payload.matrixCPL_PL = {};
            payload.mkList = [];
            payload.cpmkList = {};
            payload.classData = {};
            payload.plFinalized = false;
            payload.cplFinalized = false;
            payload.matrixCplPlFinalized = false;
            payload.mkFinalized = false;
            payload.cpmkFinalized = {};
            return payload;
        }

        async function apiRequest(path, options = {}) {
            const headers = Object.assign({}, options.headers || {});
            if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
            if (options.body !== undefined && !(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(options.body);
            }
            const response = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
            const body = response.status === 204 ? null : await response.json().catch(() => null);
            if (!response.ok) {
                const error = new Error(body && body.error ? body.error : `API request failed (${response.status}).`);
                error.status = response.status;
                throw error;
            }
            return body;
        }

        function normalizeProgramTenantData(bootstrap) {
            const accounts = bootstrap.accounts.length > 0 ? bootstrap.accounts : bootstrap.lecturers;
            const accountByUsername = Object.fromEntries(accounts.map(account => [account.username, account]));
            const legacyAccountIds = {
                'usr-kaprodi': accountByUsername.kaprodi && accountByUsername.kaprodi.id,
                'usr-gkm': accountByUsername.gkm && accountByUsername.gkm.id,
                'usr-dosen': accountByUsername.dosen && accountByUsername.dosen.id
            };
            const validAccountIds = new Set(accounts.map(account => account.id));
            const tenantYears = bootstrap.masterData.academicYears;
            Object.values(state.classData || {}).forEach(cls => {
                cls.prodiId = bootstrap.contextProdiId;
                cls.academicYearId = tenantYears.some(year => year.id === cls.academicYearId)
                    ? cls.academicYearId
                    : (tenantYears[0] ? tenantYears[0].id : null);
                cls.lecturerIds = (cls.lecturerIds || [])
                    .map(id => legacyAccountIds[id] || id)
                    .filter(id => validAccountIds.has(id));
            });
        }

        async function loadRemoteBootstrap(requestedProdiId = '') {
            const query = requestedProdiId ? `?prodiId=${encodeURIComponent(requestedProdiId)}` : '';
            const bootstrap = await apiRequest(`/bootstrap${query}`);
            currentUser = bootstrap.user;
            contextProdiId = bootstrap.contextProdiId || currentUser.prodiId || '';
            const baseState = JSON.parse(JSON.stringify(defaultProgramState));
            const contextProgram = bootstrap.masterData.studyPrograms.find(prodi => prodi.id === contextProdiId);
            const canInitializeDemo = !bootstrap.programState.payload
                && ['kaprodi', 'gkm'].includes(currentUser.role)
                && contextProgram
                && contextProgram.code === 'TI';
            const remotePayload = bootstrap.programState.payload
                || (canInitializeDemo ? buildProgramPayload(baseState) : createEmptyProgramPayload());
            state = Object.assign(baseState, remotePayload);
            state.accounts = bootstrap.accounts.length > 0 ? bootstrap.accounts : bootstrap.lecturers;
            state.masterData = bootstrap.masterData;
            normalizeProgramTenantData(bootstrap);
            ensureSystemData();
            programStateVersion = bootstrap.programState.version;
            remoteStateReady = true;
            lastSavedProgramPayload = JSON.stringify(buildProgramPayload());
            localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
        }

        async function switchAdminProgramContext(prodiId) {
            if (!prodiId || prodiId === contextProdiId) return;
            const activeMainMenu = state.activeMainMenu;
            const activeSubMenu = state.activeSubMenu;
            try {
                await loadRemoteBootstrap(prodiId);
                state.activeMainMenu = activeMainMenu;
                state.activeSubMenu = activeSubMenu;
                expandedMainMenu = activeMainMenu;
                renderApp();
            } catch (error) {
                alert(`Konteks Program Studi gagal dimuat: ${error.message}`);
            }
        }

        async function flushRemoteState() {
            if (!remoteStateReady || !currentUser || remoteSaveInFlight || !remoteSaveDirty) return;
            const payload = buildProgramPayload();
            const serialized = JSON.stringify(payload);
            remoteSaveDirty = false;
            if (serialized === lastSavedProgramPayload) return;
            remoteSaveInFlight = true;
            try {
                const result = await apiRequest('/program-state', {
                    method: 'PUT',
                    body: { prodiId: contextProdiId, version: programStateVersion, payload }
                });
                programStateVersion = result.version;
                lastSavedProgramPayload = serialized;
                persistenceErrorShown = false;
            } catch (error) {
                console.error('Gagal menyimpan data ke PostgreSQL:', error);
                remoteSaveDirty = true;
                if (!persistenceErrorShown) {
                    persistenceErrorShown = true;
                    alert(error.status === 409
                        ? 'Data berubah pada sesi lain. Muat ulang halaman sebelum melanjutkan agar perubahan tidak tumpang tindih.'
                        : `Data belum tersimpan ke server: ${error.message}`);
                }
            } finally {
                remoteSaveInFlight = false;
                if (remoteSaveDirty && !persistenceErrorShown) {
                    clearTimeout(remoteSaveTimer);
                    remoteSaveTimer = setTimeout(flushRemoteState, 300);
                }
            }
        }

        function saveState() {
            localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
            if (!remoteStateReady || !currentUser || currentUser.role === 'administrator') return;
            remoteSaveDirty = true;
            clearTimeout(remoteSaveTimer);
            remoteSaveTimer = setTimeout(flushRemoteState, 500);
        }

        function setAuthenticatedLayout(isAuthenticated) {
            const loginScreen = document.getElementById('login-screen');
            const sidebar = document.getElementById('app-sidebar');
            const shell = document.getElementById('app-shell');
            const overlay = document.getElementById('mobile-overlay');
            loginScreen.classList.toggle('hidden', isAuthenticated);
            sidebar.style.display = isAuthenticated ? 'flex' : 'none';
            shell.style.display = isAuthenticated ? 'flex' : 'none';
            overlay.style.display = isAuthenticated ? '' : 'none';
        }

        async function login(event) {
            event.preventDefault();
            const username = document.getElementById('login-username').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value;
            const error = document.getElementById('login-error');
            const submitButton = event.currentTarget.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            error.classList.add('hidden');
            try {
                const auth = await apiRequest('/auth/login', { method: 'POST', body: { username, password } });
                accessToken = auth.token;
                sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
                await loadRemoteBootstrap();
            } catch (requestError) {
                accessToken = '';
                sessionStorage.removeItem(ACCESS_TOKEN_KEY);
                error.textContent = requestError.message === 'Failed to fetch'
                    ? 'Server API tidak dapat dihubungi. Jalankan backend melalui npm start.'
                    : requestError.message;
                error.classList.remove('hidden');
                submitButton.disabled = false;
                return;
            }
            if (currentUser.role === 'administrator') {
                state.activeMainMenu = 'pengaturan';
                state.activeSubMenu = 'accounts';
            } else {
                state.activeMainMenu = 'kurikulum';
                state.activeSubMenu = 'pl';
            }
            expandedMainMenu = state.activeMainMenu;
            setAuthenticatedLayout(true);
            renderApp();
            submitButton.disabled = false;
        }

        function logout() {
            clearTimeout(remoteSaveTimer);
            currentUser = null;
            accessToken = '';
            contextProdiId = '';
            remoteStateReady = false;
            remoteSaveDirty = false;
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
            document.getElementById('app-modal-root').innerHTML = '';
            closeMobileSidebar();
            setAuthenticatedLayout(false);
            const passwordInput = document.getElementById('login-password');
            if (passwordInput) passwordInput.value = '';
        }

        function openChangePasswordModal() {
            if (!currentUser) return;
            document.getElementById('app-modal-root').innerHTML = `
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onsubmit="submitOwnPasswordChange(event)" class="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
                        <div class="mb-4 flex items-center justify-between">
                            <div>
                                <h3 class="font-bold text-gray-900">Atur Ulang Kata Sandi</h3>
                                <p class="text-xs text-gray-500">${escapeHtml(currentUser.username)} - ${escapeHtml(currentUser.name)}</p>
                            </div>
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="text-gray-500" aria-label="Tutup">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <label class="mb-1 block text-xs font-semibold" for="own-current-password">Kata Sandi Saat Ini</label>
                        <input id="own-current-password" name="currentPassword" type="password" required autocomplete="current-password" class="w-full rounded border px-3 py-2 text-sm">
                        <label class="mb-1 mt-3 block text-xs font-semibold" for="own-new-password">Kata Sandi Baru</label>
                        <input id="own-new-password" name="newPassword" type="password" required minlength="8" autocomplete="new-password" class="w-full rounded border px-3 py-2 text-sm" placeholder="Minimal 8 karakter">
                        <label class="mb-1 mt-3 block text-xs font-semibold" for="own-password-confirmation">Konfirmasi Kata Sandi Baru</label>
                        <input id="own-password-confirmation" name="confirmation" type="password" required minlength="8" autocomplete="new-password" class="w-full rounded border px-3 py-2 text-sm">
                        <div class="mt-4 flex justify-end gap-2">
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="rounded border px-3 py-2 text-xs font-semibold">Batal</button>
                            <button type="submit" class="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">Simpan Kata Sandi</button>
                        </div>
                    </form>
                </div>`;
            document.getElementById('own-current-password').focus();
        }

        async function submitOwnPasswordChange(event) {
            event.preventDefault();
            const form = event.currentTarget;
            const currentPassword = form.elements.currentPassword.value;
            const newPassword = form.elements.newPassword.value;
            const confirmation = form.elements.confirmation.value;
            if (newPassword !== confirmation) return alert('Konfirmasi kata sandi baru tidak sama.');

            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            try {
                const result = await apiRequest('/auth/change-password', {
                    method: 'POST',
                    body: { currentPassword, newPassword }
                });
                accessToken = result.token;
                sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
                document.getElementById('app-modal-root').innerHTML = '';
                alert('Kata sandi berhasil diperbarui.');
            } catch (error) {
                alert(`Kata sandi gagal diperbarui: ${error.message}`);
                submitButton.disabled = false;
            }
        }

        function getCurrentRole() {
            return currentUser ? currentUser.role : '';
        }

        function isAdministrator() {
            return getCurrentRole() === 'administrator';
        }

        function isCurriculumManager() {
            return getCurrentRole() === 'kaprodi' || getCurrentRole() === 'gkm';
        }

        function getLecturerAccounts() {
            return state.accounts.filter(account =>
                account.active
                && ['kaprodi', 'gkm', 'dosen'].includes(account.role)
            );
        }

        function isAssignedToClass(classKey) {
            const cls = state.classData[classKey];
            return !!(currentUser && cls && Array.isArray(cls.lecturerIds) && cls.lecturerIds.includes(currentUser.id));
        }

        function isPjmkForClass(classKey) {
            const cls = state.classData[classKey];
            return !!(currentUser && cls && cls.pjmkLecturerId === currentUser.id);
        }

        function getAccessibleClassKeys(moduleName) {
            const classKeys = Object.keys(state.classData || {});
            if (getCurrentRole() !== 'dosen' || !['rps', 'input_nilai', 'presensi', 'monitor'].includes(moduleName)) {
                return classKeys;
            }
            return classKeys.filter(key => state.classData[key].locked && isAssignedToClass(key));
        }

        function canAccessSubMenu(subMenu) {
            const permissions = currentUser && Array.isArray(currentUser.permissions)
                ? currentUser.permissions
                : (ROLE_MENU_PERMISSIONS[getCurrentRole()] || []);
            return permissions.includes(subMenu)
                && (!['accounts', 'master_data'].includes(subMenu) || isAdministrator());
        }

        function getActivePageAccess() {
            const subMenu = state.activeSubMenu;
            if (subMenu === 'accounts') {
                return { canWrite: isAdministrator(), message: isAdministrator() ? '' : 'Manajemen akun hanya dapat dikelola Administrator.' };
            }
            if (subMenu === 'master_data') {
                return { canWrite: isAdministrator(), message: isAdministrator() ? '' : 'Data Master ditampilkan dalam mode read-only.' };
            }
            if (['pl', 'cpl', 'matriks_cpl_pl', 'mk', 'cpmk'].includes(subMenu)) {
                return { canWrite: isCurriculumManager(), message: isCurriculumManager() ? '' : 'Kurikulum bersifat read-only untuk role Anda.' };
            }
            if (subMenu === 'setup_perkuliahan') {
                return { canWrite: isCurriculumManager(), message: isCurriculumManager() ? '' : 'Setup Perkuliahan bersifat read-only untuk role Anda.' };
            }
            if (subMenu === 'rps') {
                const canWrite = isPjmkForClass(state.selectedClassKey);
                return { canWrite, message: canWrite ? 'Akses edit RPS diberikan kepada Dosen PJMK kelas ini.' : 'RPS ditampilkan read-only; hanya Dosen PJMK kelas ini yang dapat mengubahnya.' };
            }
            if (subMenu === 'input_nilai') {
                const canWrite = canManageClassAssessment(state.selectedClassKey);
                return { canWrite, message: canWrite ? 'Akses tulis dibatasi pada kelas yang Anda ampu.' : 'Penilaian read-only sampai RPS difinalisasi total dan kelas diplot kepada Anda.' };
            }
            if (subMenu === 'presensi') {
                const canWrite = ['kaprodi', 'gkm', 'dosen'].includes(getCurrentRole()) && isAssignedToClass(state.selectedClassKey);
                return { canWrite, message: canWrite ? 'Akses tulis dibatasi pada kelas yang Anda ampu.' : 'Data ditampilkan dalam mode read-only; pilih kelas yang Anda ampu untuk mengubah data.' };
            }
            if (subMenu && subMenu.startsWith('mon_')) {
                return { canWrite: false, message: getCurrentRole() === 'dosen' ? 'Monitor dibatasi pada kelas yang Anda ampu.' : 'Monitor Nilai tersedia dalam mode read-only.' };
            }
            return { canWrite: false, message: 'Halaman tersedia dalam mode read-only.' };
        }

        function isReadOperationControl(control) {
            if (control.hasAttribute('data-rbac-read')) return true;
            const handler = `${control.getAttribute('onclick') || ''} ${control.getAttribute('onchange') || ''}`;
            return /selectedClassKey|selectedMKId|export|download|openRPSFromClass/i.test(handler);
        }

        function applyActivePageAccess() {
            const container = document.getElementById('content-area');
            const access = getActivePageAccess();
            if (access.message) {
                const tone = access.canWrite ? 'blue' : 'amber';
                container.insertAdjacentHTML('afterbegin', `
                    <div class="mb-4 rounded-lg border border-${tone}-200 bg-${tone}-50 px-3 py-2 text-xs font-semibold text-${tone}-800">
                        <i class="fa-solid ${access.canWrite ? 'fa-user-shield' : 'fa-eye'} mr-1.5"></i>${access.message}
                    </div>`);
            }
            if (access.canWrite) return;
            container.querySelectorAll('input, textarea, select, button').forEach(control => {
                if (isReadOperationControl(control)) return;
                control.disabled = true;
                control.setAttribute('data-rbac-blocked', 'true');
                control.classList.add('cursor-not-allowed', 'opacity-60');
            });
        }

        function enforceBlockedControl(event) {
            const control = event.target.closest && event.target.closest('[data-rbac-blocked="true"]');
            if (!control) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        window.addEventListener('DOMContentLoaded', async () => {
            loadState();
            applyInitialSidebarState();
            document.addEventListener('click', enforceBlockedControl, true);
            document.addEventListener('change', enforceBlockedControl, true);
            if (accessToken) {
                try {
                    await loadRemoteBootstrap();
                } catch (error) {
                    console.error('Sesi tidak dapat dipulihkan:', error);
                    accessToken = '';
                    currentUser = null;
                    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
                }
            }
            setAuthenticatedLayout(!!currentUser);
            if (currentUser) renderApp();
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) closeMobileSidebar();
            updateSidebarToggle();
        });
        window.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMobileSidebar();
        });

        const navigationGroups = [
            {
                id: 'pengaturan',
                name: 'PENGATURAN ADMIN',
                icon: 'fa-gears',
                subMenus: [
                    { id: 'accounts', name: 'Manajemen Akun', icon: 'fa-users-gear' },
                    { id: 'master_data', name: 'Data Master', icon: 'fa-database' }
                ]
            },
            {
                id: 'kurikulum',
                name: 'KURIKULUM',
                icon: 'fa-book-bookmark',
                subMenus: [
                    { id: 'pl', name: 'Setup Profil Lulusan', icon: 'fa-id-card' },
                    { id: 'cpl', name: 'Setup CPL', icon: 'fa-list-check' },
                    { id: 'matriks_cpl_pl', name: 'Matriks CPL x Profil Lulusan', icon: 'fa-table-cells' },
                    { id: 'mk', name: 'Setup Mata Kuliah', icon: 'fa-book' },
                    { id: 'cpmk', name: 'Setup CPMK', icon: 'fa-bullseye' }
                ]
            },
            {
                id: 'perkuliahan',
                name: 'PERKULIAHAN',
                icon: 'fa-pen-to-square',
                subMenus: [
                    { id: 'setup_perkuliahan', name: 'Setup Perkuliahan', icon: 'fa-school' },
                    { id: 'rps', name: 'RPS', icon: 'fa-file-lines' },
                    { id: 'input_nilai', name: 'Penilaian', icon: 'fa-user-pen' },
                    { id: 'presensi', name: 'Presensi', icon: 'fa-clipboard-list' }
                ]
            },
            {
                id: 'monitor',
                name: 'MONITOR NILAI',
                icon: 'fa-chart-line',
                subMenus: [
                    { id: 'mon_komponen', name: 'Ketercapaian Komponen Penilaian', icon: 'fa-chart-pie' },
                    { id: 'mon_subcpmk', name: 'Ketercapaian SubCPMK', icon: 'fa-chart-bar' },
                    { id: 'mon_cpmk', name: 'Ketercapaian CPMK', icon: 'fa-chart-simple' },
                    { id: 'mon_cpl', name: 'Ketercapaian CPL', icon: 'fa-award' }
                ]
            }
        ];
        let expandedMainMenu = 'kurikulum';

        function applyInitialSidebarState() {
            expandedMainMenu = state.activeMainMenu;
            if (window.innerWidth < 768) {
                document.body.classList.remove('sidebar-mini');
            } else if (localStorage.getItem('obe-sidebar-mini') === 'true') {
                document.body.classList.add('sidebar-mini');
            }
        }

        function toggleSidebar() {
            if (window.innerWidth < 768) {
                document.body.classList.toggle('sidebar-open');
                return;
            }
            document.body.classList.toggle('sidebar-mini');
            const isMini = document.body.classList.contains('sidebar-mini');
            localStorage.setItem('obe-sidebar-mini', isMini);
            updateSidebarToggle();
        }

        function closeMobileSidebar() {
            document.body.classList.remove('sidebar-open');
        }

        function updateSidebarToggle() {
            const isMobile = window.innerWidth < 768;
            const isMini = document.body.classList.contains('sidebar-mini');
            const icon = document.getElementById('sidebar-collapse-icon');
            const button = document.getElementById('sidebar-collapse-button');
            const label = document.getElementById('sidebar-collapse-label');
            if (!icon || !button || !label) return;
            icon.className = `fa-solid ${isMobile ? 'fa-xmark' : (isMini ? 'fa-angles-right' : 'fa-angles-left')} w-5`;
            label.innerText = isMobile ? 'Tutup sidebar' : 'Ciutkan sidebar';
            button.title = isMobile ? 'Tutup sidebar' : (isMini ? 'Perluas sidebar' : 'Ciutkan sidebar');
        }

        function toggleMainMenu(menu) {
            if (window.innerWidth >= 768 && document.body.classList.contains('sidebar-mini')) {
                toggleSidebar();
            }
            if (menu === state.activeMainMenu) {
                expandedMainMenu = expandedMainMenu === menu ? null : menu;
                renderSidebarNavigation();
                return;
            }
            expandedMainMenu = menu;
            switchMainMenu(menu);
        }

        function switchMainMenu(menu) {
            if (menu === 'pengaturan' && !isAdministrator()) {
                alert('Menu Pengaturan Admin hanya tersedia untuk Administrator.');
                return;
            }
            state.activeMainMenu = menu;
            expandedMainMenu = menu;
            if (menu === 'pengaturan') state.activeSubMenu = isAdministrator() ? 'accounts' : 'master_data';
            else if (menu === 'kurikulum') state.activeSubMenu = 'pl';
            else if (menu === 'perkuliahan') state.activeSubMenu = 'setup_perkuliahan';
            else if (menu === 'monitor') state.activeSubMenu = 'mon_komponen';
            renderApp();
        }

        function switchSubMenu(subMenu) {
            if (!canAccessSubMenu(subMenu)) {
                alert('Anda tidak memiliki hak akses ke menu tersebut.');
                return;
            }
            state.activeSubMenu = subMenu;
            expandedMainMenu = state.activeMainMenu;
            closeMobileSidebar();
            renderApp();
        }

        function renderSidebarNavigation() {
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = navigationGroups
                .filter(group => group.id !== 'pengaturan' || isAdministrator())
                .map(group => {
                const isActive = state.activeMainMenu === group.id;
                const isOpen = expandedMainMenu === group.id;
                const visibleSubMenus = group.subMenus.filter(subMenu => canAccessSubMenu(subMenu.id));
                const subMenuHtml = visibleSubMenus.map(subMenu => `
                    <button onclick="switchSubMenu('${subMenu.id}')" class="w-full text-left pr-3 py-2 text-sm rounded-lg transition flex items-center gap-2 ${state.activeSubMenu === subMenu.id ? 'sub-active' : 'text-blue-100 hover:bg-blue-800'}">
                        <i class="fa-solid ${subMenu.icon} w-5 text-center text-blue-200"></i>
                        <span>${subMenu.name}</span>
                    </button>`).join('');
                return `
                    <section class="sidebar-group ${isOpen ? 'is-open' : ''}">
                        <button onclick="toggleMainMenu('${group.id}')" class="sidebar-group-button w-full px-3 py-2.5 rounded-lg transition flex items-center gap-3 ${isActive ? 'bg-blue-700 text-white shadow-sm' : 'text-blue-100 hover:bg-blue-800'}" title="${group.name}">
                            <i class="fa-solid ${group.icon} w-5 text-center shrink-0"></i>
                            <span class="sidebar-label flex-1 text-left text-xs font-bold tracking-wide">${group.name}</span>
                            <i class="menu-chevron fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                        </button>
                        <div class="sidebar-submenu"><div class="pt-1 space-y-1">${subMenuHtml}</div></div>
                    </section>`;
            }).join('');
        }

        function renderApp() {
            if (!currentUser) {
                setAuthenticatedLayout(false);
                return;
            }
            if (!canAccessSubMenu(state.activeSubMenu)) {
                state.activeMainMenu = 'kurikulum';
                state.activeSubMenu = 'pl';
                expandedMainMenu = 'kurikulum';
            }
            renderSidebarNavigation();
            updateSidebarToggle();
            const activeGroup = navigationGroups.find(group => group.id === state.activeMainMenu);
            const pageTitle = document.getElementById('topbar-page-title');
            if (pageTitle && activeGroup) pageTitle.innerText = activeGroup.name;
            document.getElementById('topbar-user-name').innerText = currentUser.name;
            document.getElementById('topbar-user-role').innerText = ROLE_LABELS[currentUser.role] || currentUser.role;
            const contextSelect = document.getElementById('admin-context-prodi');
            const canSwitchContext = isAdministrator() || state.masterData.studyPrograms.length > 1;
            contextSelect.classList.toggle('hidden', !canSwitchContext);
            if (canSwitchContext) {
                contextSelect.innerHTML = state.masterData.studyPrograms.map(prodi => {
                    const faculty = state.masterData.faculties.find(item => item.id === prodi.facultyId);
                    return `<option value="${prodi.id}" ${prodi.id === contextProdiId ? 'selected' : ''}>${escapeHtml(faculty ? faculty.code : '-')} / ${escapeHtml(prodi.code)} - ${escapeHtml(prodi.name)}</option>`;
                }).join('');
            }

            if (state.activeSubMenu === 'matriks_mata_kuliah') {
                state.activeSubMenu = 'rps';
            }

            renderContent();
            saveState();
        }

        function renderContent() {
            const container = document.getElementById('content-area');
            
            if (state.activeSubMenu === 'accounts') renderAccountManagement(container);
            else if (state.activeSubMenu === 'master_data') renderMasterData(container);
            else if (state.activeSubMenu === 'pl') renderSetupPL(container);
            else if (state.activeSubMenu === 'cpl') renderSetupCPL(container);
            else if (state.activeSubMenu === 'matriks_cpl_pl') renderMatriksCPL_PL(container);
            else if (state.activeSubMenu === 'mk') renderSetupMK(container);
            else if (state.activeSubMenu === 'cpmk') renderSetupCPMK(container);
            
            else if (state.activeSubMenu === 'setup_perkuliahan') renderSetupPerkuliahan(container);
            else if (state.activeSubMenu === 'rps') renderSetupRPS(container);
            else if (state.activeSubMenu === 'input_nilai') renderPenilaianMahasiswa(container);
            else if (state.activeSubMenu === 'presensi') renderSetupPresensi(container);
            
            else if (state.activeSubMenu.startsWith('mon_')) renderMonitorView(container);
            applyActivePageAccess();
        }

// -------------------------------------------------------------
