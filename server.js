require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    adminInviteCode: process.env.ADMIN_INVITE_CODE || 'AUREUM-ADMIN-2026',
    firmName: process.env.FIRM_NAME || '',
    lawyerName: process.env.LAWYER_NAME || '',
    lawyerOab: process.env.LAWYER_OAB || '',
    lawyerEmail: process.env.LAWYER_EMAIL || '',
    lawyerPhone: process.env.LAWYER_PHONE || '',
    firmAddress: process.env.FIRM_ADDRESS || ''
  });
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get(['/', '/inicio'], (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get(['/login', '/cadastro'], (req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.get(['/cliente', '/portal'], (req, res) => res.sendFile(path.join(publicDir, 'cliente.html')));
app.get(['/admin', '/painel'], (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));

app.use((req, res) => res.status(404).sendFile(path.join(publicDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`⚖️  AUREUM ADVOCACIA ativo em http://localhost:${PORT}`);
});
