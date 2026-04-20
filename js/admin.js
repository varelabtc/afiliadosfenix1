// ========================================
// FENIX AFILIADOS - ADMIN JAVASCRIPT
// ========================================

// Admin Authentication
const AdminAuth = {
    currentAdmin: null,

    init() {
        try {
            const adminData = localStorage.getItem('fenix_currentAdmin');
            if (adminData) {
                this.currentAdmin = JSON.parse(adminData);
            }
        } catch(e) {
            this.currentAdmin = null;
        }
    },

    async login(email, password) {
        var admin = await SupabaseDB.getAdminByEmail(email);
        if (admin && admin.password === password) {
            var adminData = {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            };
            this.currentAdmin = adminData;
            localStorage.setItem('fenix_currentAdmin', JSON.stringify(adminData));
            return { success: true, admin: adminData };
        }
        return { success: false, message: 'Credenciais inválidas' };
    },

    logout() {
        this.currentAdmin = null;
        localStorage.removeItem('fenix_currentAdmin');
        if (window.location.pathname.includes('/admin/')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    },

    isAuthenticated() {
        if (!this.currentAdmin) {
            try {
                const adminData = localStorage.getItem('fenix_currentAdmin');
                if (adminData) {
                    this.currentAdmin = JSON.parse(adminData);
                }
            } catch(e) {
                return false;
            }
        }
        return !!this.currentAdmin;
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            if (window.location.pathname.includes('/admin/')) {
                window.location.href = '../index.html';
            } else {
                window.location.href = 'index.html';
            }
            return false;
        }
        return true;
    }
};

// Casas de Apostas / Betting Houses
const BettingHouses = {
    getAll() {
        const defaults = [
            {
                id: 1,
                name: 'Superbet',
                slug: 'superbet',
                logo: '🎰',
                color: '#FFD700',
                baseUrl: 'https://superbet.com',
                cpa: 150.00,
                revShare: 30,
                minDeposit: 20.00,
                status: 'active',
                totalAffiliates: 45,
                totalClicks: 12500,
                totalConversions: 320,
                totalPaid: 48000.00
            },
            {
                id: 2,
                name: 'Sportingbet',
                slug: 'sportingbet',
                logo: '⚽',
                color: '#00A651',
                baseUrl: 'https://sportingbet.com',
                cpa: 180.00,
                revShare: 25,
                minDeposit: 30.00,
                status: 'active',
                totalAffiliates: 38,
                totalClicks: 9800,
                totalConversions: 245,
                totalPaid: 29400.00
            },
            {
                id: 3,
                name: 'Estrelabet',
                slug: 'estrelabet',
                logo: '⭐',
                color: '#1a2744',
                baseUrl: 'https://estrelabet.com',
                cpa: 110.00,
                revShare: 0,
                minDeposit: 50.00,
                status: 'active',
                totalAffiliates: 0,
                totalClicks: 0,
                totalConversions: 0,
                totalPaid: 0
            },
            {
                id: 4,
                name: 'VUPI',
                slug: 'vupi',
                logo: '🟣',
                color: '#2d1b69',
                baseUrl: 'https://vupi.com',
                cpa: 80.00,
                revShare: 0,
                minDeposit: 50.00,
                status: 'active',
                totalAffiliates: 0,
                totalClicks: 0,
                totalConversions: 0,
                totalPaid: 0
            },
            {
                id: 5,
                name: 'Blaze',
                slug: 'blaze',
                logo: '🔥',
                color: '#E53935',
                baseUrl: 'https://blaze.com',
                cpa: 150.00,
                revShare: 0,
                minDeposit: 20.00,
                status: 'active',
                totalAffiliates: 0,
                totalClicks: 0,
                totalConversions: 0,
                totalPaid: 0
            },
            {
                id: 6,
                name: 'Jonbet',
                slug: 'jonbet',
                logo: '🎯',
                color: '#1E90FF',
                baseUrl: 'https://jonbet.com',
                cpa: 150.00,
                revShare: 0,
                minDeposit: 20.00,
                status: 'active',
                totalAffiliates: 0,
                totalClicks: 0,
                totalConversions: 0,
                totalPaid: 0
            },
            {
                id: 7,
                name: 'Lottu.bet',
                slug: 'lottubet',
                logo: '🎲',
                color: '#F59E0B',
                baseUrl: 'https://lottu.bet',
                cpa: 100.00,
                revShare: 0,
                minDeposit: 20.00,
                status: 'active',
                totalAffiliates: 0,
                totalClicks: 0,
                totalConversions: 0,
                totalPaid: 0
            }
        ];

        var stored = Storage.get('bettingHouses');
        if (!stored || stored.length < defaults.length) {
            Storage.set('bettingHouses', defaults);
            stored = defaults;
        }

        return stored;
    },

    getById(id) {
        return this.getAll().find(h => h.id === id);
    },

    update(id, data) {
        const houses = this.getAll();
        const index = houses.findIndex(h => h.id === id);
        if (index !== -1) {
            houses[index] = { ...houses[index], ...data };
            Storage.set('bettingHouses', houses);
            return houses[index];
        }
        return null;
    },

    add(data) {
        const houses = this.getAll();
        const newHouse = {
            id: Date.now(),
            ...data,
            totalAffiliates: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalPaid: 0,
            status: 'active'
        };
        houses.push(newHouse);
        Storage.set('bettingHouses', houses);
        return newHouse;
    }
};

