import { initializeDatabase, closeDatabase } from './connection';

console.log('Running database migrations...');
initializeDatabase();
closeDatabase();
console.log('Migrations complete!');