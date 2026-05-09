const express = require('express');
const path = require('path');
const app = express();

const dist = path.join(__dirname, 'dist/bricoleup/browser');

app.use(express.static(dist));

app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
