const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { Simulation } = require('./models/simulation');
const { SECTOR_TEMPLATES, VN_110_FACILITIES_LIST } = require('./models/sectors');
const userManager = require('./models/userManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const sim = new Simulation();
const ADMIN_PASSKEY = process.env.ADMIN_KEY || 'admin123';
userManager.syncWithSimulation(sim);

// Helper to broadcast state to all connected clients
function broadcastState() {
  io.emit('state-update', sim.getState());
}
sim.onStateChange = broadcastState;

// Background Timer and Bot loop
let timerInterval = null;
function startTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    let stateChanged = false;

    // Handle Trading Timer (only when TRADING and not paused)
    if (sim.phase === 'TRADING' && !sim.isPaused && sim.periodDuration > 0) {
      if (sim.timeRemaining > 0) {
        sim.timeRemaining -= 1;
        stateChanged = true;
      } else {
        try {
          sim.openCompliance();
        } catch (err) {
          console.error('[Engine] Error in openCompliance:', err);
        }
        stateChanged = true;
      }
    }

    // Handle Primary Auction Timer
    if (sim.auction.active) {
      if (sim.auction.timeRemaining > 0) {
        sim.auction.timeRemaining -= 1;
        stateChanged = true;
      } else {
        sim.resolveAuction();
        stateChanged = true;
      }
    }

    // Trigger Bot activities (only when TRADING and not paused)
    if (sim.phase === 'TRADING' && !sim.isPaused && sim.parameters.botsEnabled) {
      if (Math.random() < 0.6) {
        sim.tickBots();
        stateChanged = true;
      }
    }

    if (stateChanged) {
      broadcastState();
    }
  }, 1000);
}

startTimerLoop();

// --- AUTHENTICATION & ACCESS CONTROL ---

// User Login (Admin or Facility User)
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = userManager.login({ username, password }, sim, ADMIN_PASSKEY);
    broadcastState();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Facility Account Registration (binds 1 username & password to 1 company)
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, facilityId } = req.body;
    const result = userManager.register({ username, password, facilityId }, sim, ADMIN_PASSKEY);
    broadcastState();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Available facilities directory for registration
