// ========================================
// FENIX AFILIADOS - JAVASCRIPT PRINCIPAL
// ========================================

// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('fenix-theme') || 'dark';
        this.setTheme(savedTheme);
        this.bindToggle();
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('fenix-theme', theme);
    },

    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    bindToggle() {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
};

// Toast Notifications
const Toast = {
    container: null,

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${this.getIcon(type)}
            </svg>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    getIcon(type) {
        const icons = {
            success: '<path d="M20 6L9 17l-5-5"/>',
            error: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
            info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'
        };
        return icons[type] || icons.info;
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// Form Validation
const FormValidator = {
    patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: /^.{6,}$/,
        phone: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
        cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/
    },

    validate(input) {
        const type = input.dataset.validate;
        const value = input.value.trim();

        if (input.required && !value) {
            return { valid: false, message: 'Este campo é obrigatório' };
        }

        if (type && this.patterns[type]) {
            if (!this.patterns[type].test(value)) {
                const messages = {
                    email: 'Digite um e-mail válido',
                    password: 'A senha deve ter pelo menos 6 caracteres',
                    phone: 'Digite um telefone válido: (00) 00000-0000',
                    cpf: 'Digite um CPF válido: 000.000.000-00',
                    url: 'Digite uma URL válida'
                };
                return { valid: false, message: messages[type] };
            }
        }

        return { valid: true };
    },

    showError(input, message) {
        this.clearError(input);
        input.style.borderColor = 'var(--danger)';
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.style.cssText = 'color: var(--danger); font-size: 0.75rem; margin-top: 4px;';
        errorEl.textContent = message;
        input.parentNode.appendChild(errorEl);
    },

    clearError(input) {
        input.style.borderColor = '';
        const existingError = input.parentNode.querySelector('.form-error');
        if (existingError) existingError.remove();
    },

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], input[data-validate]');
        let isValid = true;

        inputs.forEach(input => {
            const result = this.validate(input);
            if (!result.valid) {
                this.showError(input, result.message);
                isValid = false;
            } else {
                this.clearError(input);
            }
        });

        return isValid;
    }
};

// Copy to Clipboard
const Clipboard = {
    async copy(text, button = null) {
        try {
            await navigator.clipboard.writeText(text);
            Toast.success('Link copiado!');

            if (button) {
                const originalText = button.innerHTML;
                button.classList.add('copied');
                button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copiado!';

                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = originalText;
                }, 2000);
            }
        } catch (err) {
            Toast.error('Erro ao copiar');
        }
    }
};

// Modal Management
const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    init() {
        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Close on button click
        document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
    }
};

// Sidebar Mobile Toggle
var _sidebarOpen = false;
var _sidebarBusy = false;
const Sidebar = {
    init() {
        var self = this;

        // Direct binding to all menu buttons found in DOM
        document.querySelectorAll('.mobile-menu-btn').forEach(function(btn) {
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (!_sidebarBusy) {
                    _sidebarBusy = true;
                    self.toggle();
                    setTimeout(function() { _sidebarBusy = false; }, 400);
                }
            }, {passive: false});

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (!_sidebarBusy) {
                    _sidebarBusy = true;
                    self.toggle();
                    setTimeout(function() { _sidebarBusy = false; }, 400);
                }
            });
        });

        document.querySelectorAll('.sidebar-toggle').forEach(function(btn) {
            btn.addEventListener('touchstart', function(e) { e.preventDefault(); self.close(); }, {passive: false});
            btn.addEventListener('click', function(e) { e.preventDefault(); self.close(); });
        });

        document.querySelectorAll('.sidebar-overlay').forEach(function(el) {
            el.addEventListener('touchstart', function() { self.close(); }, {passive: true});
            el.addEventListener('click', function() { self.close(); });
        });
    },

    toggle() {
        var s = document.getElementById('sidebar') || document.querySelector('.sidebar');
        var o = document.querySelector('.sidebar-overlay');
        _sidebarOpen = !_sidebarOpen;

        if (s) {
            if (_sidebarOpen) {
                s.style.transform = 'translateX(0)';
                s.style.zIndex = '150';
            } else {
                s.style.transform = 'translateX(-100%)';
                s.style.zIndex = '';
            }
        }
        if (o) {
            if (_sidebarOpen) {
                o.style.display = 'block';
                o.style.zIndex = '140';
            } else {
                o.style.display = 'none';
                o.style.zIndex = '';
            }
        }
    },

    close() {
        var s = document.getElementById('sidebar') || document.querySelector('.sidebar');
        var o = document.querySelector('.sidebar-overlay');
        _sidebarOpen = false;

        if (s) {
            s.style.transform = 'translateX(-100%)';
            s.style.zIndex = '';
        }
        if (o) {
            o.style.display = 'none';
            o.style.zIndex = '';
        }
    }
};

