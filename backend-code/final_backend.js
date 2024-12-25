const mqtt = require('mqtt');
const WebSocket = require('ws');
const mysql = require('mysql2');
const moment = require('moment');

const brokerUrl = 'mqtt://192.168.142.52:1883';
const options = {
    username: 'admin',
    password: 'admin'
};


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'esp_32'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Tạo hai WebSocket server riêng biệt cho hai loại dữ liệu
const wsSensor = new WebSocket.Server({ port: 8082 }); // cho sensor data

const client = mqtt.connect(brokerUrl, options);

// Xử lý kết nối WebSocket cho sensor data
wsSensor.on('connection', (ws) => {
    console.log('Sensor WebSocket connected');
    
    client.on('message', (topic, message) => {
        if (topic === 'esp32/sensor_data') {
            try {
                const data = JSON.parse(message.toString());
                console.log(data);
                // Gửi sensor data tới client
                ws.send(JSON.stringify(data));
                
                // Lưu vào database
                data.datetime = moment().format('YYYY-MM-DD HH:mm:ss');
                const query = 'INSERT INTO Bai_5 SET ?';
                db.query(query, data, (err, result) => {
                    if (err) {
                        console.error('Failed to insert data:', err);
                    }
                });
            } catch (e) {
                console.error('Failed to parse sensor data:', e);
            }
        }
    });
});



// MQTT connection handler
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    
    // Subscribe to both topics
    client.subscribe(['esp32/sensor_data'], (err) => {
        if (err) {
            console.error('Failed to subscribe:', err);
        } else {
            console.log('Subscribed to topics');
        }
    });
});





