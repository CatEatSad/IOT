const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const mqtt = require('mqtt'); 
const moment = require('moment');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());


// MySQL connection setup với handling reconnect
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'esp_32'
});

function handleDisconnect() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'esp_32'
    });

    connection.connect(err => {
        if(err) {
            console.error('Error connecting to MySQL:', err);
            setTimeout(handleDisconnect, 2000);
            return;
        }
        console.log('Connected to MySQL');
    });

    connection.on('error', function(err) {
        console.error('MySQL error:', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Lost connection to MySQL. Reconnecting...');
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

// MQTT Setup with error handling
const brokerUrl = 'mqtt://192.168.142.52:1883';
const options = {
    username: 'admin',
    password: 'admin',
    reconnectPeriod: 1000, // Tự động reconnect sau 1 giây
    connectTimeout: 30 * 1000 // Timeout sau 30 giây
};

const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

client.on('error', (error) => {
    console.error('MQTT error:', error);
});

client.on('close', () => {
    console.log('MQTT connection closed');
});

client.on('reconnect', () => {
    console.log('Attempting to reconnect to MQTT broker');
});

// Cải thiện hàm publish MQTT
function publishDeviceState(deviceName, state) {
    return new Promise((resolve, reject) => {
        const topic = 'esp32/devices_control';
        const payload = JSON.stringify({ [deviceName]: state });
        console.log('Attempting to publish:', { topic, payload });

        client.publish(topic, payload, (err) => {
            if (err) {
                console.error('Error publishing to MQTT:', err);
                reject(err);
            } else {
                console.log(`Successfully published to topic ${topic}:`, payload);
                resolve();
            }
        });
    });
}



// Add this endpoint to your existing Express server
// Search sensor data endpoint
app.get('/api/search-sensor-data', async (req, res) => {
    try {
      const currentPage = parseInt(req.query.currentPage) || 1;
      const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;
      const { searchCriteria, searchValue, startDate, endDate } = req.query;
  
      // Validate input parameters
      if (!Number.isInteger(currentPage) || currentPage < 1) {
        throw new Error('Invalid page number');
      }
      if (!Number.isInteger(rowsPerPage) || rowsPerPage < 1) {
        throw new Error('Invalid rows per page');
      }
  
      const offset = (currentPage - 1) * rowsPerPage;
      let query = 'SELECT humidity, temperature, lux, datetime FROM esp32_data';
      let countQuery = 'SELECT COUNT(*) as total FROM esp32_data';
      let whereClause = '';
      let queryParams = [];

      // Build where clause based on search criteria
      if (searchCriteria && (searchValue || startDate || endDate)) {
          whereClause = ' WHERE ';
          
          switch (searchCriteria) {
              case 'temperature':
                  // Search with a small range for floating point values
                  whereClause += 'temperature BETWEEN ? - 0.5 AND ? + 0.5';
                  queryParams.push(parseFloat(searchValue), parseFloat(searchValue));
                  break;

              case 'humidity':
                  whereClause += 'humidity BETWEEN ? - 0.5 AND ? + 0.5';
                  queryParams.push(parseFloat(searchValue), parseFloat(searchValue));
                  break;

              case 'lux':
                  whereClause += 'lux BETWEEN ? - 10 AND ? + 10';
                  queryParams.push(parseFloat(searchValue), parseFloat(searchValue));
                  break;

              case 'date':
                  const conditions = [];
                  if (startDate) {
                      conditions.push('DATE(datetime) >= ?');
                      queryParams.push(startDate);
                  }
                  if (endDate) {
                      conditions.push('DATE(datetime) <= ?');
                      queryParams.push(endDate);
                  }
                  if (conditions.length > 0) {
                      whereClause += conditions.join(' AND ');
                  } else {
                      whereClause = '';
                  }
                  break;
          }
      }
  
      // Add where clause to queries if it exists
      if (whereClause) {
        query += whereClause;
        countQuery += whereClause;
      }
  
      // Add ordering and pagination
      query += ' ORDER BY datetime DESC LIMIT ? OFFSET ?';
      const paginationParams = [parseInt(rowsPerPage), offset];
      // Execute both queries using Promise.all
      const [totalCount, data] = await Promise.all([
        new Promise((resolve, reject) => {
          connection.query(countQuery, queryParams, (err, results) => {
            if (err) reject(err);
            else resolve(results[0].total);
          });
        }),
        new Promise((resolve, reject) => {
          connection.query(
            query, 
            [...queryParams, ...paginationParams], 
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        })
      ]);
  
      // Calculate total pages
      const totalPages = Math.ceil(totalCount / rowsPerPage);
      
      // Send response
      res.json({
        success: true,
        data,
        pagination: {
          currentPage: parseInt(currentPage),
          rowsPerPage: parseInt(rowsPerPage),
          totalCount,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1
        }
      });
  
    } catch (error) {
      console.error('Error in search-sensor-data:', error);
      res.status(500).json({
        success: false,
        error: 'Search operation failed',
        message: error.message
      });
    }
});






// Add this endpoint to your existing Express server
app.get('/api/search-switch-state', async (req, res) => {
    try {
      const currentPage = parseInt(req.query.currentPage) || 1;
      const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;
      const { startDate, endDate } = req.query;
  
      // Validate input parameters
      if (!Number.isInteger(currentPage) || currentPage < 1) {
        throw new Error('Invalid page number');
      }
      if (!Number.isInteger(rowsPerPage) || rowsPerPage < 1) {
        throw new Error('Invalid rows per page');
      }
  
      const offset = (currentPage - 1) * rowsPerPage;
      let query = `
        SELECT 
          Devices.id_device as id,
          switch_states.device_name,
          switch_states.device_id,
          switch_states.timestamp,
          switch_states.state
        FROM switch_states 
        INNER JOIN Devices ON switch_states.device_id = Devices.name_device
      `;
  
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM switch_states 
        INNER JOIN Devices ON switch_states.device_id = Devices.name_device
      `;
  
      let whereClause = '';
      let queryParams = [];
  
      // Build where clause based on date filters
      if (startDate || endDate) {
        whereClause = ' WHERE ';
        const conditions = [];
        if (startDate) {
          conditions.push('DATE(switch_states.timestamp) >= ?');
          queryParams.push(startDate);
        }
        if (endDate) {
          conditions.push('DATE(switch_states.timestamp) <= ?');
          queryParams.push(endDate);
        }
        if (conditions.length > 0) {
          whereClause += conditions.join(' AND ');
        } else {
          whereClause = '';
        }
      }
  
      // Append where clause to queries
      query += whereClause;
      countQuery += whereClause;
  
      // Add sorting and pagination
      query += ' ORDER BY switch_states.timestamp DESC LIMIT ? OFFSET ?';
      const paginationParams = [parseInt(rowsPerPage), offset];
  
      // Execute both queries using Promise.all
      const [totalCount, data] = await Promise.all([
        new Promise((resolve, reject) => {
          connection.query(countQuery, queryParams, (err, results) => {
            if (err) reject(err);
            else resolve(results[0].total);
          });
        }),
        new Promise((resolve, reject) => {
          connection.query(
            query, 
            [...queryParams, ...paginationParams], 
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        })
      ]);
  
      // Calculate total pages
      const totalPages = Math.ceil(totalCount / rowsPerPage);
      
      // Send response
      res.json({
        success: true,
        data,
        pagination: {
          currentPage: parseInt(currentPage),
          rowsPerPage: parseInt(rowsPerPage),
          totalCount,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1
        }
      });
  
    } catch (error) {
      console.error('Error in search-switch-state:', error);
      res.status(500).json({
        success: false,
        error: 'Search operation failed',
        message: error.message
      });
    }
  });


app.post('/api/switch-state', async (req, res) => {
    const { deviceName, deviceId, timestamp, state } = req.body;
    const stateString = state ? 'ON' : 'OFF';
    const formattedTimestamp = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');

    console.log('Received switch state request:', { deviceName, deviceId, state: stateString });

    try {
        // Đầu tiên publish tới MQTT
        await publishDeviceState(deviceName, stateString);

        // Sau đó lưu vào database
        const query = 'INSERT INTO switch_states (device_name, device_id, timestamp, state) VALUES (?, ?, ?, ?)';
        const values = [deviceName, deviceId, formattedTimestamp, stateString];

        connection.query(query, values, (err, results) => {
            if (err) {
                console.error('Error inserting data into MySQL:', err);
                return res.status(500).json({ 
                    error: 'Database error', 
                    details: err.message 
                });
            }

            console.log('Successfully saved switch state to database:', results);
            res.status(200).json({
                success: true,
                message: 'State updated successfully',
                data: {
                    deviceName,
                    deviceId,
                    timestamp: formattedTimestamp,
                    state: stateString,
                    dbResult: results
                }
            });
        });
    } catch (error) {
        console.error('Error in switch state handling:', error);
        res.status(500).json({
            error: 'Failed to update device state',
            details: error.message
        });
    }
});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});