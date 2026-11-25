const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'users.json');

class UserManager {
  constructor() {
    this.users = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.users = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[UserManager] Failed to load users.json, starting with clean memory store:', e.message);
      this.users = {};
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (e) {
      console.error('[UserManager] Failed to save users.json:', e.message);
    }
  }

  syncWithSimulation(sim) {
    if (!sim || !sim.facilities) return;
    Object.values(this.users).forEach(u => {
      if (u.facilityId && sim.facilities[u.facilityId]) {
        sim.facilities[u.facilityId].claimedBy = u.username;
        sim.facilities[u.facilityId].isBot = false;
      }
    });
  }

  getFacilitiesDirectory(sim) {
    const list = Object.values(sim.facilities || {}).map(f => {
      const boundUser = Object.values(this.users).find(u => u.facilityId === f.id);
      return {
        id: f.id,
        name: f.name,
        sectorId: f.sectorId,
        sectorName: f.sectorName || f.sectorType,
        techTier: f.techTier,
        complianceStatus: f.complianceStatus,
        baselineEmissions: f.baselineEmissions,
        actualEmissions: f.actualEmissions,
        allocatedAllowances: f.allocatedAllowances,
        isClaimed: Boolean(boundUser),
        claimedBy: boundUser ? boundUser.username : null
      };
    });
    return list;
  }

  register({ username, password, facilityId }, sim, adminPasskey = 'admin123') {
    if (!username || !username.trim()) {
      throw new Error('Vui lòng nhập tên đăng nhập.');
    }
    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự.');
    }
    if (cleanUser.toLowerCase() === 'admin') {
      throw new Error('Tên đăng nhập "admin" được dành riêng cho Ban Quản Trị.');
    }
    if (this.users[cleanUser.toLowerCase()]) {
      throw new Error(`Tên đăng nhập "${cleanUser}" đã được sử dụng. Vui lòng chọn tên khác hoặc chuyển sang Đăng Nhập.`);
    }

    if (!password || password.trim().length < 3) {
      throw new Error('Mật khẩu phải có ít nhất 3 ký tự.');
    }

    if (!facilityId) {
      throw new Error('Vui lòng chọn 1 công ty / cơ sở phát thải.');
    }

    if (!sim.facilities[facilityId]) {
      throw new Error(`Không tìm thấy cơ sở với mã "${facilityId}".`);
    }

    // Check if facility is already bound to another user
    const existingBinding = Object.values(this.users).find(u => u.facilityId === facilityId);
    if (existingBinding) {
      throw new Error(`Công ty "${sim.facilities[facilityId].name}" đã được đăng ký bởi tài khoản "${existingBinding.username}". Vui lòng chọn công ty khác.`);
    }

    const newUser = {
      username: cleanUser,
      password: password.trim(),
      facilityId: facilityId,
      facilityName: sim.facilities[facilityId].name,
      role: 'facility_user',
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };

    this.users[cleanUser.toLowerCase()] = newUser;
    this.save();

    // Mark facility as human claimed
    if (sim.facilities[facilityId]) {
      sim.facilities[facilityId].claimedBy = cleanUser;
      sim.facilities[facilityId].isBot = false;
      sim.facilities[facilityId].online = true;
    }

    const token = `user_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      token,
      user: {
        username: newUser.username,
        role: newUser.role,
        facilityId: newUser.facilityId,
        facilityName: newUser.facilityName
      }
    };
  }

  login({ username, password }, sim, adminPasskey = 'admin123') {
    if (!username || !username.trim()) {
      throw new Error('Vui lòng nhập tên đăng nhập.');
    }
    if (!password) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // Check Admin
    if (cleanUser.toLowerCase() === 'admin') {
      if (cleanPass === adminPasskey) {
        return {
          token: `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          user: {
            username: 'admin',
            role: 'admin',
            name: 'Ban Quản Trị ETS (Admin Council)'
          }
        };
      } else {
        throw new Error('Mật khẩu quản trị (Admin) không chính xác.');
      }
    }

    // Check Facility User
    const user = this.users[cleanUser.toLowerCase()];
    if (!user) {
      throw new Error(`Tài khoản "${cleanUser}" chưa được đăng ký. Vui lòng chuyển sang tab "Đăng Ký" để gắn với công ty của bạn.`);
    }

    if (user.password !== cleanPass) {
      throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }

    user.lastLoginAt = Date.now();
    this.save();

    if (sim.facilities[user.facilityId]) {
      sim.facilities[user.facilityId].online = true;
      sim.facilities[user.facilityId].isBot = false;
    }

    const token = `user_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      token,
      user: {
        username: user.username,
        role: user.role,
        facilityId: user.facilityId,
        facilityName: sim.facilities[user.facilityId]?.name || user.facilityName
      }
    };
  }

  getUserByToken(token) {
    if (!token) return null;
    if (token.startsWith('admin_token_')) {
      return { username: 'admin', role: 'admin', name: 'Ban Quản Trị ETS' };
    }
    // Token is acceptable in stateless dev session, or matches user
    return null;
  }

  listAccounts(sim) {
    return Object.values(this.users).map(u => ({
      username: u.username,
      facilityId: u.facilityId,
      facilityName: sim.facilities?.[u.facilityId]?.name || u.facilityName,
      sector: sim.facilities?.[u.facilityId]?.sectorName || 'N/A',
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      isOnline: Boolean(sim.facilities?.[u.facilityId]?.online)
    }));
  }

  deleteAccount(username, sim) {
    const key = username.toLowerCase();
    if (this.users[key]) {
      const facId = this.users[key].facilityId;
      delete this.users[key];
      this.save();
      if (sim && sim.facilities && sim.facilities[facId]) {
        sim.facilities[facId].claimedBy = null;
        sim.facilities[facId].isBot = true;
      }
      return true;
    }
    return false;
  }
}

module.exports = new UserManager();
