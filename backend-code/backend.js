const mqtt = require('mqtt');
const fs = require('fs');
const WebSocket = require('ws');
const mysql = require('mysql2');
const moment = require('moment');

const brokerUrl = 'mqtt://192.168.201.151:1883';

const ws = new WebSocket.Server({ port: 8080 });

const options = {
    username: 'admin',
    password: 'admin'
};


const topic = 'esp32/sensor_data';

const client = mqtt.connect(brokerUrl, options);

ws.on('connection', (ws) => {
    console.log('WebSocket connection established');

    client.on('message', (topic, message) => {
        console.log(`Received message from ${topic}: ${message.toString()}`);

        // Parse the message as JSON
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (e) {
            console.error('Failed to parse message as JSON:', e);
            return;
        }

        // Send data to WebSocket clients
        ws.send(JSON.stringify(data));
    });
});

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Subscribe to the topic
    client.subscribe(topic, (err) => {
        if (err) {
            console.error('Failed to subscribe to topic:', err);
        } else {
            console.log('Subscribed to topic:', topic);
        }
    });
});


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


client.on('message', (topic, message) => {
    console.log(`Received message from ${topic}: ${message.toString()}`);

    // Parse the message as JSON
    let data;
    try {
        data = JSON.parse(message.toString());
    } catch (e) {
        console.error('Failed to parse message as JSON:', e);
        return;
    }

    // Add datetime field to the data
    data.datetime = moment().format('YYYY-MM-DD HH:mm:ss');


    // Insert data into the database
    const query = 'INSERT INTO esp32_data SET ?';
    db.query(query, data, (err, result) => {
        if (err) {
            console.error('Failed to insert data into database:', err);
            return;
        }
        console.log('Data inserted into database:', result.insertId);
    });
});