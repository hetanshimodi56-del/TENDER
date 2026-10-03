const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// MongoDB Connection URI - Change this if using Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'ai-etender';

// Fallback JSON logic to support existing schema structure during loading
const defaultSchema = {
  users: [], roles: [], permissions: [], role_permissions: [], departments: [],
  companies: [], tenders: [], bids: [], documents: [], notifications: [],
  audit_logs: [], sessions: [], password_resets: [], organizations: [],
  tender_authorities: [], company_profiles: [], user_preferences: [],
  tender_documents: [], saved_tenders: [], tender_tasks: [], categories: [],
  system_settings: [], tender_alerts: [], eligibility_checks: [],
  ai_recommendations: [], ai_chat_history: []
};

class Database {
  constructor() {
    this.data = JSON.parse(JSON.stringify(defaultSchema));
    this.db = null;
    this.client = null;
    this.connected = false;
    this.init();
  }

  async init() {
    try {
      this.client = new MongoClient(MONGO_URI);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      this.connected = true;
      console.log('✅ Connected to MongoDB successfully.');

      // Load all collections into memory to support synchronous APIs
      for (const key of Object.keys(defaultSchema)) {
        const collection = this.db.collection(key);
        const docs = await collection.find({}).toArray();
        this.data[key] = docs.length > 0 ? docs : [];
      }
      
      // If DB is totally empty, seed it from the existing JSON database
      const DB_FILE = path.join(__dirname, '..', '..', 'data', 'database.json');
      if (fs.existsSync(DB_FILE) && this.count('users') === 0) {
        console.log('🔄 MongoDB is empty. Migrating data from database.json...');
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf8');
          const jsonData = JSON.parse(raw);
          for (const key of Object.keys(defaultSchema)) {
            if (jsonData[key] && jsonData[key].length > 0) {
              this.data[key] = jsonData[key];
              await this.db.collection(key).insertMany(jsonData[key]);
            }
          }
          console.log('✅ Migration to MongoDB complete.');
        } catch(e) {
          console.error('Migration failed:', e);
        }
      } else {
        console.log('✅ In-memory sync with MongoDB complete.');
      }
      
    } catch (err) {
      console.error('❌ MongoDB Connection Error. Ensure MongoDB is running locally on port 27017:', err.message);
      // Fallback to empty in-memory if MongoDB is down
      const DB_FILE = path.join(__dirname, '..', '..', 'data', 'database.json');
      if (fs.existsSync(DB_FILE)) {
         this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      }
    }
  }

  // Table operations - Synchronous reads
  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    return this.data[tableName];
  }

  find(tableName, predicate = () => true) {
    const table = this.getTable(tableName);
    return table.filter(predicate);
  }

  findOne(tableName, predicate) {
    const table = this.getTable(tableName);
    return table.find(predicate) || null;
  }

  findById(tableName, id) {
    const table = this.getTable(tableName);
    return table.find(item => String(item.id) === String(id)) || null;
  }

  // Asynchronous writes that return immediately for synchronous APIs
  insert(tableName, record) {
    const table = this.getTable(tableName);
    const newRecord = {
      id: record.id || (tableName.substring(0, 3) + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)),
      ...record,
      created_at: record.created_at || new Date().toISOString()
    };
    table.push(newRecord);
    
    // Background MongoDB Sync
    if (this.connected) {
      this.db.collection(tableName).insertOne({ ...newRecord }).catch(console.error);
    }
    
    return newRecord;
  }

  update(tableName, predicate, updates) {
    const table = this.getTable(tableName);
    let updatedCount = 0;
    const idsToUpdate = [];
    
    for (let i = 0; i < table.length; i++) {
      if (predicate(table[i])) {
        table[i] = {
          ...table[i],
          ...updates,
          updated_at: new Date().toISOString()
        };
        idsToUpdate.push(table[i].id);
        updatedCount++;
      }
    }
    
    if (updatedCount > 0 && this.connected) {
      this.db.collection(tableName).updateMany(
        { id: { $in: idsToUpdate } },
        { $set: { ...updates, updated_at: new Date().toISOString() } }
      ).catch(console.error);
    }
    
    return updatedCount;
  }

  updateById(tableName, id, updates) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => String(item.id) === String(id));
    if (index !== -1) {
      table[index] = {
        ...table[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      if (this.connected) {
        this.db.collection(tableName).updateOne(
          { id: id },
          { $set: { ...updates, updated_at: new Date().toISOString() } }
        ).catch(console.error);
      }
      return table[index];
    }
    return null;
  }

  delete(tableName, predicate) {
    const table = this.getTable(tableName);
    const idsToDelete = [];
    
    for (const item of table) {
      if (predicate(item)) {
        idsToDelete.push(item.id);
      }
    }
    
    this.data[tableName] = table.filter(item => !predicate(item));
    
    if (idsToDelete.length > 0 && this.connected) {
      this.db.collection(tableName).deleteMany({ id: { $in: idsToDelete } }).catch(console.error);
    }
    
    return idsToDelete.length;
  }

  deleteById(tableName, id) {
    return this.delete(tableName, item => String(item.id) === String(id)) > 0;
  }

  count(tableName, predicate = () => true) {
    return this.find(tableName, predicate).length;
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(defaultSchema));
    if (this.connected) {
      for (const key of Object.keys(defaultSchema)) {
        this.db.collection(key).deleteMany({}).catch(console.error);
      }
    }
  }
}

const db = new Database();
module.exports = db;