app.get('/api/auth/facilities', (req, res) => {
  try {
    const list = userManager.getFacilitiesDirectory(sim);
    res.json({ success: true, facilities: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify admin credentials legacy endpoint
app.post('/api/auth/admin-login', (req, res) => {
  const { passkey } = req.body;
  if (passkey === ADMIN_PASSKEY) {
    res.json({ success: true, token: 'admin_token_' + Date.now(), role: 'admin' });
  } else {
    res.status(401).json({ error: 'Mật khẩu quản trị không chính xác.' });
  }
});

// Admin accounts management
app.get('/api/admin/accounts', requireAdmin, (req, res) => {
  try {
    const accounts = userManager.listAccounts(sim);
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/accounts/delete', requireAdmin, (req, res) => {
  try {
    const { username } = req.body;
    const deleted = userManager.deleteAccount(username, sim);
    broadcastState();
    res.json({ success: deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Middleware to guard regulator-only administrative endpoints
function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'] || req.headers['authorization'];
  if (adminKey && (adminKey === ADMIN_PASSKEY || adminKey.startsWith('admin_token_') || adminKey === `Bearer ${ADMIN_PASSKEY}`)) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Administrator authorization required to modify ETS parameters or phase.' });
}

// --- PUBLIC & PARTICIPANT REST API ROUTES ---

app.get('/api/state', (req, res) => {
  res.json(sim.getState());
});

app.get('/api/sectors', (req, res) => {
  const sectorList = Object.entries(SECTOR_TEMPLATES).map(([k, v]) => ({
    id: k,
    name: v.sectorType,
    sectorType: v.sectorType,
    icon: v.icon,
    baselineEmissions: v.defaultBaseline,
    startingCash: v.startingCash
  }));
  res.json(sectorList);
});

app.post('/api/facility/join', (req, res) => {
  try {
    const { name, sectorId, facilityId } = req.body;
    let facility;
    if (facilityId && sim.facilities[facilityId]) {
      // Reclaiming existing facility
      facility = sim.facilities[facilityId];
      if (name) facility.name = name;
      facility.isBot = false;
      facility.online = true;
    } else {
      facility = sim.createFacility({
        name,
        sectorId,
        isBot: false
      });
    }
    broadcastState();
    res.json({ success: true, facility });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/abatement/implement', (req, res) => {
  try {
    const { facilityId, techId } = req.body;
    const result = sim.implementAbatement(facilityId, techId);
    broadcastState();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/order/place', (req, res) => {
  try {
    const { facilityId, side, instrument, type, price, quantity } = req.body;
    const result = sim.placeOrder({
      facilityId,
      side,
      instrument,
      type,
      price,
      quantity
    });
    broadcastState();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/order/cancel', (req, res) => {
  try {
    const { facilityId, orderId, instrument } = req.body;
    const removedOrder = sim.cancelOrder({ facilityId, orderId, instrument });
    broadcastState();
    res.json({ success: true, order: removedOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/trade/direct', (req, res) => {
  try {
    const { fromFacilityId, toFacilityId, side, instrument, price, quantity } = req.body;
    const result = sim.createDirectProposal({
      fromFacilityId,
      toFacilityId,
      side,
      instrument,
      price,
      quantity
    });
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/trade/direct/propose', (req, res) => {
  try {
    const { fromFacilityId, toFacilityId, side, instrument, price, quantity } = req.body;
    const result = sim.createDirectProposal({
      fromFacilityId,
      toFacilityId,
      side,
      instrument,
      price,
      quantity
    });
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/trade/direct/accept', (req, res) => {
  try {
    const { facilityId, proposalId } = req.body;
    const result = sim.acceptDirectProposal({
      facilityId,
      proposalId
    });
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/trade/direct/reject', (req, res) => {
  try {
    const { facilityId, proposalId, reason } = req.body;
    const result = sim.rejectDirectProposal({
      facilityId,
      proposalId,
      reason
    });
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/trade/direct/cancel', (req, res) => {
  try {
    const { facilityId, proposalId } = req.body;
    const result = sim.cancelDirectProposal({
      facilityId,
      proposalId
    });
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auction/bid', (req, res) => {
  try {
    const { facilityId, price, quantity } = req.body;
    const result = sim.submitAuctionBid({ facilityId, price, quantity });
    broadcastState();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/borrowing/execute', (req, res) => {
  try {
    const { facilityId, quantity } = req.body;
    const result = sim.executeBorrowing(facilityId, quantity);
    broadcastState();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/borrowing/repay', (req, res) => {
  try {
    const { facilityId, quantity } = req.body;
    const result = sim.repayBorrowing(facilityId, quantity);
    broadcastState();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/surrender/submit', (req, res) => {
  try {
    const { facilityId, allowances, offsets, requestBorrowing } = req.body;
    const result = sim.submitSurrender(facilityId, {
      allowances,
      offsets,
      requestBorrowing
    });
    broadcastState();
    res.json({ success: true, surrender: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ADMIN / REGULATOR PROTECTED ROUTES ---

app.post('/api/parameters', requireAdmin, (req, res) => {
  try {
    const updated = sim.updateParameters(req.body);
    broadcastState();
    res.json({ success: true, parameters: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/facilities-count', requireAdmin, (req, res) => {
  try {
    const { count, capRatio } = req.body;
    const result = sim.setActiveFacilityCount(count, capRatio);
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/cap-from-emissions', requireAdmin, (req, res) => {
  try {
    const { ratio, redistribute, correctionFactor, periodCaps, periodCapRatios, totalCap } = req.body;
    if (correctionFactor != null) {
      sim.parameters.correctionFactor = Number(correctionFactor);
    }
    if (periodCaps != null) {
      sim.parameters.periodCaps = periodCaps;
    }
    if (periodCapRatios != null) {
      sim.parameters.periodCapRatios = periodCapRatios;
    }
    let result = { success: true };
    if (ratio != null) {
      result = sim.recalculateCapFromEmissions(ratio, redistribute ?? true);
    } else if (totalCap != null) {
      sim.parameters.totalCap = Math.round(Number(totalCap));
      if (redistribute ?? true) {
        const activeFacilities = Object.values(sim.facilities);
        const totalBaseline = activeFacilities.reduce((sum, f) => sum + f.baselineEmissions, 0);
        const freePool = Math.round(sim.parameters.totalCap * (sim.parameters.freeAllocationRate / 100));
        activeFacilities.forEach(fac => {
          let newAlloc;
          if (sim.parameters.isImported && fac.importedAllowance != null && sim.parameters.importedBaseCap > 0) {
            newAlloc = Math.round(fac.importedAllowance * (sim.parameters.totalCap / sim.parameters.importedBaseCap) * (sim.parameters.freeAllocationRate / 100));
          } else {
            const share = totalBaseline > 0 ? fac.baselineEmissions / totalBaseline : 1 / activeFacilities.length;
            newAlloc = Math.round(freePool * share);
          }
          fac.allocatedAllowances = newAlloc;
          fac.allowances = fac.allocatedAllowances + (fac.bankedUnits || 0);
          const net = (fac.allowances + fac.offsets) - fac.actualEmissions;
          fac.complianceStatus = net > 1500 ? 'SURPLUS' : net < -1500 ? 'DEFICIT' : 'BALANCED';
        });
      }
      result = { success: true, totalCap: sim.parameters.totalCap };
    }
    broadcastState();
    res.json({ ...result, parameters: sim.parameters });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/import-facilities', requireAdmin, (req, res) => {
  try {
    const { facilities } = req.body;
    const result = sim.importFacilities(facilities);
    userManager.syncWithSimulation(sim);
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auction/start', requireAdmin, (req, res) => {
  try {
    const { quantity, reservePrice } = req.body;
    const auction = sim.startAuction(quantity, reservePrice);
    broadcastState();
    res.json({ success: true, auction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/phase/start-trading', requireAdmin, (req, res) => {
  try {
    sim.startTrading();
    broadcastState();
    res.json({ success: true, phase: sim.phase, isPaused: sim.isPaused });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/simulation/pause', requireAdmin, (req, res) => {
  try {
    const result = sim.pauseTrading();
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/simulation/resume', requireAdmin, (req, res) => {
  try {
    const result = sim.resumeTrading();
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/simulation/configure-time', requireAdmin, (req, res) => {
  try {
    const result = sim.configurePeriodTime(req.body);
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/phase/compliance', requireAdmin, (req, res) => {
  try {
    sim.openCompliance();
    broadcastState();
    res.json({ success: true, phase: sim.phase });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/phase/settle', requireAdmin, (req, res) => {
  try {
    const settlement = sim.settleCompliance();
    broadcastState();
    res.json({ success: true, settlement });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/phase/next-period', requireAdmin, (req, res) => {
  try {
    sim.advanceToNextPeriod();
    broadcastState();
    res.json({ success: true, currentPeriod: sim.currentPeriod, phase: sim.phase });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/simulation/reset', requireAdmin, (req, res) => {
  try {
    sim.resetSimulation();
    broadcastState();
    res.json({ success: true, message: 'Simulation reset' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/simulation/shock', requireAdmin, (req, res) => {
  try {
    const { shockType } = req.body;
    const result = sim.injectShock(shockType);
    broadcastState();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Serve frontend in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('ETS Simulation API Server Running. Frontend not yet built.');
  });
});

// Socket.io connection handlers
io.on('connection', (socket) => {
  socket.emit('state-update', sim.getState());
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ETS Engine] Server running on http://0.0.0.0:${PORT} (http://localhost:${PORT})`);
});
