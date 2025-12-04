//Khởi tạo server.js
const express = require('express');
const cors = require('cors');

const PORT = 51232;
const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.json({
        message: 'Server đang chạy!',
        timestamp: new Date().toISOString()
    })
})

app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
})