// Affiliate Management (Admin) - Supabase
const AffiliateManager = {
    _cache: null,
    _cacheTime: 0,

    async fetchAll() {
        this._cache = await SupabaseDB.getUsers();
        this._cacheTime = Date.now();
        return this._cache;
    },

    getAll() {
        // Return cached data synchronously for rendering
        return this._cache || [];
    },

    getPending() {
        return this.getAll().filter(u => u.status === 'pending');
    },

    getApproved() {
        return this.getAll().filter(u => u.status === 'approved');
    },

    getRejected() {
        return this.getAll().filter(u => u.status === 'rejected');
    },

    async approve(userId) {
        var result = await SupabaseDB.updateUser(userId, {
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: AdminAuth.currentAdmin?.id
        });
        if (!result.error) await this.fetchAll();
        return !result.error;
    },

    async reject(userId, reason) {
        var result = await SupabaseDB.updateUser(userId, { status: 'rejected' });
        if (!result.error) await this.fetchAll();
        return !result.error;
    },

    async block(userId) {
        var result = await SupabaseDB.updateUser(userId, { status: 'blocked' });
        if (!result.error) await this.fetchAll();
        return !result.error;
    },

    async unblock(userId) {
        var result = await SupabaseDB.updateUser(userId, { status: 'approved' });
        if (!result.error) await this.fetchAll();
        return !result.error;
    },

    getStats(userId) {
        var user = this.getAll().find(u => u.id === userId);
        return {
            totalLinks: 0,
            totalClicks: user ? (user.total_clicks || 0) : 0,
            totalConversions: user ? (user.total_conversions || 0) : 0,
            totalEarnings: user ? parseFloat(user.total_earnings || 0) : 0
        };
    },

    getDeal(userId, houseId) {
        var house = BettingHouses.getById(houseId);
        return {
            type: 'cpa',
            cpaValue: house?.cpa || 0,
            revShare: house?.revShare || 25,
            hybridCPA: 0,
            hybridRevShare: 0
        };
    }
};

// Withdrawal Management
const WithdrawalManager = {
    getAll() {
        if (!Storage.get('withdrawals')) {
            Storage.set('withdrawals', []);
        }
        return Storage.get('withdrawals');
    },

    getPending() {
        return this.getAll().filter(w => w.status === 'pending');
    },

    approve(withdrawalId) {
        const withdrawals = this.getAll();
        const index = withdrawals.findIndex(w => w.id === withdrawalId);
        if (index !== -1) {
            withdrawals[index].status = 'approved';
            withdrawals[index].approvedAt = new Date().toISOString();
            withdrawals[index].approvedBy = AdminAuth.currentAdmin?.id;
            Storage.set('withdrawals', withdrawals);
            return true;
        }
        return false;
    },

    reject(withdrawalId, reason = '') {
        const withdrawals = this.getAll();
        const index = withdrawals.findIndex(w => w.id === withdrawalId);
        if (index !== -1) {
            withdrawals[index].status = 'rejected';
            withdrawals[index].rejectedAt = new Date().toISOString();
            withdrawals[index].rejectionReason = reason;
            Storage.set('withdrawals', withdrawals);

            // Return balance to user
            const users = Storage.get('users') || [];
            const userIndex = users.findIndex(u => u.id === withdrawals[index].userId);
            if (userIndex !== -1) {
                users[userIndex].balance = (users[userIndex].balance || 0) + withdrawals[index].amount;
                Storage.set('users', users);
            }
            return true;
        }
        return false;
    },

    markAsPaid(withdrawalId) {
        const withdrawals = this.getAll();
        const index = withdrawals.findIndex(w => w.id === withdrawalId);
        if (index !== -1) {
            withdrawals[index].status = 'paid';
            withdrawals[index].paidAt = new Date().toISOString();
            Storage.set('withdrawals', withdrawals);
            return true;
        }
        return false;
    }
};

