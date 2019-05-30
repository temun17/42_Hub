const express = require('express');
const connectDB = require('./config/db');

const app = express();

//CONNECT DATABASE
connectDB();

app.get('/', (req, res) => res.send('API Running'));

// INIT MIDDLEWARE
// express.json is the same as bodyParser.json to use (req.body)
app.use(express.json({extended: false}));

//DEFINE ROUTES
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 4242;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));