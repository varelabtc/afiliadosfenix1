// ========================================
// FENIX AFILIADOS - SUPABASE DATABASE
// ========================================

const SUPABASE_URL = 'https://zaopgwnrzadisqtxrlst.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5IHTgZdNubSyGzyuKWPPUg_cxXH_KCH';

const SupabaseDB = {
    headers() {
        return {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },

    // Generic REST methods
    async get(table, params) {
        const query = params ? '?' + params : '';
        const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + query, {
            headers: this.headers()
        });
        if (!res.ok) return [];
        return await res.json();
    },

    async insert(table, data) {
        const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(function() { return {}; });
            return { error: err };
        }
        const rows = await res.json();
        return { data: rows[0] || rows };
    },

    async update(table, filter, data) {
        const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + filter, {
            method: 'PATCH',
            headers: this.headers(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(function() { return {}; });
            return { error: err };
        }
        if (res.status === 204) return { data: data };
        const rows = await res.json().catch(function() { return data; });
        return { data: rows[0] || rows };
    },

    async remove(table, filter) {
        const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + filter, {
            method: 'DELETE',
            headers: this.headers()
        });
        return { ok: res.ok };
    },

    // ========== USERS (Affiliates) ==========
    async getUsers() {
        return await this.get('users', 'select=*&order=created_at.desc');
    },

    async getUserByEmail(email) {
        const rows = await this.get('users', 'select=*&email=eq.' + encodeURIComponent(email));
        return rows[0] || null;
    },

    async getUserById(id) {
        const rows = await this.get('users', 'select=*&id=eq.' + id);
        return rows[0] || null;
    },

    async createUser(userData) {
        return await this.insert('users', userData);
    },

    async updateUser(id, data) {
        return await this.update('users', 'id=eq.' + id, data);
    },

    async deleteUser(id) {
        return await this.remove('users', 'id=eq.' + id);
    },

    // ========== ADMINS ==========
    async getAdmins() {
        return await this.get('admins', 'select=*');
    },

    async getAdminByEmail(email) {
        const rows = await this.get('admins', 'select=*&email=eq.' + encodeURIComponent(email));
        return rows[0] || null;
    },

    async updateAdmin(id, data) {
        return await this.update('admins', 'id=eq.' + id, data);
    },

    // ========== MANAGERS ==========
    async getManagers() {
        return await this.get('managers', 'select=*&order=created_at.desc');
    },

    async getManagerByEmail(email) {
        const rows = await this.get('managers', 'select=*&email=eq.' + encodeURIComponent(email));
        return rows[0] || null;
    },

    async getManagerById(id) {
        const rows = await this.get('managers', 'select=*&id=eq.' + id);
        return rows[0] || null;
    },

    async getManagerByReferralCode(code) {
        const rows = await this.get('managers', 'select=*&referral_code=eq.' + encodeURIComponent(code));
        return rows[0] || null;
    },

    async createManager(data) {
        return await this.insert('managers', data);
    },

    async updateManager(id, data) {
        return await this.update('managers', 'id=eq.' + id, data);
    },

    async deleteManager(id) {
        return await this.remove('managers', 'id=eq.' + id);
    },

    // ========== LINKS ==========
    async getLinks(userId) {
        if (userId) {
            return await this.get('links', 'select=*&user_id=eq.' + userId + '&order=created_at.desc');
        }
        return await this.get('links', 'select=*&order=created_at.desc');
    },

    async createLink(data) {
        return await this.insert('links', data);
    },

    async updateLink(id, data) {
        return await this.update('links', 'id=eq.' + id, data);
    },

    async deleteLink(id) {
        return await this.remove('links', 'id=eq.' + id);
    },

    // ========== HELPER: Generate affiliate code ==========
    generateAffiliateCode() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var code = 'FNX';
        for (var i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
};

// Make globally available
window.SupabaseDB = SupabaseDB;