function toggleSidebar() { Sidebar.toggle(); }
window.toggleSidebar = toggleSidebar;

// Data Formatting
const Format = {
    currency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    number(value) {
        return new Intl.NumberFormat('pt-BR').format(value);
    },

    date(dateStr) {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
    },

    dateTime(dateStr) {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(new Date(dateStr));
    },

    percentage(value) {
        return `${value.toFixed(1)}%`;
    }
};

// Local Storage Manager (Simulating Database)
const Storage = {
    get(key) {
        const data = localStorage.getItem(`fenix_${key}`);
        return data ? JSON.parse(data) : null;
    },

    set(key, value) {
        localStorage.setItem(`fenix_${key}`, JSON.stringify(value));
    },

    remove(key) {
        localStorage.removeItem(`fenix_${key}`);
    },

    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith('fenix_'))
            .forEach(key => localStorage.removeItem(key));
    }
};

// User Session Management
const Auth = {
    currentUser: null,

    init() {
        this.currentUser = Storage.get('currentUser');
        this.updateUI();
    },

    login(email, password) {
        // Check admin credentials first
        if (email === 'admin@fenix.com' && password === 'fenix2026') {
            const adminData = {
                id: 1,
                name: 'Administrador Master',
                email: email,
                role: 'super_admin'
            };
            localStorage.setItem('fenix_currentAdmin', JSON.stringify(adminData));
            // Ensure admin exists in admins list
            let admins = [];
            try { admins = JSON.parse(localStorage.getItem('fenix_admins') || '[]'); } catch(e) { admins = []; }
            if (!admins.find(a => a.email === email)) {
                admins.push({ ...adminData, password: password, createdAt: new Date().toISOString() });
                localStorage.setItem('fenix_admins', JSON.stringify(admins));
            }
            return { success: true, user: adminData, isAdmin: true };
        }

        const users = Storage.get('users') || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            Storage.set('currentUser', user);
            return { success: true, user, isAdmin: false };
        }
        return { success: false, message: 'E-mail ou senha incorretos' };
    },

    register(userData) {
        const users = Storage.get('users') || [];

        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Este e-mail já está cadastrado' };
        }

        const newUser = {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString(),
            affiliateCode: this.generateAffiliateCode(),
            balance: 0,
            totalEarnings: 0,
            totalClicks: 0,
            totalConversions: 0
        };

        users.push(newUser);
        Storage.set('users', users);

        // Initialize user links
        Storage.set(`links_${newUser.id}`, []);

        return { success: true, user: newUser };
    },

    logout() {
        this.currentUser = null;
        Storage.remove('currentUser');
        window.location.href = 'index.html';
    },

    isAuthenticated() {
        return !!this.currentUser;
    },

    generateAffiliateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'FNX';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    updateUI() {
        if (this.currentUser) {
            const userAvatars = document.querySelectorAll('.user-avatar');
            const userNames = document.querySelectorAll('.user-name');
            const userEmails = document.querySelectorAll('.user-email');

            userAvatars.forEach(el => {
                el.textContent = this.currentUser.name.charAt(0).toUpperCase();
            });

            userNames.forEach(el => {
                el.textContent = this.currentUser.name;
            });

            userEmails.forEach(el => {
                el.textContent = this.currentUser.email;
            });
        }
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
};

