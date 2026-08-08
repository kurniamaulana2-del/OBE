// MODUL PENGATURAN ADMIN
// -------------------------------------------------------------

        function getStudyProgramName(prodiId) {
            const prodi = state.masterData.studyPrograms.find(item => item.id === prodiId);
            return prodi ? prodi.name : '-';
        }

        function renderRoleOptions(selectedRole) {
            return Object.keys(ROLE_LABELS).map(role =>
                `<option value="${role}" ${role === selectedRole ? 'selected' : ''}>${ROLE_LABELS[role]}</option>`
            ).join('');
        }

        function renderFacultyOptions(selectedId, includeEmpty = true) {
            const options = state.masterData.faculties.map(faculty =>
                `<option value="${faculty.id}" ${faculty.id === selectedId ? 'selected' : ''}>${escapeHtml(faculty.code)} - ${escapeHtml(faculty.name)}</option>`
            ).join('');
            return `${includeEmpty ? '<option value="">Tidak terkait Fakultas</option>' : ''}${options}`;
        }

        function renderStudyProgramOptions(selectedId, facultyId = '', includeEmpty = true) {
            const options = state.masterData.studyPrograms
                .filter(prodi => !facultyId || prodi.facultyId === facultyId)
                .map(prodi =>
                `<option value="${prodi.id}" ${prodi.id === selectedId ? 'selected' : ''}>${escapeHtml(prodi.code)} - ${escapeHtml(prodi.name)}</option>`
                ).join('');
            return `${includeEmpty ? '<option value="">Tidak terkait Prodi</option>' : ''}${options}`;
        }

        function renderAccountManagement(container) {
            if (!isAdministrator()) {
                container.innerHTML = `<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Menu Manajemen Akun hanya tersedia untuk Administrator.</div>`;
                return;
            }

            container.innerHTML = `
                <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-users-gear mr-2 text-blue-800"></i>Manajemen Akun</h3>
                        <p class="mt-1 text-xs text-gray-500">Akun hanya dibuat oleh Administrator. Tidak tersedia registrasi mandiri.</p>
                    </div>
                    <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">${state.accounts.length} akun</span>
                </div>

                <form onsubmit="createAccount(event)" class="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <h4 class="mb-3 text-sm font-bold text-blue-950">Buat Akun Baru</h4>
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
                        <div><label class="mb-1 block text-xs font-semibold">Username</label><input id="account-new-username" required minlength="3" class="w-full rounded border px-3 py-2 text-sm" placeholder="nama.pengguna"></div>
                        <div><label class="mb-1 block text-xs font-semibold">Nama Lengkap</label><input id="account-new-name" required class="w-full rounded border px-3 py-2 text-sm" placeholder="Nama lengkap"></div>
                        <div><label class="mb-1 block text-xs font-semibold">NUPTK</label><input id="account-new-nuptk" class="w-full rounded border px-3 py-2 text-sm" placeholder="Nomor NUPTK"></div>
                        <div><label class="mb-1 block text-xs font-semibold">Role</label><select id="account-new-role" onchange="toggleNewAccountTenant()" class="w-full rounded border bg-white px-3 py-2 text-sm">${renderRoleOptions('dosen')}</select></div>
                        <div><label class="mb-1 block text-xs font-semibold">Fakultas</label><select id="account-new-faculty" required onchange="updateNewAccountProgramOptions()" class="w-full rounded border bg-white px-3 py-2 text-sm">${renderFacultyOptions('', false)}</select></div>
                        <div><label class="mb-1 block text-xs font-semibold">Program Studi</label><select id="account-new-prodi" required class="w-full rounded border bg-white px-3 py-2 text-sm"></select></div>
                        <div><label class="mb-1 block text-xs font-semibold">Kata Sandi Awal</label><input id="account-new-password" type="password" required minlength="8" class="w-full rounded border px-3 py-2 text-sm" placeholder="Minimal 8 karakter"></div>
                    </div>
                    <div class="mt-3 flex justify-end"><button type="submit" class="rounded bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"><i class="fa-solid fa-user-plus mr-1"></i>Buat Akun</button></div>
                </form>

                <div class="overflow-x-auto rounded-lg border border-gray-200">
                    <table class="w-full min-w-[1500px] text-left text-xs">
                        <thead class="bg-blue-950 text-white">
                            <tr><th class="p-3">Username</th><th class="p-3">Nama</th><th class="p-3">NUPTK</th><th class="p-3">Role</th><th class="p-3">Fakultas</th><th class="p-3">Program Studi</th><th class="p-3 text-center">Status</th><th class="p-3 text-center">Aksi</th></tr>
                        </thead>
                        <tbody>
                            ${state.accounts.map(account => {
                                const isSelf = account.id === currentUser.id;
                                return `
                                    <tr class="border-b hover:bg-gray-50">
                                        <td class="p-2"><input value="${escapeHtml(account.username)}" onchange="updateAccount('${account.id}', 'username', this.value)" class="w-full rounded border px-2 py-1.5 font-mono"></td>
                                        <td class="p-2"><input value="${escapeHtml(account.name)}" onchange="updateAccount('${account.id}', 'name', this.value)" class="w-full rounded border px-2 py-1.5"></td>
                                        <td class="p-2"><input value="${escapeHtml(account.nuptk || '')}" onchange="updateAccount('${account.id}', 'nuptk', this.value)" class="w-full rounded border px-2 py-1.5"></td>
                                        <td class="p-2">
                                            <button onclick="openAccountPermissionModal('${account.id}')" class="flex w-full items-center justify-between gap-2 rounded border bg-white px-2 py-1.5 text-left hover:border-blue-400 hover:bg-blue-50" title="Atur role dan matriks akses">
                                                <span><strong>${escapeHtml(ROLE_LABELS[account.role])}</strong>${accountPermissionMode(account) === 'custom' ? '<br><span class="text-[10px] text-indigo-600">Akses custom</span>' : ''}</span>
                                                <i class="fa-solid ${account.permissionsLocked ? 'fa-lock text-red-600' : 'fa-table-list text-blue-700'}"></i>
                                            </button>
                                        </td>
                                        <td class="p-2"><select onchange="updateAccountFaculty('${account.id}', this.value)" ${account.role === 'administrator' ? 'disabled' : ''} class="w-full rounded border bg-white px-2 py-1.5">${renderFacultyOptions(account.facultyId)}</select></td>
                                        <td class="p-2"><select onchange="updateAccount('${account.id}', 'prodiId', this.value)" ${account.role === 'administrator' ? 'disabled' : ''} class="w-full rounded border bg-white px-2 py-1.5">${renderStudyProgramOptions(account.prodiId, account.facultyId)}</select></td>
                                        <td class="p-2 text-center"><label class="inline-flex items-center gap-2"><input type="checkbox" ${account.active ? 'checked' : ''} ${isSelf ? 'disabled title="Akun aktif tidak dapat dinonaktifkan."' : ''} onchange="updateAccount('${account.id}', 'active', this.checked)" class="h-4 w-4"><span>${account.active ? 'Aktif' : 'Nonaktif'}</span></label></td>
                                        <td class="p-2"><div class="flex justify-center gap-2">
                                            <button onclick="openResetPasswordModal('${account.id}')" class="rounded bg-amber-100 px-2 py-1.5 font-semibold text-amber-800 hover:bg-amber-200" title="Atur ulang kata sandi"><i class="fa-solid fa-key"></i></button>
                                            <button onclick="deleteAccount('${account.id}')" ${isSelf ? 'disabled title="Akun aktif tidak dapat dihapus."' : ''} class="rounded bg-red-100 px-2 py-1.5 font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40" title="Hapus akun"><i class="fa-solid fa-trash"></i></button>
                                        </div></td>
                                    </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
            toggleNewAccountTenant();
        }

        function toggleNewAccountTenant() {
            const roleInput = document.getElementById('account-new-role');
            const facultyInput = document.getElementById('account-new-faculty');
            const prodiInput = document.getElementById('account-new-prodi');
            if (!roleInput || !facultyInput || !prodiInput) return;
            const requiresProdi = roleInput.value !== 'administrator';
            facultyInput.disabled = !requiresProdi;
            facultyInput.required = requiresProdi;
            prodiInput.disabled = !requiresProdi;
            prodiInput.required = requiresProdi;
            if (!requiresProdi) {
                facultyInput.value = '';
                prodiInput.innerHTML = '<option value="">Tidak terkait Prodi</option>';
            } else {
                if (!facultyInput.value && state.masterData.faculties[0]) facultyInput.value = state.masterData.faculties[0].id;
                updateNewAccountProgramOptions();
            }
        }

        function updateNewAccountProgramOptions() {
            const facultyInput = document.getElementById('account-new-faculty');
            const prodiInput = document.getElementById('account-new-prodi');
            if (!facultyInput || !prodiInput) return;
            prodiInput.innerHTML = renderStudyProgramOptions('', facultyInput.value, false);
        }

        async function createAccount(event) {
            event.preventDefault();
            if (!isAdministrator()) return;
            const username = document.getElementById('account-new-username').value.trim().toLowerCase();
            const name = document.getElementById('account-new-name').value.trim();
            const nuptk = document.getElementById('account-new-nuptk').value.trim();
            const role = document.getElementById('account-new-role').value;
            const facultyId = document.getElementById('account-new-faculty').value;
            const prodiId = document.getElementById('account-new-prodi').value;
            const password = document.getElementById('account-new-password').value;
            if (!/^[a-z0-9._-]{3,}$/.test(username)) {
                alert('Username minimal 3 karakter dan hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung.');
                return;
            }
            if (state.accounts.some(account => account.username.toLowerCase() === username)) {
                alert('Username sudah digunakan.');
                return;
            }
            if (password.length < 8) {
                alert('Kata sandi minimal 8 karakter.');
                return;
            }
            if (role !== 'administrator' && (!facultyId || !prodiId)) {
                alert('Pilih Fakultas dan Program Studi untuk akun ini.');
                return;
            }
            try {
                const result = await apiRequest('/accounts', {
                    method: 'POST',
                    body: { username, password, name, nuptk, role, facultyId, prodiId, permissions: ROLE_MENU_PERMISSIONS[role] }
                });
                state.accounts.push(result.account);
                renderApp();
            } catch (error) {
                alert(`Akun gagal dibuat: ${error.message}`);
            }
        }

        async function updateAccount(accountId, field, value) {
            if (!isAdministrator()) return;
            const account = state.accounts.find(item => item.id === accountId);
            if (!account) return;
            if (account.id === currentUser.id && ['role', 'active'].includes(field)) {
                alert('Role atau status akun yang sedang digunakan tidak dapat diubah.');
                renderApp();
                return;
            }
            if (field === 'username') {
                value = value.trim().toLowerCase();
                if (!/^[a-z0-9._-]{3,}$/.test(value) || state.accounts.some(item => item.id !== accountId && item.username.toLowerCase() === value)) {
                    alert('Username tidak valid atau sudah digunakan.');
                    renderApp();
                    return;
                }
            }
            if (field === 'name') {
                value = value.trim();
                if (!value) {
                    alert('Nama tidak boleh kosong.');
                    renderApp();
                    return;
                }
            }
            if (field === 'prodiId' && account.role !== 'administrator' && !value) {
                alert('Program Studi wajib dipilih untuk role ini.');
                renderApp();
                return;
            }
            const patch = { [field]: value };
            if (field === 'role') {
                patch.permissions = ROLE_MENU_PERMISSIONS[value];
                if (value === 'administrator') {
                    patch.facultyId = null;
                    patch.prodiId = null;
                } else if (!account.prodiId) {
                    const firstProgram = state.masterData.studyPrograms[0];
                    patch.facultyId = firstProgram ? firstProgram.facultyId : null;
                    patch.prodiId = firstProgram ? firstProgram.id : null;
                }
            }
            try {
                const result = await apiRequest(`/accounts/${accountId}`, { method: 'PATCH', body: patch });
                state.accounts[state.accounts.findIndex(item => item.id === accountId)] = result.account;
                if (currentUser.id === accountId) currentUser = result.account;
                renderApp();
            } catch (error) {
                alert(`Akun gagal diperbarui: ${error.message}`);
                renderApp();
            }
        }

        async function updateAccountFaculty(accountId, facultyId) {
            const account = state.accounts.find(item => item.id === accountId);
            if (!account) return;
            const firstProgram = state.masterData.studyPrograms.find(prodi => prodi.facultyId === facultyId);
            if (!firstProgram) return alert('Fakultas ini belum memiliki Program Studi.');
            try {
                const result = await apiRequest(`/accounts/${accountId}`, {
                    method: 'PATCH',
                    body: { facultyId, prodiId: firstProgram.id }
                });
                state.accounts[state.accounts.findIndex(item => item.id === accountId)] = result.account;
                renderApp();
            } catch (error) {
                alert(`Fakultas akun gagal diperbarui: ${error.message}`);
                renderApp();
            }
        }

        function accountPermissionMode(account) {
            const selected = [...(account.permissions || [])].sort();
            const preset = [...(ROLE_MENU_PERMISSIONS[account.role] || [])].sort();
            return JSON.stringify(selected) === JSON.stringify(preset) ? account.role : 'custom';
        }

        function openAccountPermissionModal(accountId) {
            const account = state.accounts.find(item => item.id === accountId);
            if (!account || !isAdministrator()) return;
            const permissions = new Set(account.permissions || ROLE_MENU_PERMISSIONS[account.role] || []);
            const isSelf = account.id === currentUser.id;
            const accessMode = accountPermissionMode(account) === 'custom' ? 'custom' : 'preset';
            document.getElementById('app-modal-root').innerHTML = `
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onsubmit="saveAccountPermissions(event, '${accountId}', false)" class="w-full max-w-3xl rounded-xl bg-white p-5 shadow-2xl">
                        <div class="mb-4 flex items-center justify-between">
                            <div><h3 class="font-bold text-gray-900">Role & Matriks Hak Akses</h3><p class="text-xs text-gray-500">${escapeHtml(account.name)}</p></div>
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="text-gray-500"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="mb-3 grid grid-cols-1 gap-3 rounded bg-blue-50 p-3 sm:grid-cols-2">
                            <label class="text-xs font-bold">Role
                                <select id="account-permission-role" onchange="handleModalRoleChange(this.value)" ${account.permissionsLocked || isSelf ? 'disabled' : ''} class="mt-1 w-full rounded border bg-white px-3 py-1.5 text-xs font-normal">
                                    ${renderRoleOptions(account.role)}
                                </select>
                            </label>
                            <label class="text-xs font-bold">Skema Akses
                                <select id="account-permission-mode" onchange="handlePermissionModeChange(this.value)" ${account.permissionsLocked ? 'disabled' : ''} class="mt-1 w-full rounded border bg-white px-3 py-1.5 text-xs font-normal">
                                    <option value="preset" ${accessMode === 'preset' ? 'selected' : ''}>Preset sesuai Role</option>
                                    <option value="custom" ${accessMode === 'custom' ? 'selected' : ''}>Custom</option>
                                </select>
                            </label>
                            <span class="ml-auto text-xs font-semibold ${account.permissionsLocked ? 'text-red-700' : 'text-emerald-700'}"><i class="fa-solid ${account.permissionsLocked ? 'fa-lock' : 'fa-lock-open'} mr-1"></i>${account.permissionsLocked ? 'Terkunci' : 'Terbuka'}</span>
                        </div>
                        <div class="max-h-[55vh] overflow-auto rounded border">
                            <table class="w-full text-xs"><thead class="sticky top-0 bg-blue-950 text-white"><tr><th class="p-2 text-left">Kelompok</th><th class="p-2 text-left">Menu</th><th class="p-2 text-center">Diizinkan</th></tr></thead>
                            <tbody>${navigationGroups.flatMap(group => group.subMenus.map(menu => `<tr class="border-b"><td class="p-2 font-semibold">${escapeHtml(group.name)}</td><td class="p-2">${escapeHtml(menu.name)}</td><td class="p-2 text-center"><input type="checkbox" name="menu-permission" value="${menu.id}" ${permissions.has(menu.id) ? 'checked' : ''} ${account.permissionsLocked ? 'disabled' : ''} onchange="markPermissionCustom()" class="h-4 w-4"></td></tr>`)).join('')}</tbody></table>
                        </div>
                        <div class="mt-4 flex justify-end gap-2">
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="rounded border px-3 py-2 text-xs font-semibold">Batal</button>
                            ${account.permissionsLocked
                                ? `<button type="button" onclick="unlockAccountPermissions('${accountId}')" class="rounded bg-amber-600 px-3 py-2 text-xs font-bold text-white"><i class="fa-solid fa-lock-open mr-1"></i>Buka Kunci</button>`
                                : `<button type="submit" class="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white"><i class="fa-solid fa-floppy-disk mr-1"></i>Simpan</button>
                                   <button type="button" onclick="saveAccountPermissions(event, '${accountId}', true)" class="rounded bg-red-700 px-3 py-2 text-xs font-bold text-white"><i class="fa-solid fa-lock mr-1"></i>Simpan & Kunci</button>`}
                        </div>
                    </form>
                </div>`;
        }

        function applyPermissionPreset(role) {
            const allowed = new Set(ROLE_MENU_PERMISSIONS[role] || []);
            document.querySelectorAll('input[name="menu-permission"]').forEach(input => { input.checked = allowed.has(input.value); });
        }

        function handleModalRoleChange(role) {
            const mode = document.getElementById('account-permission-mode');
            if (mode && mode.value === 'preset') applyPermissionPreset(role);
        }

        function handlePermissionModeChange(mode) {
            const role = document.getElementById('account-permission-role');
            if (mode === 'preset' && role) applyPermissionPreset(role.value);
        }

        function markPermissionCustom() {
            const mode = document.getElementById('account-permission-mode');
            if (mode) mode.value = 'custom';
        }

        async function saveAccountPermissions(event, accountId, lockAfterSave) {
            event.preventDefault();
            const account = state.accounts.find(item => item.id === accountId);
            const roleInput = document.getElementById('account-permission-role');
            if (!account || !roleInput) return;
            const role = roleInput.value;
            const permissions = Array.from(document.querySelectorAll('input[name="menu-permission"]:checked')).map(input => input.value);
            const firstProgram = state.masterData.studyPrograms[0];
            const tenant = role === 'administrator'
                ? { facultyId: null, prodiId: null }
                : {
                    facultyId: account.facultyId || (firstProgram && firstProgram.facultyId),
                    prodiId: account.prodiId || (firstProgram && firstProgram.id)
                };
            try {
                const result = await apiRequest(`/accounts/${accountId}`, {
                    method: 'PATCH',
                    body: { role, permissions, permissionsLocked: lockAfterSave, ...tenant }
                });
                state.accounts[state.accounts.findIndex(item => item.id === accountId)] = result.account;
                if (currentUser.id === accountId) currentUser = result.account;
                document.getElementById('app-modal-root').innerHTML = '';
                renderApp();
            } catch (error) {
                alert(`Hak akses gagal disimpan: ${error.message}`);
            }
        }

        async function unlockAccountPermissions(accountId) {
            try {
                const result = await apiRequest(`/accounts/${accountId}`, { method: 'PATCH', body: { permissionsLocked: false } });
                state.accounts[state.accounts.findIndex(item => item.id === accountId)] = result.account;
                if (currentUser.id === accountId) currentUser = result.account;
                openAccountPermissionModal(accountId);
            } catch (error) {
                alert(`Hak akses gagal dibuka: ${error.message}`);
            }
        }

        function openResetPasswordModal(accountId) {
            if (!isAdministrator()) return;
            const account = state.accounts.find(item => item.id === accountId);
            if (!account) return;
            document.getElementById('app-modal-root').innerHTML = `
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onsubmit="submitPasswordReset(event, '${accountId}')" class="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
                        <div class="mb-4 flex items-center justify-between">
                            <div><h3 class="font-bold text-gray-900">Atur Ulang Kata Sandi</h3><p class="text-xs text-gray-500">${escapeHtml(account.username)} - ${escapeHtml(account.name)}</p></div>
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="text-gray-500"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <label class="mb-1 block text-xs font-semibold">Kata Sandi Baru</label>
                        <input name="password" type="password" required minlength="8" autocomplete="new-password" class="w-full rounded border px-3 py-2 text-sm" placeholder="Minimal 8 karakter">
                        <label class="mb-1 mt-3 block text-xs font-semibold">Konfirmasi Kata Sandi</label>
                        <input name="confirmation" type="password" required minlength="8" autocomplete="new-password" class="w-full rounded border px-3 py-2 text-sm">
                        <div class="mt-4 flex justify-end gap-2">
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="rounded border px-3 py-2 text-xs font-semibold">Batal</button>
                            <button type="submit" class="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white">Simpan Kata Sandi</button>
                        </div>
                    </form>
                </div>`;
        }

        async function submitPasswordReset(event, accountId) {
            event.preventDefault();
            const form = event.currentTarget;
            const password = form.elements.password.value;
            const confirmation = form.elements.confirmation.value;
            if (password !== confirmation) return alert('Konfirmasi kata sandi tidak sama.');
            try {
                await apiRequest(`/accounts/${accountId}/reset-password`, { method: 'POST', body: { password } });
                document.getElementById('app-modal-root').innerHTML = '';
                alert('Kata sandi berhasil diperbarui.');
            } catch (error) {
                alert(`Kata sandi gagal diperbarui: ${error.message}`);
            }
        }

        async function deleteAccount(accountId) {
            if (!isAdministrator()) return;
            const account = state.accounts.find(item => item.id === accountId);
            if (!account || account.id === currentUser.id) return;
            if (account.role === 'administrator' && state.accounts.filter(item => item.role === 'administrator').length <= 1) {
                alert('Minimal satu akun Administrator harus tersedia.');
                return;
            }
            const assignedClass = Object.values(state.classData).some(cls => (cls.lecturerIds || []).includes(accountId));
            if (assignedClass) {
                alert('Akun masih diplot sebagai dosen pengampu. Hapus plotting kelas terlebih dahulu.');
                return;
            }
            if (!confirm(`Hapus akun ${account.username}?`)) return;
            try {
                await apiRequest(`/accounts/${accountId}`, { method: 'DELETE' });
                state.accounts = state.accounts.filter(item => item.id !== accountId);
                renderApp();
            } catch (error) {
                alert(`Akun gagal dihapus: ${error.message}`);
            }
        }

        function renderMasterData(container) {
            const canEdit = isAdministrator();
            const faculties = state.masterData.faculties;
            const programs = state.masterData.studyPrograms;
            const years = state.masterData.academicYears;
            const statusBadge = active => `<span class="rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}">${active ? 'Aktif' : 'Nonaktif'}</span>`;

            container.innerHTML = `
                <div class="mb-5">
                    <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-database mr-2 text-blue-800"></i>Data Master</h3>
                    <p class="mt-1 text-xs text-gray-500">Fakultas, Program Studi, dan Tahun Akademik.</p>
                </div>
                <div class="space-y-6">
                    <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h4 class="mb-3 font-bold text-gray-800">Fakultas</h4>
                        ${canEdit ? `<form onsubmit="createMasterItem(event, 'faculties')" class="mb-3 grid grid-cols-1 gap-2 rounded-lg bg-blue-50 p-3 sm:grid-cols-[140px_1fr_auto]">
                            <input name="code" required placeholder="Kode Fakultas" class="rounded border px-2 py-1.5 text-xs">
                            <input name="name" required placeholder="Nama Fakultas" class="rounded border px-2 py-1.5 text-xs">
                            <button type="submit" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-bold text-white"><i class="fa-solid fa-plus mr-1"></i>Tambah</button>
                        </form>` : ''}
                        <div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="p-2 text-left">Kode</th><th class="p-2 text-left">Nama Fakultas</th><th class="p-2 text-center">Status</th><th class="p-2 text-center">Aksi</th></tr></thead><tbody>
                            ${faculties.map(item => `<tr class="border-b"><td class="p-2"><input value="${escapeHtml(item.code)}" onchange="updateMasterItem('faculties','${item.id}','code',this.value)" class="w-full rounded border px-2 py-1.5"></td><td class="p-2"><input value="${escapeHtml(item.name)}" onchange="updateMasterItem('faculties','${item.id}','name',this.value)" class="w-full rounded border px-2 py-1.5"></td><td class="p-2 text-center"><button onclick="updateMasterItem('faculties','${item.id}','active',${!item.active})">${statusBadge(item.active)}</button></td><td class="p-2 text-center">${canEdit ? `<button onclick="deleteMasterItem('faculties','${item.id}')" class="text-red-700"><i class="fa-solid fa-trash"></i></button>` : '-'}</td></tr>`).join('') || '<tr><td colspan="4" class="p-3 text-center text-gray-500">Belum ada data.</td></tr>'}
                        </tbody></table></div>
                    </section>

                    <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h4 class="mb-3 font-bold text-gray-800">Program Studi</h4>
                        ${canEdit ? `<form onsubmit="createMasterItem(event, 'studyPrograms')" class="mb-3 grid grid-cols-1 gap-2 rounded-lg bg-blue-50 p-3 md:grid-cols-[120px_1fr_1fr_auto]">
                            <input name="code" required placeholder="Kode Prodi" class="rounded border px-2 py-1.5 text-xs">
                            <input name="name" required placeholder="Nama Program Studi" class="rounded border px-2 py-1.5 text-xs">
                            <select name="facultyId" required class="rounded border bg-white px-2 py-1.5 text-xs"><option value="">Pilih Fakultas</option>${faculties.map(faculty => `<option value="${faculty.id}">${escapeHtml(faculty.name)}</option>`).join('')}</select>
                            <button type="submit" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-bold text-white"><i class="fa-solid fa-plus mr-1"></i>Tambah</button>
                        </form>` : ''}
                        <div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="p-2 text-left">Kode</th><th class="p-2 text-left">Nama Prodi</th><th class="p-2 text-left">Fakultas</th><th class="p-2 text-center">Status</th><th class="p-2 text-center">Aksi</th></tr></thead><tbody>
                            ${programs.map(item => `<tr class="border-b"><td class="p-2"><input value="${escapeHtml(item.code)}" onchange="updateMasterItem('studyPrograms','${item.id}','code',this.value)" class="w-full rounded border px-2 py-1.5"></td><td class="p-2"><input value="${escapeHtml(item.name)}" onchange="updateMasterItem('studyPrograms','${item.id}','name',this.value)" class="w-full rounded border px-2 py-1.5"></td><td class="p-2"><select onchange="updateMasterItem('studyPrograms','${item.id}','facultyId',this.value)" class="w-full rounded border bg-white px-2 py-1.5">${faculties.map(faculty => `<option value="${faculty.id}" ${faculty.id === item.facultyId ? 'selected' : ''}>${escapeHtml(faculty.name)}</option>`).join('')}</select></td><td class="p-2 text-center"><button onclick="updateMasterItem('studyPrograms','${item.id}','active',${!item.active})">${statusBadge(item.active)}</button></td><td class="p-2 text-center">${canEdit ? `<button onclick="deleteMasterItem('studyPrograms','${item.id}')" class="text-red-700"><i class="fa-solid fa-trash"></i></button>` : '-'}</td></tr>`).join('') || '<tr><td colspan="5" class="p-3 text-center text-gray-500">Belum ada data.</td></tr>'}
                        </tbody></table></div>
                    </section>

                    <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h4 class="mb-3 font-bold text-gray-800">Tahun Akademik</h4>
                        ${canEdit ? `<form onsubmit="createMasterItem(event, 'academicYears')" class="mb-3 grid grid-cols-1 gap-2 rounded-lg bg-blue-50 p-3 sm:grid-cols-[1fr_150px_auto]">
                            <input name="code" required pattern="[0-9]{4}/[0-9]{4}" placeholder="Contoh: 2026/2027" class="rounded border px-2 py-1.5 text-xs">
                            <select name="term" class="rounded border bg-white px-2 py-1.5 text-xs"><option>Ganjil</option><option>Genap</option><option>Pendek</option></select>
                            <button type="submit" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-bold text-white"><i class="fa-solid fa-plus mr-1"></i>Tambah</button>
                        </form>` : ''}
                        <div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="p-2 text-left">Tahun Akademik</th><th class="p-2 text-left">Semester</th><th class="p-2 text-center">Status</th><th class="p-2 text-center">Aksi</th></tr></thead><tbody>
                            ${years.map(item => `<tr class="border-b"><td class="p-2"><input value="${escapeHtml(item.code)}" onchange="updateMasterItem('academicYears','${item.id}','code',this.value)" class="w-full rounded border px-2 py-1.5"></td><td class="p-2"><select onchange="updateMasterItem('academicYears','${item.id}','term',this.value)" class="w-full rounded border bg-white px-2 py-1.5"><option ${item.term === 'Ganjil' ? 'selected' : ''}>Ganjil</option><option ${item.term === 'Genap' ? 'selected' : ''}>Genap</option><option ${item.term === 'Pendek' ? 'selected' : ''}>Pendek</option></select></td><td class="p-2 text-center"><button onclick="updateMasterItem('academicYears','${item.id}','active',${!item.active})">${statusBadge(item.active)}</button></td><td class="p-2 text-center">${canEdit ? `<button onclick="deleteMasterItem('academicYears','${item.id}')" class="text-red-700"><i class="fa-solid fa-trash"></i></button>` : '-'}</td></tr>`).join('') || '<tr><td colspan="4" class="p-3 text-center text-gray-500">Belum ada data.</td></tr>'}
                        </tbody></table></div>
                    </section>
                </div>`;
        }

        function updateMasterYearProgramOptions() {
            const facultyId = document.getElementById('master-year-faculty').value;
            document.getElementById('master-year-prodi').innerHTML = `<option value="">Pilih Program Studi</option>${renderStudyProgramOptions('', facultyId, false)}`;
        }

        async function createMasterItem(event, collectionName) {
            event.preventDefault();
            if (!isAdministrator()) {
                alert('Hanya Administrator yang dapat menambah Data Master.');
                return;
            }
            const formData = new FormData(event.currentTarget);
            const code = (formData.get('code') || '').toString().trim();
            const collection = state.masterData[collectionName];
            if (!collection || !code) {
                alert('Data wajib diisi.');
                return;
            }
            if (collectionName !== 'academicYears' && collection.some(item => item.code.toLowerCase() === code.toLowerCase())) {
                alert('Kode tersebut sudah digunakan.');
                return;
            }

            let requestPath;
            let requestBody;
            if (collectionName === 'faculties') {
                const name = (formData.get('name') || '').toString().trim();
                if (!name) return alert('Nama Fakultas wajib diisi.');
                requestPath = '/master/faculties';
                requestBody = { code, name };
            } else if (collectionName === 'studyPrograms') {
                const name = (formData.get('name') || '').toString().trim();
                const facultyId = (formData.get('facultyId') || '').toString();
                if (!name || !state.masterData.faculties.some(faculty => faculty.id === facultyId)) {
                    return alert('Nama Program Studi dan Fakultas wajib dipilih.');
                }
                requestPath = '/master/study-programs';
                requestBody = { code, name, facultyId };
            } else if (collectionName === 'academicYears') {
                if (!/^\d{4}\/\d{4}$/.test(code)) return alert('Format Tahun Akademik harus YYYY/YYYY.');
                requestPath = '/master/academic-years';
                requestBody = { code, term: (formData.get('term') || 'Ganjil').toString() };
            } else {
                alert('Jenis Data Master tidak valid.');
                return;
            }
            try {
                const result = await apiRequest(requestPath, { method: 'POST', body: requestBody });
                collection.push(result.item);
                renderApp();
            } catch (error) {
                alert(`Data Master gagal ditambahkan: ${error.message}`);
            }
        }

        function getMasterApiType(collectionName) {
            return { faculties: 'faculties', studyPrograms: 'study-programs', academicYears: 'academic-years' }[collectionName];
        }

        async function updateMasterItem(collectionName, itemId, field, value) {
            if (!isAdministrator()) return;
            const collection = state.masterData[collectionName];
            const item = collection && collection.find(entry => entry.id === itemId);
            if (!item) return;
            if (typeof value === 'string') value = value.trim();
            if ((field === 'code' || field === 'name') && !value) {
                alert('Nilai tidak boleh kosong.');
                renderApp();
                return;
            }
            try {
                await apiRequest(`/master/${getMasterApiType(collectionName)}/${itemId}`, {
                    method: 'PATCH',
                    body: { [field]: value }
                });
                item[field] = value;
                renderApp();
            } catch (error) {
                alert(`Data Master gagal diperbarui: ${error.message}`);
                renderApp();
            }
        }

        async function updateAcademicYearFaculty(itemId, facultyId) {
            const item = state.masterData.academicYears.find(year => year.id === itemId);
            const firstProgram = state.masterData.studyPrograms.find(prodi => prodi.facultyId === facultyId);
            if (!item || !firstProgram) return alert('Fakultas ini belum memiliki Program Studi.');
            try {
                await apiRequest(`/master/academic-years/${itemId}`, {
                    method: 'PATCH',
                    body: { facultyId, prodiId: firstProgram.id }
                });
                item.facultyId = facultyId;
                item.prodiId = firstProgram.id;
                renderApp();
            } catch (error) {
                alert(`Tahun Akademik gagal dipindahkan: ${error.message}`);
                renderApp();
            }
        }

        async function deleteMasterItem(collectionName, itemId) {
            if (!isAdministrator()) return;
            if (collectionName === 'faculties' && state.masterData.studyPrograms.some(item => item.facultyId === itemId)) {
                alert('Fakultas masih digunakan oleh Program Studi.');
                return;
            }
            if (collectionName === 'studyPrograms' && state.accounts.some(account => account.prodiId === itemId)) {
                alert('Program Studi masih digunakan oleh akun pengguna.');
                return;
            }
            if (!confirm('Hapus data master ini?')) return;
            try {
                await apiRequest(`/master/${getMasterApiType(collectionName)}/${itemId}`, { method: 'DELETE' });
                state.masterData[collectionName] = state.masterData[collectionName].filter(item => item.id !== itemId);
                renderApp();
            } catch (error) {
                alert(`Data Master gagal dihapus: ${error.message}`);
            }
        }

// -------------------------------------------------------------
