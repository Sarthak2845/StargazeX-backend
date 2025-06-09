const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { router: userRoutes } = require('./routes/user');
const eventRoutes = require('./routes/events');
const newsRoutes = require('./routes/spaceNews');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
