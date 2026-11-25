const { v4: uuidv4 } = require('uuid');

class OrderBook {
  constructor(instrument = 'ALLOWANCE') {
    this.instrument = instrument; // 'ALLOWANCE' or 'OFFSET'
    this.bids = []; // Buy orders: sorted price DESC, createdAt ASC
    this.asks = []; // Sell orders: sorted price ASC, createdAt ASC
    this.trades = [];
    
    // Calibrated to Vietnam ETS: Allowance ~$5.00 USD, Credit/Offset ~$3.00 USD
    this.lastPrice = instrument === 'ALLOWANCE' ? 5.00 : 3.00;
    this.highPrice = this.lastPrice;
    this.lowPrice = this.lastPrice;
    this.volume = 0;
    
    // Seed initial price trajectory
    const now = Date.now();
    const baseP = this.lastPrice;
    this.priceHistory = [
      { time: now - 300000, price: baseP * 0.96, volume: 5000 },
      { time: now - 240000, price: baseP * 0.98, volume: 8000 },
      { time: now - 180000, price: baseP * 1.02, volume: 12000 },
      { time: now - 120000, price: baseP * 1.01, volume: 9000 },
      { time: now - 60000,  price: baseP * 0.99, volume: 15000 },
      { time: now,          price: baseP,        volume: 10000 }
    ];
  }

  reset(defaultPrice) {
    this.bids = [];
    this.asks = [];
    this.trades = [];
    this.lastPrice = defaultPrice || (this.instrument === 'ALLOWANCE' ? 5.00 : 3.00);
    this.highPrice = this.lastPrice;
    this.lowPrice = this.lastPrice;
    this.volume = 0;
    
    const now = Date.now();
    const baseP = this.lastPrice;
    this.priceHistory = [
      { time: now - 180000, price: baseP * 0.97, volume: 5000 },
      { time: now - 120000, price: baseP * 1.02, volume: 8000 },
      { time: now - 60000,  price: baseP * 0.99, volume: 12000 },
      { time: now,          price: baseP,        volume: 0 }
    ];
  }

  // Add an order and match immediately if possible
  addOrder({ facilityId, facilityName, side, type = 'LIMIT', price, quantity }) {
    price = Number(price);
    quantity = Math.floor(Number(quantity));

    if (quantity <= 0) {
      throw new Error('Order quantity must be positive');
    }
    if (type === 'LIMIT' && (isNaN(price) || price <= 0)) {
      throw new Error('Limit price must be greater than 0');
    }

    const benchmarkPrice = !isNaN(price) && Number(price) > 0 
      ? Number(price) 
      : (this.lastPrice || (this.instrument === 'ALLOWANCE' ? 5.0 : 3.0));

    const order = {
      id: uuidv4(),
      facilityId,
      facilityName,
      side, // 'BUY' or 'SELL'
      type, // 'LIMIT' or 'MARKET'
      price: type === 'MARKET' ? benchmarkPrice : price,
      originalQuantity: quantity,
      remainingQuantity: quantity,
      filledQuantity: 0,
      status: 'OPEN',
      createdAt: Date.now(),
      instrument: this.instrument
    };

    const executedTrades = this.matchOrder(order);

    if (order.remainingQuantity > 0 && order.type === 'LIMIT') {
      if (order.side === 'BUY') {
        this.bids.push(order);
        this.bids.sort((a, b) => b.price - a.price || a.createdAt - b.createdAt);
      } else {
        this.asks.push(order);
        this.asks.sort((a, b) => a.price - b.price || a.createdAt - b.createdAt);
      }
    } else if (order.remainingQuantity === 0) {
      order.status = 'FILLED';
    } else if (order.type === 'MARKET') {
      order.status = order.filledQuantity > 0 ? (order.remainingQuantity === 0 ? 'FILLED' : 'PARTIALLY_FILLED') : 'CANCELLED';
    }

    if (order.type === 'MARKET' && executedTrades.length > 0) {
      const totalTradeCost = executedTrades.reduce((s, t) => s + t.totalCost, 0);
      order.price = Math.round((totalTradeCost / order.filledQuantity) * 100) / 100;
    }

    return { order, executedTrades };
  }

