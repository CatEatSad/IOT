const mqtt = require('mqtt');
const WebSocket = require('ws');
const mysql = require('mysql2');
const moment = require('moment');

const brokerUrl = 'mqtt://192.168.0.108:1883';
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
const wsSensor = new WebSocket.Server({ port: 8080 }); // cho sensor data
const wsDevice = new WebSocket.Server({ port: 8081 }); // cho device status

const client = mqtt.connect(brokerUrl, options);

// Xử lý kết nối WebSocket cho sensor data
wsSensor.on('connection', (ws) => {
    console.log('Sensor WebSocket connected');
    
    client.on('message', (topic, message) => {
        if (topic === 'esp32/sensor_data') {
            try {
                const data = JSON.parse(message.toString());
                // Gửi sensor data tới client
                ws.send(JSON.stringify(data));
                
                // Lưu vào database
                data.datetime = moment().format('YYYY-MM-DD HH:mm:ss');
                const query = 'INSERT INTO esp32_data SET ?';
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

// Xử lý kết nối WebSocket cho device status
wsDevice.on('connection', (ws) => {
    console.log('Device WebSocket connected');
    
    client.on('message', (topic, message) => {
        if (topic === 'esp32/devices_control/confirmed') {
            try {
                const rawData = JSON.parse(message.toString());
                // Chuyển đổi format data
                const deviceInfo = Object.entries(rawData)[0];
                if (deviceInfo[0].toLowerCase()=="air conditioner"){
                    deviceInfo[0] = "ac";
                }
                const data = {
                    deviceId: `${deviceInfo[0].toLowerCase()}-switch`,
                    state: deviceInfo[1] === 'ON'
                };
                
                // Gửi device status tới client
                ws.send(JSON.stringify(data));
            } catch (e) {
                console.error('Failed to parse device data:', e);
            }
        }
    });
});

// MQTT connection handler
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    
    // Subscribe to both topics
    client.subscribe(['esp32/sensor_data', 'esp32/devices_control/confirmed'], (err) => {
        if (err) {
            console.error('Failed to subscribe:', err);
        } else {
            console.log('Subscribed to topics');
        }
    });
});





