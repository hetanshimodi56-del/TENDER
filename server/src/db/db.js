const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Initial schema structure matching Enterprise RBAC Specification
const defaultSchema = {
  users: [],
  roles: [],
  permissions: [],
  role_permissions: [],
  departments: [],
  companies: [],
  tenders: [],
  bids: [],
  documents: [],
  notifications: [],
  audit_logs: [],
  sessions: [],
  password_resets: [],
  organizations: [],
  tender_authorities: [],
  company_profiles: [],
  user_preferences: [],
  tender_documents: [],
  saved_tenders: [],
  tender_tasks: [],
  categories: [],
  system_settings: [],
  tender_alerts: [],
  eligibility_checks: [],
  ai_recommendations: [],
  ai_chat_history: []
};

class Database {
  constructor() {
    this.dbPath = DB_FILE;
    this.data = defaultSchema;
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all tables exist
        for (const key of Object.keys(defaultSchema)) {
          if (!this.data[key]) {
            this.data[key] = [];
          }
        }
      } catch (err) {
        console.error('Error reading database file, initializing fresh:', err);
        this.data = defaultSchema;
        this.save();
      }
    } else {
      this.data = defaultSchema;
      this.save();
    }
  }

  save() {
    try {
      const tempPath = this.dbPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // Table operations
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

  insert(tableName, record) {
    const table = this.getTable(tableName);
    const newRecord = {
      id: record.id || (tableName.substring(0, 3) + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)),
      ...record,
      created_at: record.created_at || new Date().toISOString()
    };
    table.push(newRecord);
    this.save();
    return newRecord;
  }

  update(tableName, predicate, updates) {
    const table = this.getTable(tableName);
    let updatedCount = 0;
    for (let i = 0; i < table.length; i++) {
      if (predicate(table[i])) {
        table[i] = {
          ...table[i],
          ...updates,
          updated_at: new Date().toISOString()
        };
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      this.save();
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
      this.save();
      return table[index];
    }
    return null;
  }

  delete(tableName, predicate) {
    const table = this.getTable(tableName);
    const initialLen = table.length;
    this.data[tableName] = table.filter(item => !predicate(item));
    const deletedCount = initialLen - this.data[tableName].length;
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }

  deleteById(tableName, id) {
    return this.delete(tableName, item => String(item.id) === String(id)) > 0;
  }

  count(tableName, predicate = () => true) {
    return this.find(tableName, predicate).length;
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(defaultSchema));
    this.save();
  }
}

const db = new Database();
module.exports = db;
