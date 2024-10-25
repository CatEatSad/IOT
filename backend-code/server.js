const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const mqtt = require('mqtt'); 
const moment = require('moment')// Import the cors package
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors()); // Use the cors middleware

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'esp_32'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// API endpoint to get data
app.post('/api/sensor-data', (req, res) => {
  const { currentPage, rowsPerPage } = req.body;
  const offset = (currentPage - 1) * rowsPerPage;

  if (isNaN(rowsPerPage) || isNaN(currentPage)) {
    return res.status(400).send('Invalid query parameters');
  }

  const query = 'SELECT humidity, temperature, lux, datetime FROM esp32_data ORDER BY datetime DESC LIMIT ? OFFSET ?';
  connection.query(query, [rowsPerPage, offset], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).send('Database query error');
    }
    
    console.log('Received data:', results); // Print received data to terminal
    
    res.json(results);
  });
});
app.post('/api/search/sensor-data', (req, res) => {
    const { currentPage, rowsPerPage } = req.body;
    const offset = (currentPage - 1) * rowsPerPage;
  
    if (isNaN(rowsPerPage) || isNaN(currentPage)) {
      return res.status(400).send('Invalid query parameters');
    }
  
    const query = 'SELECT humidity, temperature, lux, datetime FROM esp32_data ORDER BY datetime DESC LIMIT ? OFFSET ?';
    connection.query(query, [rowsPerPage, offset], (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        return res.status(500).send('Database query error');
      }
      
      console.log('Received data:', results); // Print received data to terminal
      
      res.json(results);
    });
  });

  const brokerUrl = 'mqtt://192.168.201.151:1883';
  const options = {
    username: 'admin',
    password: 'admin'
  };
  const client = mqtt.connect(brokerUrl, options);
  
  
  // Hàm publish trạng thái cho bất kỳ thiết bị nào
  function publishDeviceState(deviceName, state) {
    const topic = 'esp32/led_control';
    const payload = JSON.stringify({ [deviceName]: state });
    client.publish(topic, payload, (err) => {
      if (err) {
        console.error('Error publishing to MQTT:', err);
      } else {
        console.log(`Published to topic ${topic}:`, payload);
      }
    });
  }
  
  // API endpoint to get data
  app.post('/api/switch-state', (req, res) => {
    const { deviceName, deviceId, timestamp, state } = req.body;
    const stateString = state ? 'ON' : 'OFF';
    const formattedTimestamp = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  
    const query = 'INSERT INTO switch_states (device_name, device_id, timestamp, state) VALUES (?, ?, ?, ?)';
    const values = [deviceName, deviceId, formattedTimestamp, stateString];
  
    connection.query(query, values, (err, results) => {
      if (err) {
        console.error('Error inserting data into MySQL:', err);
        res.status(500).send('Error inserting data');
        return;
      }
  
      // Publish to MQTT topic
      const payload = JSON.stringify({ deviceName, deviceId, timestamp: formattedTimestamp, state: stateString });
    });
    publishDeviceState(deviceName, stateString);
  
    console.log('Received switch state:', values); // Print received data to terminal
  });
  

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});