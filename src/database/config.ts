import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mysql.dev.saude.pa.gov.br',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'saude_para',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;