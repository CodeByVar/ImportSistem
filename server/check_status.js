import db from './db.js';

console.log('--- PRODUCTS ---');
const totalProducts = db.prepare('SELECT count(*) as c FROM products').get();
console.log('Total products:', totalProducts.c);

const demoProducts = db.prepare("SELECT id, sku, name FROM products WHERE sku LIKE 'IMP-%'").all();
console.log('Demo products (IMP-%):', demoProducts.length);
console.log(demoProducts);

console.log('\n--- CONTAINERS ---');
const containers = db.prepare('SELECT id, tracking_number, origin_country, shipping_line, status, notes FROM containers').all();
console.log('Containers count:', containers.length);
console.log(containers);

console.log('\n--- EXPENSES ---');
const expenses = db.prepare('SELECT * FROM expenses').all();
console.log('Expenses count:', expenses.length);
console.log(expenses);

console.log('\n--- MOVEMENTS ---');
const movementsCount = db.prepare('SELECT count(*) as c FROM inventory_movements').get();
console.log('Total movements:', movementsCount.c);
const demoMovements = db.prepare("SELECT count(*) as c FROM inventory_movements WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'IMP-%')").get();
console.log('Movements linked to demo products:', demoMovements.c);

console.log('\n--- IMPORT HISTORY ---');
const history = db.prepare('SELECT * FROM import_history').all();
console.log(history);