  // Cancel an open order
  cancelOrder(orderId, facilityId) {
    let orderIndex = this.bids.findIndex(o => o.id === orderId && o.facilityId === facilityId);
    let removedOrder = null;

    if (orderIndex !== -1) {
      removedOrder = this.bids.splice(orderIndex, 1)[0];
    } else {
      orderIndex = this.asks.findIndex(o => o.id === orderId && o.facilityId === facilityId);
      if (orderIndex !== -1) {
        removedOrder = this.asks.splice(orderIndex, 1)[0];
      }
    }

    if (removedOrder) {
      removedOrder.status = 'CANCELLED';
      return removedOrder;
    }
    return null;
  }

  // Match an incoming order against opposite book
  matchOrder(incomingOrder) {
    const executedTrades = [];
    const oppositeList = incomingOrder.side === 'BUY' ? this.asks : this.bids;

    while (oppositeList.length > 0 && incomingOrder.remainingQuantity > 0) {
      const topOrder = oppositeList[0];

      // Prevent self match
      if (topOrder.facilityId === incomingOrder.facilityId) {
        break;
      }

      // Check price crossing (Market orders always cross opposite book)
      const canMatch = incomingOrder.type === 'MARKET'
        ? true
        : (incomingOrder.side === 'BUY'
            ? incomingOrder.price >= topOrder.price
            : incomingOrder.price <= topOrder.price);

      if (!canMatch) {
        break;
      }

      const executionPrice = topOrder.price;
      const tradeQty = Math.min(incomingOrder.remainingQuantity, topOrder.remainingQuantity);

      incomingOrder.remainingQuantity -= tradeQty;
      incomingOrder.filledQuantity += tradeQty;
      topOrder.remainingQuantity -= tradeQty;
      topOrder.filledQuantity += tradeQty;

      const buyer = incomingOrder.side === 'BUY' ? incomingOrder : topOrder;
      const seller = incomingOrder.side === 'SELL' ? incomingOrder : topOrder;

      const trade = {
        id: uuidv4(),
        instrument: this.instrument,
        price: executionPrice,
        quantity: tradeQty,
        totalCost: Math.round(executionPrice * tradeQty * 100) / 100,
        buyerFacilityId: buyer.facilityId,
        buyerFacilityName: buyer.facilityName,
        sellerFacilityId: seller.facilityId,
        sellerFacilityName: seller.facilityName,
        timestamp: Date.now()
      };

      this.trades.unshift(trade);
      if (this.trades.length > 200) this.trades.pop();

      executedTrades.push(trade);

      // Update statistics
      this.lastPrice = executionPrice;
      if (executionPrice > this.highPrice) this.highPrice = executionPrice;
      if (executionPrice < this.lowPrice) this.lowPrice = executionPrice;
      this.volume += tradeQty;

      this.priceHistory.push({
        time: Date.now(),
        price: executionPrice,
        volume: tradeQty
      });
      if (this.priceHistory.length > 300) {
        this.priceHistory.shift();
      }

      if (topOrder.remainingQuantity === 0) {
        topOrder.status = 'FILLED';
        oppositeList.shift();
      } else {
        topOrder.status = 'PARTIALLY_FILLED';
      }
    }

    if (incomingOrder.remainingQuantity === 0) {
      incomingOrder.status = 'FILLED';
    } else if (incomingOrder.filledQuantity > 0) {
      incomingOrder.status = 'PARTIALLY_FILLED';
    }

    return executedTrades;
  }

  // Get aggregated depth ladder
  getDepth(levels = 8) {
    const aggregate = (orders, isBid) => {
      const map = new Map();
      for (const order of orders) {
        const p = order.price;
        map.set(p, (map.get(p) || 0) + order.remainingQuantity);
      }
      const sortedPrices = Array.from(map.keys()).sort((a, b) => isBid ? b - a : a - b);
      let cumulative = 0;
      return sortedPrices.slice(0, levels).map(price => {
        const qty = map.get(price);
        cumulative += qty;
        return { price, quantity: qty, cumulative };
      });
    };

    return {
      bids: aggregate(this.bids, true),
      asks: aggregate(this.asks, false)
    };
  }

  getState() {
    return {
      instrument: this.instrument,
      lastPrice: this.lastPrice,
      highPrice: this.highPrice,
      lowPrice: this.lowPrice,
      volume: this.volume,
      depth: this.getDepth(),
      bids: this.bids,
      asks: this.asks,
      bidsCount: this.bids.length,
      asksCount: this.asks.length,
      recentTrades: this.trades.slice(0, 30),
      priceHistory: this.priceHistory.slice(-100)
    };
  }
}

module.exports = { OrderBook };
