export default (req, res) => {
  res.status(200).json({
    message: 'ScriptBlox API',
    version: '1.0.0',
    status: 'Running on Vercel',
    endpoints: {
      health: '/api/health'
    }
  });
};