// Links Management
const Links = {
    getAll() {
        if (!Auth.currentUser) return [];
        return Storage.get(`links_${Auth.currentUser.id}`) || [];
    },

    create(linkData) {
        const links = this.getAll();
        const newLink = {
            id: Date.now(),
            ...linkData,
            shortCode: this.generateShortCode(),
            clicks: 0,
            conversions: 0,
            earnings: 0,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        links.push(newLink);
        Storage.set(`links_${Auth.currentUser.id}`, links);
        return newLink;
    },

    update(id, updates) {
        const links = this.getAll();
        const index = links.findIndex(l => l.id === id);

        if (index !== -1) {
            links[index] = { ...links[index], ...updates };
            Storage.set(`links_${Auth.currentUser.id}`, links);
            return links[index];
        }
        return null;
    },

    delete(id) {
        const links = this.getAll().filter(l => l.id !== id);
        Storage.set(`links_${Auth.currentUser.id}`, links);
    },

    generateShortCode() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    getFullUrl(shortCode) {
        return `https://fnx.link/${shortCode}`;
    }
};

// Stats & Analytics
const Analytics = {
    getDashboardStats() {
        if (!Auth.currentUser) return null;

        const links = Links.getAll();

        return {
            totalEarnings: links.reduce((sum, l) => sum + l.earnings, 0),
            totalClicks: links.reduce((sum, l) => sum + l.clicks, 0),
            totalConversions: links.reduce((sum, l) => sum + l.conversions, 0),
            activeLinks: links.filter(l => l.status === 'active').length,
            conversionRate: links.length > 0
                ? (links.reduce((sum, l) => sum + l.conversions, 0) / links.reduce((sum, l) => sum + l.clicks, 0) * 100) || 0
                : 0
        };
    },

    getChartData(period = '7d') {
        // Simulated chart data
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                clicks: Math.floor(Math.random() * 100) + 20,
                conversions: Math.floor(Math.random() * 20) + 5,
                earnings: Math.floor(Math.random() * 500) + 100
            });
        }

        return data;
    }
};

// Initialize Demo Data
const DemoData = {
    init() {
        // Only initialize if no users exist
        if (!Storage.get('users')) {
            // Create demo user
            const demoUser = {
                id: 1,
                name: 'Usuário Demo',
                email: 'demo@fenix.com',
                password: '123456',
                phone: '(11) 99999-9999',
                createdAt: new Date().toISOString(),
                affiliateCode: 'FNXDEMO01',
                balance: 2547.80,
                totalEarnings: 15789.50,
                totalClicks: 12547,
                totalConversions: 487
            };

            Storage.set('users', [demoUser]);

            // Create demo links
            const demoLinks = [
                {
                    id: 1,
                    name: 'Curso de Marketing Digital',
                    originalUrl: 'https://exemplo.com/curso-marketing',
                    shortCode: 'mktdig01',
                    clicks: 3547,
                    conversions: 127,
                    earnings: 4572.50,
                    status: 'active',
                    createdAt: '2024-01-15T10:00:00Z'
                },
                {
                    id: 2,
                    name: 'E-book Finanças Pessoais',
                    originalUrl: 'https://exemplo.com/ebook-financas',
                    shortCode: 'finpess02',
                    clicks: 2891,
                    conversions: 98,
                    earnings: 2940.00,
                    status: 'active',
                    createdAt: '2024-01-20T14:30:00Z'
                },
                {
                    id: 3,
                    name: 'Software de Gestão',
                    originalUrl: 'https://exemplo.com/software-gestao',
                    shortCode: 'gestao03',
                    clicks: 4215,
                    conversions: 156,
                    earnings: 5460.00,
                    status: 'active',
                    createdAt: '2024-02-01T09:15:00Z'
                },
                {
                    id: 4,
                    name: 'Mentoria Online',
                    originalUrl: 'https://exemplo.com/mentoria',
                    shortCode: 'ment04',
                    clicks: 1894,
                    conversions: 106,
                    earnings: 2817.00,
                    status: 'pending',
                    createdAt: '2024-02-10T16:45:00Z'
                }
            ];

            Storage.set('links_1', demoLinks);
        }
    }
};

