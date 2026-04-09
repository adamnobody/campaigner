import { initializeDatabase, closeDatabase } from './connection.js';

console.log('Running database migrations...');
initializeDatabase();
closeDatabase();
console.log('Migrations complete!');