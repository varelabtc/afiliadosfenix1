// ========================================
// FENIX AFILIADOS - ADMIN JAVASCRIPT
// ========================================

// Admin Authentication
const AdminAuth = {
    currentAdmin: null,

    init() {
        // Buscar admin do localStorage diretamente
        try {
            const adminData = localStorage.getItem('fenix_currentAdmin');
            if (adminData) {
                this.currentAdmin = JSON.parse(adminData);
            }
        } catch(e) {
            this.currentAdmin = null;
        }
        this.initDefaultAdmin();
    },

    initDefaultAdmin() {
        let admins = [];
        try {
            admins = JSON.parse(localStorage.getItem('fenix_admins') || '[]');
        } catch(e) {
            admins = [];
        }

        const defaultAdmin = {
            id: 1,
            name: 'Administrador Master',
            email: 'admin@fenix.com',
            password: 'fenix2026',
            role: 'super_admin',
            createdAt: new Date().toISOString()
        };

        const existing = admins.findIndex(a => a.email === 'admin@fenix.com');
        if (existing >= 0) {
            admins[existing].password = 'fenix2026';
        } else {
            admins.push(defaultAdmin);
        }
        localStorage.setItem('fenix_admins', JSON.stringify(admins));
    },

    login(email, password) {
        let admins = [];
        try {
            admins = JSON.parse(localStorage.getItem('fenix_admins') || '[]');
        } catch(e) {
            admins = [];
        }

        const admin = admins.find(a => a.email === email && a.password === password);

        if (admin) {
            const adminData = {
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
        window.location.href = '../index.html';
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
            window.location.href = '../index.html';
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
                cpa: 120.00,
                revShare: 25,
                minDeposit: 30.00,
                status: 'active',
                totalAffiliates: 38,
                totalClicks: 9800,
                totalConversions: 245,
                totalPaid: 29400.00
            }
        ];

        if (!Storage.get('bettingHouses')) {
            Storage.set('bettingHouses', defaults);
        }

        return Storage.get('bettingHouses');
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

// Affiliate Management (Admin)
const AffiliateManager = {
    getAll() {
        return Storage.get('users') || [];
    },

    getPending() {
        return this.getAll().filter(u => u.status === 'pending');
    },

    getApproved() {
        return this.getAll().filter(u => u.status === 'approved' || !u.status);
    },

    getRejected() {
        return this.getAll().filter(u => u.status === 'rejected');
    },

    approve(userId) {
        const users = this.getAll();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].status = 'approved';
            users[index].approvedAt = new Date().toISOString();
            users[index].approvedBy = AdminAuth.currentAdmin?.id;
            Storage.set('users', users);
            return true;
        }
        return false;
    },

    reject(userId, reason = '') {
        const users = this.getAll();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].status = 'rejected';
            users[index].rejectedAt = new Date().toISOString();
            users[index].rejectedBy = AdminAuth.currentAdmin?.id;
            users[index].rejectionReason = reason;
            Storage.set('users', users);
            return true;
        }
        return false;
    },

    block(userId) {
        const users = this.getAll();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].status = 'blocked';
            users[index].blockedAt = new Date().toISOString();
            Storage.set('users', users);
            return true;
        }
        return false;
    },

    unblock(userId) {
        const users = this.getAll();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].status = 'approved';
            delete users[index].blockedAt;
            Storage.set('users', users);
            return true;
        }
        return false;
    },

    getStats(userId) {
        const links = Storage.get(`links_${userId}`) || [];
        return {
            totalLinks: links.length,
            totalClicks: links.reduce((sum, l) => sum + l.clicks, 0),
            totalConversions: links.reduce((sum, l) => sum + l.conversions, 0),
            totalEarnings: links.reduce((sum, l) => sum + l.earnings, 0)
        };
    },

    updateCPA(userId, houseId, customCPA) {
        const users = this.getAll();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            if (!users[index].customCPA) {
                users[index].customCPA = {};
            }
            users[index].customCPA[houseId] = customCPA;
            Storage.set('users', users);
            return true;
        }
        return false;
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
        const users = AffiliateManager.getAll();
        const houses = BettingHouses.getAll();
        const withdrawals = WithdrawalManager.getAll();

        let totalClicks = 0;
        let totalConversions = 0;
        let totalEarnings = 0;

        users.forEach(user => {
            const links = Storage.get(`links_${user.id}`) || [];
            totalClicks += links.reduce((sum, l) => sum + l.clicks, 0);
            totalConversions += links.reduce((sum, l) => sum + l.conversions, 0);
            totalEarnings += links.reduce((sum, l) => sum + l.earnings, 0);
        });

        return {
            totalAffiliates: users.length,
            pendingAffiliates: users.filter(u => u.status === 'pending').length,
            activeAffiliates: users.filter(u => u.status === 'approved' || !u.status).length,
            blockedAffiliates: users.filter(u => u.status === 'blocked').length,
            totalHouses: houses.length,
            totalClicks,
            totalConversions,
            totalEarnings,
            pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
            totalWithdrawals: withdrawals.reduce((sum, w) => w.status === 'paid' ? sum + w.amount : sum, 0),
            conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0
        };
    },

    getHouseStats() {
        return BettingHouses.getAll().map(house => {
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

// Initialize Demo Data for Admin
const AdminDemoData = {
    init() {
        // Initialize betting houses
        BettingHouses.getAll();

        // Initialize master links
        MasterLinks.getAll();

        // Add some pending affiliates for demo
        const users = Storage.get('users') || [];

        if (users.length < 5) {
            const demoUsers = [
                {
                    id: Date.now() + 1,
                    name: 'João Silva',
                    email: 'joao@teste.com',
                    password: '123456',
                    phone: '(11) 98765-4321',
                    status: 'pending',
                    affiliateCode: 'FNXJSILVA',
                    balance: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    id: Date.now() + 2,
                    name: 'Maria Santos',
                    email: 'maria@teste.com',
                    password: '123456',
                    phone: '(21) 99876-5432',
                    status: 'pending',
                    affiliateCode: 'FNXMSANTOS',
                    balance: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    id: Date.now() + 3,
                    name: 'Carlos Oliveira',
                    email: 'carlos@teste.com',
                    password: '123456',
                    phone: '(31) 97654-3210',
                    status: 'approved',
                    affiliateCode: 'FNXCOLIVEIRA',
                    balance: 450.00,
                    totalEarnings: 1250.00,
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];

            // Add demo links for Carlos
            Storage.set(`links_${demoUsers[2].id}`, [
                {
                    id: 1,
                    name: 'Superbet - Promo Verão',
                    houseId: 1,
                    houseName: 'Superbet',
                    shortCode: 'sbpromo1',
                    clicks: 580,
                    conversions: 8,
                    earnings: 1200.00,
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ]);

            users.push(...demoUsers);
            Storage.set('users', users);
        }

        // Add demo withdrawals
        if (!Storage.get('withdrawals') || Storage.get('withdrawals').length === 0) {
            Storage.set('withdrawals', [
                {
                    id: 1,
                    userId: users[2]?.id || 1,
                    userName: 'Carlos Oliveira',
                    amount: 300.00,
                    pixKey: '123.456.789-00',
                    pixType: 'cpf',
                    status: 'pending',
                    createdAt: new Date().toISOString()
                }
            ]);
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    AdminAuth.init();
    AdminDemoData.init();
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