// Page-specific Initializations
const Pages = {
    // Login Page
    login() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!FormValidator.validateForm(form)) return;

            const email = form.querySelector('[name="email"]').value;
            const password = form.querySelector('[name="password"]').value;

            const result = Auth.login(email, password);

            if (result.success) {
                if (result.isAdmin) {
                    Toast.success('Acesso Master autorizado!');
                    setTimeout(() => {
                        window.location.href = 'admin/dashboard.html';
                    }, 1000);
                } else {
                    Toast.success('Login realizado com sucesso!');
                    setTimeout(() => {
                        window.location.href = 'pages/dashboard.html';
                    }, 1000);
                }
            } else {
                Toast.error(result.message);
            }
        });
    },

    // Register Page
    register() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!FormValidator.validateForm(form)) return;

            const password = form.querySelector('[name="password"]').value;
            const confirmPassword = form.querySelector('[name="confirmPassword"]').value;

            if (password !== confirmPassword) {
                Toast.error('As senhas não coincidem');
                return;
            }

            const userData = {
                name: form.querySelector('[name="name"]').value,
                email: form.querySelector('[name="email"]').value,
                phone: form.querySelector('[name="phone"]').value,
                password: password
            };

            const result = Auth.register(userData);

            if (result.success) {
                Toast.success('Cadastro realizado com sucesso!');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                Toast.error(result.message);
            }
        });
    },

    // Dashboard Page
    dashboard() {
        if (!Auth.requireAuth()) return;

        const stats = Analytics.getDashboardStats();

        // Update stats cards
        const earningsEl = document.getElementById('totalEarnings');
        const clicksEl = document.getElementById('totalClicks');
        const conversionsEl = document.getElementById('totalConversions');
        const linksEl = document.getElementById('activeLinks');

        if (earningsEl) earningsEl.textContent = Format.currency(stats.totalEarnings);
        if (clicksEl) clicksEl.textContent = Format.number(stats.totalClicks);
        if (conversionsEl) conversionsEl.textContent = Format.number(stats.totalConversions);
        if (linksEl) linksEl.textContent = stats.activeLinks;

        // Load recent links
        this.loadRecentLinks();
    },

    loadRecentLinks() {
        const container = document.getElementById('recentLinks');
        if (!container) return;

        const links = Links.getAll().slice(0, 5);

        if (links.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    </svg>
                    <h3>Nenhum link criado</h3>
                    <p>Crie seu primeiro link de afiliado</p>
                    <a href="links.html" class="btn btn-primary">Criar Link</a>
                </div>
            `;
            return;
        }

        container.innerHTML = links.map(link => `
            <div class="link-item">
                <div class="link-info">
                    <div class="link-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                    </div>
                    <div class="link-details">
                        <h4>${link.name}</h4>
                        <p>${Links.getFullUrl(link.shortCode)}</p>
                    </div>
                </div>
                <div class="link-stats">
                    <div class="link-stat">
                        <div class="link-stat-value">${Format.number(link.clicks)}</div>
                        <div class="link-stat-label">Cliques</div>
                    </div>
                    <div class="link-stat">
                        <div class="link-stat-value">${Format.number(link.conversions)}</div>
                        <div class="link-stat-label">Conversões</div>
                    </div>
                    <div class="link-stat">
                        <div class="link-stat-value">${Format.currency(link.earnings)}</div>
                        <div class="link-stat-label">Ganhos</div>
                    </div>
                </div>
                <div class="link-actions">
                    <button class="btn-icon" onclick="Clipboard.copy('${Links.getFullUrl(link.shortCode)}', this)" title="Copiar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Links Page
    links() {
        if (!Auth.requireAuth()) return;
        this.loadAllLinks();
        this.initLinkForm();
    },

    loadAllLinks() {
        const container = document.getElementById('linksList');
        if (!container) return;

        const links = Links.getAll();

        if (links.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    </svg>
                    <h3>Nenhum link criado</h3>
                    <p>Crie seu primeiro link de afiliado para começar a ganhar</p>
                    <button class="btn btn-primary" onclick="Modal.open('createLinkModal')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Criar Link
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = links.map(link => `
            <div class="link-item" data-id="${link.id}">
                <div class="link-info">
                    <div class="link-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                    </div>
                    <div class="link-details">
                        <h4>${link.name}</h4>
                        <p>${Links.getFullUrl(link.shortCode)}</p>
                    </div>
                </div>
                <div class="link-stats">
                    <div class="link-stat">
                        <div class="link-stat-value">${Format.number(link.clicks)}</div>
                        <div class="link-stat-label">Cliques</div>
                    </div>
                    <div class="link-stat">
                        <div class="link-stat-value">${Format.number(link.conversions)}</div>
                        <div class="link-stat-label">Conversões</div>
                    </div>
                    <div class="link-stat">
                        <div class="link-stat-value">${Format.currency(link.earnings)}</div>
                        <div class="link-stat-label">Ganhos</div>
                    </div>
                </div>
                <span class="status-badge ${link.status}">
                    <span class="status-dot"></span>
                    ${link.status === 'active' ? 'Ativo' : link.status === 'pending' ? 'Pendente' : 'Inativo'}
                </span>
                <div class="link-actions">
                    <button class="btn-icon" onclick="Clipboard.copy('${Links.getFullUrl(link.shortCode)}', this)" title="Copiar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="Pages.deleteLink(${link.id})" title="Excluir">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    },

    initLinkForm() {
        const form = document.getElementById('createLinkForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const linkData = {
                name: form.querySelector('[name="linkName"]').value,
                originalUrl: form.querySelector('[name="originalUrl"]').value
            };

            Links.create(linkData);
            Toast.success('Link criado com sucesso!');
            Modal.close('createLinkModal');
            form.reset();
            this.loadAllLinks();
        });
    },

    deleteLink(id) {
        if (confirm('Tem certeza que deseja excluir este link?')) {
            Links.delete(id);
            Toast.success('Link excluído!');
            this.loadAllLinks();
        }
    },

    // Reports Page
    reports() {
        if (!Auth.requireAuth()) return;
        this.loadReportsTable();
    },

    loadReportsTable() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        const links = Links.getAll();

        if (links.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        Nenhum dado disponível
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = links.map(link => `
            <tr>
                <td>${link.name}</td>
                <td>${Format.number(link.clicks)}</td>
                <td>${Format.number(link.conversions)}</td>
                <td>${link.clicks > 0 ? Format.percentage(link.conversions / link.clicks * 100) : '0%'}</td>
                <td>${Format.currency(link.earnings)}</td>
                <td>
                    <span class="status-badge ${link.status}">
                        <span class="status-dot"></span>
                        ${link.status === 'active' ? 'Ativo' : link.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    // Profile Page
    profile() {
        if (!Auth.requireAuth()) return;
        this.loadProfileData();
        this.initProfileForm();
    },

    loadProfileData() {
        const user = Auth.currentUser;
        if (!user) return;

        const nameEl = document.getElementById('profileName');
        const emailEl = document.getElementById('profileEmail');
        const codeEl = document.getElementById('affiliateCode');
        const avatarEl = document.getElementById('profileAvatar');

        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
        if (codeEl) codeEl.textContent = user.affiliateCode;
        if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

        // Fill form
        const form = document.getElementById('profileForm');
        if (form) {
            form.querySelector('[name="name"]').value = user.name;
            form.querySelector('[name="email"]').value = user.email;
            form.querySelector('[name="phone"]').value = user.phone || '';
        }
    },

    initProfileForm() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const users = Storage.get('users') || [];
            const index = users.findIndex(u => u.id === Auth.currentUser.id);

            if (index !== -1) {
                users[index].name = form.querySelector('[name="name"]').value;
                users[index].phone = form.querySelector('[name="phone"]').value;

                Storage.set('users', users);
                Auth.currentUser = users[index];
                Storage.set('currentUser', Auth.currentUser);

                Auth.updateUI();
                this.loadProfileData();
                Toast.success('Perfil atualizado com sucesso!');
            }
        });
    }
};

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Demo Data
    DemoData.init();

    // Initialize Theme
    ThemeManager.init();

    // Initialize Modals
    Modal.init();

    // Initialize Sidebar (mobile)
    Sidebar.init();

    // Initialize Auth
    Auth.init();

    // Page Detection and Initialization
    const path = window.location.pathname;
    const isAdmin = path.includes('/admin/');
    const page = path.split('/').pop().replace('.html', '') || 'index';

    // Skip page init for admin pages - admin.js handles those
    if (isAdmin) return;

    switch (page) {
        case 'index':
            Pages.login();
            break;
        case 'cadastro':
            Pages.register();
            break;
        case 'dashboard':
            Pages.dashboard();
            break;
        case 'links':
            Pages.links();
            break;
        case 'relatorios':
            Pages.reports();
            break;
        case 'perfil':
            Pages.profile();
            break;
    }
});

// Make functions globally available
window.Clipboard = Clipboard;
window.Modal = Modal;
window.Pages = Pages;
window.Auth = Auth;
window.Toast = Toast;
