export default function handler(req, res) {
  res.status(200).json({
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
}
