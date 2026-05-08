const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;
const DIST = path.join(__dirname, 'dist', 'bricoleup', 'browser');

// Fichiers statiques
app.use(express.static(DIST));

// Toutes les routes → index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend BricoleUp running on port ${PORT}`);
});