// Master Links Management
const MasterLinks = {
    getAll() {
        if (!Storage.get('masterLinks')) {
            const defaults = [
                {
                    id: 1,
                    houseId: 1,
                    houseName: 'Superbet',
                    name: 'Link Principal Superbet',
                    url: 'https://superbet.com/register?ref=FENIX',
                    status: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    houseId: 2,
                    houseName: 'Sportingbet',
                    name: 'Link Principal Sportingbet',
                    url: 'https://sportingbet.com/register?ref=FENIX',
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ];
            Storage.set('masterLinks', defaults);
        }
        return Storage.get('masterLinks');
    },

    add(data) {
        const links = this.getAll();
        const house = BettingHouses.getById(data.houseId);
        const newLink = {
            id: Date.now(),
            ...data,
            houseName: house?.name || 'N/A',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        links.push(newLink);
        Storage.set('masterLinks', links);
        return newLink;
    },

    update(id, data) {
        const links = this.getAll();
        const index = links.findIndex(l => l.id === id);
        if (index !== -1) {
            links[index] = { ...links[index], ...data };
            Storage.set('masterLinks', links);
            return links[index];
        }
        return null;
    },

    delete(id) {
        const links = this.getAll().filter(l => l.id !== id);
        Storage.set('masterLinks', links);
    }
};

// Dashboard Statistics
const AdminStats = {
    getOverview() {
        var users = AffiliateManager.getAll();
        var houses = BettingHouses.getAll();

        var totalClicks = 0;
        var totalConversions = 0;
        var totalEarnings = 0;

        users.forEach(function(user) {
            totalClicks += user.total_clicks || 0;
            totalConversions += user.total_conversions || 0;
            totalEarnings += parseFloat(user.total_earnings || 0);
        });

        return {
            totalAffiliates: users.length,
            pendingAffiliates: users.filter(u => u.status === 'pending').length,
            activeAffiliates: users.filter(u => u.status === 'approved').length,
            blockedAffiliates: users.filter(u => u.status === 'blocked').length,
            totalHouses: houses.length,
            totalClicks: totalClicks,
            totalConversions: totalConversions,
            totalEarnings: totalEarnings,
            pendingWithdrawals: 0,
            totalWithdrawals: 0,
            conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0
        };
    },

    getHouseStats() {
        return BettingHouses.getAll().map(function(house) {
            return {
                ...house,
                revenue: house.totalConversions * house.cpa
            };
        });
    }
};

// CPA Configuration
const CPAConfig = {
    getDefault(houseId) {
        const house = BettingHouses.getById(houseId);
        return house ? house.cpa : 0;
    },

    updateDefault(houseId, newCPA) {
        return BettingHouses.update(houseId, { cpa: newCPA });
    },

    getForAffiliate(userId, houseId) {
        const users = Storage.get('users') || [];
        const user = users.find(u => u.id === userId);

        if (user?.customCPA && user.customCPA[houseId]) {
            return user.customCPA[houseId];
        }

        return this.getDefault(houseId);
    }
};

// Postback Simulation (for testing)
const PostbackSimulator = {
    simulateConversion(affiliateId, houseId) {
        const users = Storage.get('users') || [];
        const userIndex = users.findIndex(u => u.id === affiliateId);

        if (userIndex === -1) return false;

        const cpa = CPAConfig.getForAffiliate(affiliateId, houseId);
        const house = BettingHouses.getById(houseId);

        // Update user balance
        users[userIndex].balance = (users[userIndex].balance || 0) + cpa;
        users[userIndex].totalEarnings = (users[userIndex].totalEarnings || 0) + cpa;
        Storage.set('users', users);

        // Update house stats
        if (house) {
            BettingHouses.update(houseId, {
                totalConversions: (house.totalConversions || 0) + 1,
                totalPaid: (house.totalPaid || 0) + cpa
            });
        }

        // Log conversion
        const conversions = Storage.get('conversions') || [];
        conversions.push({
            id: Date.now(),
            affiliateId,
            houseId,
            houseName: house?.name,
            amount: cpa,
            createdAt: new Date().toISOString()
        });
        Storage.set('conversions', conversions);

        return true;
    }
};

// Initialize Demo Data for Admin (data now lives in Supabase)
const AdminDemoData = {
    init() {
        // BettingHouses and MasterLinks still use localStorage for now
        BettingHouses.getAll();
        MasterLinks.getAll();
    }
};

// Manager Management - Supabase
const ManagerManager = {
    _cache: null,

    async fetchAll() {
        this._cache = await SupabaseDB.getManagers();
        return this._cache;
    },

    getAll() {
        return this._cache || [];
    },

    getById(id) {
        return this.getAll().find(function(m) { return m.id == id; });
    },

    async add(data) {
        var existing = this.getAll().find(function(m) { return m.email === data.email; });
        if (existing) {
            return { success: false, message: 'E-mail já cadastrado' };
        }
        var newManager = {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone || '',
            role: 'manager',
            referral_code: 'MGR' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            cpa_commission: parseFloat(data.cpaCommission) || 30,
            status: 'active',
            balance: 0,
            total_earnings: 0,
            created_at: new Date().toISOString()
        };
        var result = await SupabaseDB.createManager(newManager);
        if (result.error) {
            return { success: false, message: 'Erro ao criar gerente' };
        }
        await this.fetchAll();
        return { success: true, manager: result.data };
    },

    async update(id, data) {
        var updateData = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.password !== undefined) updateData.password = data.password;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.cpaCommission !== undefined) updateData.cpa_commission = parseFloat(data.cpaCommission);
        if (data.status !== undefined) updateData.status = data.status;
        var result = await SupabaseDB.updateManager(id, updateData);
        if (!result.error) await this.fetchAll();
        return result.data || null;
    },

    async remove(id) {
        await SupabaseDB.deleteManager(id);
        await this.fetchAll();
    },

    async login(email, password) {
        var manager = await SupabaseDB.getManagerByEmail(email);
        if (manager && manager.password === password && manager.status === 'active') {
            var data = { id: manager.id, name: manager.name, email: manager.email, role: 'manager', referralCode: manager.referral_code };
            localStorage.setItem('fenix_currentManager', JSON.stringify(data));
            return { success: true, manager: data };
        }
        return { success: false };
    },

    logout() {
        localStorage.removeItem('fenix_currentManager');
        window.location.href = '../index.html';
    },

    getCurrentManager() {
        try {
            return JSON.parse(localStorage.getItem('fenix_currentManager'));
        } catch(e) {
            return null;
        }
    },

    requireAuth() {
        var m = this.getCurrentManager();
        if (!m) {
            window.location.href = '../index.html';
            return false;
        }
        return true;
    },

    getAffiliates(managerId) {
        var allUsers = AffiliateManager.getAll();
        return allUsers.filter(function(u) { return u.manager_id == managerId; });
    },

    getStats(managerId) {
        var affiliates = this.getAffiliates(managerId);
        var manager = this.getById(managerId);
        var totalClicks = 0, totalConversions = 0, totalEarnings = 0;

        affiliates.forEach(function(aff) {
            totalClicks += aff.total_clicks || 0;
            totalConversions += aff.total_conversions || 0;
            totalEarnings += parseFloat(aff.total_earnings || 0);
        });

        var cpaCommission = manager ? (manager.cpa_commission || 30) : 30;
        var managerEarnings = totalConversions * cpaCommission;

        return {
            totalAffiliates: affiliates.length,
            pendingAffiliates: affiliates.filter(function(a) { return a.status === 'pending'; }).length,
            totalClicks: totalClicks,
            totalConversions: totalConversions,
            totalAffiliateEarnings: totalEarnings,
            managerEarnings: managerEarnings,
            cpaCommission: cpaCommission,
            balance: manager ? (manager.balance || 0) : 0
        };
    },

    async approveAffiliate(managerId, userId) {
        var result = await SupabaseDB.updateUser(userId, {
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: managerId
        });
        if (!result.error) await AffiliateManager.fetchAll();
        return !result.error;
    },

    async rejectAffiliate(managerId, userId, reason) {
        var result = await SupabaseDB.updateUser(userId, {
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejection_reason: reason || ''
        });
        if (!result.error) await AffiliateManager.fetchAll();
        return !result.error;
    }
};

window.ManagerManager = ManagerManager;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    AdminAuth.init();
    AdminDemoData.init();
    // Pre-fetch data from Supabase
    if (typeof SupabaseDB !== 'undefined') {
        await AffiliateManager.fetchAll();
        await ManagerManager.fetchAll();
    }
});

// Toggle Sidebar (for mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// Make functions globally available
window.AdminAuth = AdminAuth;
window.BettingHouses = BettingHouses;
window.AffiliateManager = AffiliateManager;
window.WithdrawalManager = WithdrawalManager;
window.MasterLinks = MasterLinks;
window.AdminStats = AdminStats;
window.CPAConfig = CPAConfig;
window.PostbackSimulator = PostbackSimulator;
window.toggleSidebar = toggleSidebar;
